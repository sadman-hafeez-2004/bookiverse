/**
 * ============================================================
 *  Database Count Recalculation Script
 *  Run once: node scripts/recalculateCounts.js
 * ============================================================
 */

require('dotenv').config();
const mongoose   = require('mongoose');
const User       = require('../models/User');
const Book       = require('../models/Book');
const Author     = require('../models/Author');
const Collection = require('../models/Collection');
const Follow     = require('../models/Follow');
const Review     = require('../models/Review');

const recalculate = async () => {
  console.log('\n🚀 Count Recalculation শুরু হচ্ছে...\n');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected\n');

  // 1. User.collectedCount
  console.log('📚 User.collectedCount...');
  const collectionCounts = await Collection.aggregate([
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);
  await User.updateMany({}, { collectedCount: 0 });
  await Promise.all(collectionCounts.map(({ _id, count }) =>
    User.findByIdAndUpdate(_id, { collectedCount: count })
  ));
  console.log(`   ✅ ${collectionCounts.length} users updated`);

  // 2. User.followersCount
  console.log('👥 User.followersCount...');
  const followerCounts = await Follow.aggregate([
    { $group: { _id: '$following', count: { $sum: 1 } } },
  ]);
  await User.updateMany({}, { followersCount: 0 });
  await Promise.all(followerCounts.map(({ _id, count }) =>
    User.findByIdAndUpdate(_id, { followersCount: count })
  ));
  console.log(`   ✅ ${followerCounts.length} users updated`);

  // 3. User.followingCount
  console.log('👥 User.followingCount...');
  const followingCounts = await Follow.aggregate([
    { $group: { _id: '$follower', count: { $sum: 1 } } },
  ]);
  await User.updateMany({}, { followingCount: 0 });
  await Promise.all(followingCounts.map(({ _id, count }) =>
    User.findByIdAndUpdate(_id, { followingCount: count })
  ));
  console.log(`   ✅ ${followingCounts.length} users updated`);

  // 4. Author.booksCount
  console.log('✍️  Author.booksCount...');
  const authorBookCounts = await Book.aggregate([
    { $group: { _id: '$author', count: { $sum: 1 } } },
  ]);
  await Author.updateMany({}, { booksCount: 0 });
  await Promise.all(authorBookCounts.map(({ _id, count }) =>
    Author.findByIdAndUpdate(_id, { booksCount: count })
  ));
  console.log(`   ✅ ${authorBookCounts.length} authors updated`);

  // 5. Book.collectionsCount
  console.log('📖 Book.collectionsCount...');
  const bookCollectionCounts = await Collection.aggregate([
    { $group: { _id: '$book', count: { $sum: 1 } } },
  ]);
  await Book.updateMany({}, { collectionsCount: 0 });
  await Promise.all(bookCollectionCounts.map(({ _id, count }) =>
    Book.findByIdAndUpdate(_id, { collectionsCount: count })
  ));
  console.log(`   ✅ ${bookCollectionCounts.length} books updated`);

  // 6. Book.reviewsCount & averageRating
  console.log('⭐ Book.reviewsCount & averageRating...');
  const bookReviewStats = await Review.aggregate([
    { $group: { _id: '$book', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
  ]);
  await Book.updateMany({}, { reviewsCount: 0, averageRating: 0 });
  await Promise.all(bookReviewStats.map(({ _id, count, avgRating }) =>
    Book.findByIdAndUpdate(_id, {
      reviewsCount:  count,
      averageRating: Math.round(avgRating * 10) / 10,
    })
  ));
  console.log(`   ✅ ${bookReviewStats.length} books updated`);

  console.log('\n' + '='.repeat(50));
  console.log('✅ User.collectedCount   — done');
  console.log('✅ User.followersCount   — done');
  console.log('✅ User.followingCount   — done');
  console.log('✅ Author.booksCount     — done');
  console.log('✅ Book.collectionsCount — done');
  console.log('✅ Book.reviewsCount     — done');
  console.log('✅ Book.averageRating    — done');
  console.log('='.repeat(50));
  console.log('\n🎉 সব counts সঠিক হয়ে গেছে!\n');

  await mongoose.disconnect();
};

recalculate().catch(err => {
  console.error('❌ Error:', err);
  mongoose.disconnect();
  process.exit(1);
});
