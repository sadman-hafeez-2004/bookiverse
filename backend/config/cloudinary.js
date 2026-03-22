const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Extract public_id from Cloudinary URL
const getPublicId = (url) => {
  if (!url || !url.includes('cloudinary')) return null;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

// Delete image from Cloudinary (silent fail — never blocks main logic)
const deleteImage = async (url) => {
  const publicId = getPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

const bookCoverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'booknverse/books',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 600, crop: 'fill' }],
  },
});

const authorPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'booknverse/authors',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'booknverse/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }],
  },
});

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
  deleteImage,
  uploadBookCover,
  uploadAuthorPhoto,
  uploadAvatar,
  uploadCoverImage,
};
