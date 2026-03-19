const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
    },
    text: {
      type: String,
      maxlength: [3000, 'Review must be at most 3000 characters'],
      default: '',
    },

    // Users who liked this review (array of user IDs)
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Denormalized like count for fast sorting
    likesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One review per user per book
reviewSchema.index({ user: 1, book: 1 }, { unique: true });

// Fast lookup: all reviews for a book, sorted by newest
reviewSchema.index({ book: 1, createdAt: -1 });

// Fast lookup: all reviews by a user
reviewSchema.index({ user: 1, createdAt: -1 });

// After saving a review, update book's averageRating + reviewsCount
reviewSchema.statics.updateBookStats = async function (bookId) {
  const stats = await this.aggregate([
    { $match: { book: bookId } },
    {
      $group: {
        _id: '$book',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const Book = mongoose.model('Book');
  if (stats.length > 0) {
    await Book.findByIdAndUpdate(bookId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      reviewsCount: stats[0].count,
    });
  } else {
    await Book.findByIdAndUpdate(bookId, {
      averageRating: 0,
      reviewsCount: 0,
    });
  }
};

module.exports = mongoose.model('Review', reviewSchema);
