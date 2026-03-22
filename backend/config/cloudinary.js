const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract the Cloudinary public_id from a full URL.
 * e.g. https://res.cloudinary.com/demo/image/upload/v123/booknverse/books/abc123.jpg
 *      → booknverse/books/abc123
 */
const getPublicId = (url) => {
  if (!url) return null;
  try {
    // Match everything after /upload/ (skip version like v1234567/)
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

/**
 * Delete an image from Cloudinary by its URL.
 * Silently ignores errors so a missing image never blocks your main logic.
 */
const deleteImage = async (url) => {
  const publicId = getPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

// Storage for book cover images
const bookCoverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'booknverse/books',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 600, crop: 'fill' }],
  },
});

// Storage for author photos
const authorPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'booknverse/authors',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

// Storage for user avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'booknverse/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }],
  },
});

// Storage for user cover images
const coverImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'booknverse/covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 400, crop: 'fill' }],
  },
});

const uploadBookCover   = multer({ storage: bookCoverStorage });
const uploadAuthorPhoto = multer({ storage: authorPhotoStorage });
const uploadAvatar      = multer({ storage: avatarStorage });
const uploadCoverImage  = multer({ storage: coverImageStorage });

module.exports = {
  cloudinary,
  deleteImage,          // ← new helper
  uploadBookCover,
  uploadAuthorPhoto,
  uploadAvatar,
  uploadCoverImage,
};
