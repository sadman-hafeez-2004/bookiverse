const mongoose = require('mongoose');

// Default genres for frontend fallback — NOT used as enum validator
// so admin-created genres are always accepted by the backend.
const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Fantasy',
  'Mystery',
  'Thriller',
  'Romance',
  'Horror',
  'Biography',
  'History',
  'Self-Help',
  'Science',
  'Philosophy',
  'Poetry',
  'Children',
  'Young Adult',
  'Graphic Novel',
  'Other',
];

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    coverImage: {
      type: String,
      default: '',
    },

    // FIX: removed `enum: GENRES` — Mongoose was rejecting custom genres
    // added via the Admin panel (e.g. "Business", "Travel", etc.)
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
    },

    description: {
      type: String,
      maxlength: [2000, 'Description must be at most 2000 characters'],
      default: '',
    },

    publishedYear: {
      type: Number,
      min: [0, 'Invalid year'],
      max: [new Date().getFullYear() + 1, 'Year cannot be too far in the future'],
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: [true, 'Author is required'],
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Denormalized stats for fast display
    collectionsCount: { type: Number, default: 0 },
    reviewsCount:     { type: Number, default: 0 },
    averageRating:    { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true }
);

// Text index for search
bookSchema.index({ title: 'text' });
bookSchema.index({ genre: 1 });
bookSchema.index({ author: 1 });

module.exports = mongoose.model('Book', bookSchema);
module.exports.GENRES = GENRES;
