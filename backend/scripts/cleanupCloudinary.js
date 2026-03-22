/**
 * ============================================================
 *  Cloudinary Orphan Image Cleanup Script
 *  Run once: node scripts/cleanupCloudinary.js
 * ============================================================
 *
 * কী করে:
 *  1. MongoDB থেকে সব active image URLs collect করে
 *  2. Cloudinary থেকে সব uploaded images list করে
 *  3. যেগুলো DB তে নেই সেগুলো Cloudinary থেকে delete করে
 *
 * Folders covered:
 *  - booknverse/books     (book cover images)
 *  - booknverse/authors   (author photos)
 *  - booknverse/avatars   (user avatars)
 *  - booknverse/covers    (user cover images)
 * ============================================================
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const mongoose   = require('mongoose');

// ── Cloudinary config ─────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Mongoose Models (inline — no need to import full app) ─────
const User = require('../models/User');
const Book = require('../models/Book');
const Author = require('../models/Author');

// ── Helper: extract public_id from Cloudinary URL ─────────────
const getPublicId = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

// ── Helper: get all resources from a Cloudinary folder ────────
const getAllCloudinaryResources = async (folder) => {
  const resources = [];
  let nextCursor = null;

  do {
    const options = {
      type: 'upload',
      prefix: folder,
      max_results: 500,
    };
    if (nextCursor) options.next_cursor = nextCursor;

    const result = await cloudinary.api.resources(options);
    resources.push(...result.resources);
    nextCursor = result.next_cursor || null;
  } while (nextCursor);

  return resources;
};

// ── Main cleanup function ─────────────────────────────────────
const cleanup = async () => {
  console.log('\n🚀 Cloudinary Cleanup Script starting...\n');

  // 1. MongoDB connect
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected\n');

  // ── Step 2: DB থেকে সব active image URLs collect করো ────────
  console.log('📦 Database active image URLs collecting...');

  const [books, authors, users] = await Promise.all([
    Book.find().select('coverImage'),
    Author.find().select('photo'),
    User.find().select('avatar coverImage'),
  ]);

  // সব active public IDs একটা Set এ রাখো
  const activePublicIds = new Set();

  books.forEach(b => {
    const id = getPublicId(b.coverImage);
    if (id) activePublicIds.add(id);
  });

  authors.forEach(a => {
    const id = getPublicId(a.photo);
    if (id) activePublicIds.add(id);
  });

  users.forEach(u => {
    const avatarId = getPublicId(u.avatar);
    const coverId  = getPublicId(u.coverImage);
    if (avatarId) activePublicIds.add(avatarId);
    if (coverId)  activePublicIds.add(coverId);
  });

  console.log(`✅ DB active images: ${activePublicIds.size} number\n`);

  // ── Step 3: Cloudinary থেকে সব images list করো ──────────────
  const folders = [
    'booknverse/books',
    'booknverse/authors',
    'booknverse/avatars',
    'booknverse/covers',
  ];

  console.log('☁️  Cloudinary images fetchching...');

  let allCloudinaryResources = [];
  for (const folder of folders) {
    try {
      const resources = await getAllCloudinaryResources(folder);
      console.log(`   📁 ${folder}: ${resources.length} image collected`);
      allCloudinaryResources.push(...resources);
    } catch (err) {
      console.warn(`   ⚠️  ${folder} folder fetch create a problem: ${err.message}`);
    }
  }

  console.log(`\n✅ Cloudinary total images: ${allCloudinaryResources.length} number\n`);

  // ── Step 4: Orphan images খুঁজে বের করো ─────────────────────
  const orphans = allCloudinaryResources.filter(
    (r) => !activePublicIds.has(r.public_id)
  );

  console.log(`🔍 Orphan images: ${orphans.length} number`);

  if (orphans.length === 0) {
    console.log('\n🎉 there are orphan image! Cloudinary full clean ।');
    await mongoose.disconnect();
    return;
  }

  // ── Step 5: Orphan images delete করো ─────────────────────────
  console.log('\n🗑️  Orphan images deleteting...\n');

  let deletedCount = 0;
  let failedCount  = 0;
  const failedIds  = [];

  // Cloudinary batch delete — max 100 at a time
  const BATCH_SIZE = 100;
  const batches = [];
  for (let i = 0; i < orphans.length; i += BATCH_SIZE) {
    batches.push(orphans.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < batches.length; i++) {
    const batch      = batches[i];
    const publicIds  = batch.map((r) => r.public_id);

    try {
      const result = await cloudinary.api.delete_resources(publicIds);

      // result.deleted এ প্রতিটার status থাকে
      for (const [id, status] of Object.entries(result.deleted)) {
        if (status === 'deleted') {
          deletedCount++;
          console.log(`   ✅ Deleted: ${id}`);
        } else {
          failedCount++;
          failedIds.push(id);
          console.log(`   ❌ Failed:  ${id} (status: ${status})`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Batch ${i + 1} delete error: ${err.message}`);
      failedCount += batch.length;
      failedIds.push(...publicIds);
    }
  }

  // ── Step 6: Summary ───────────────────────────────────────────
  console.log('\n' + '='.repeat(50));
  console.log('📊 Cleanup Summary:');
  console.log('='.repeat(50));
  console.log(`   Total orphan images found : ${orphans.length}`);
  console.log(`   ✅ Successfully deleted    : ${deletedCount}`);
  console.log(`   ❌ Failed to delete        : ${failedCount}`);

  if (failedIds.length > 0) {
    console.log('\n   Failed IDs:');
    failedIds.forEach(id => console.log(`     - ${id}`));
  }

  console.log('='.repeat(50));
  console.log('\n✅ Cleanup done!\n');

  await mongoose.disconnect();
};

// ── Run ───────────────────────────────────────────────────────
cleanup().catch((err) => {
  console.error('❌ Script error:', err);
  mongoose.disconnect();
  process.exit(1);
});
