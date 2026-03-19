const mongoose = require('mongoose');

// A "Collection" record means: this user has collected this book
const collectionSchema = new mongoose.Schema(
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
  },
  { timestamps: true }
);

// One user can collect a book only once
collectionSchema.index({ user: 1, book: 1 }, { unique: true });

// Fast lookup: all books a user collected
collectionSchema.index({ user: 1, createdAt: -1 });

// Fast lookup: all users who collected a book
collectionSchema.index({ book: 1 });

module.exports = mongoose.model('Collection', collectionSchema);
