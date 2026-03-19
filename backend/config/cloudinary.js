const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

const uploadBookCover  = multer({ storage: bookCoverStorage });
const uploadAuthorPhoto = multer({ storage: authorPhotoStorage });
const uploadAvatar     = multer({ storage: avatarStorage });

module.exports = { cloudinary, uploadBookCover, uploadAuthorPhoto, uploadAvatar };
