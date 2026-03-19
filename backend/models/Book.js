const mongoose = require('mongoose');

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
      default: '', // Cloudinary URL
    },
    genre: {
      type: String,
      enum: GENRES,
      required: [true, 'Genre is required'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description must be at most 2000 characters'],
      default: '',
    },
    publishedYear: {
      type: Number,
      min: [0, 'Invalid year'],
      max: [new Date().getFullYear(), 'Year cannot be in the future'],
    },

    // Author reference (required)
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: [true, 'Author is required'],
    },

    // Who uploaded this book entry
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Denormalized stats for fast display
    collectionsCount: { type: Number, default: 0 }, // how many users collected it
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
