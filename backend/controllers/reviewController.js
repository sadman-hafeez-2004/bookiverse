const Review = require('../models/Review');
const Book   = require('../models/Book');

// GET /api/books/:bookId/reviews
const getReviews = async (req, res, next) => {
  try {
    const { sort = 'newest', page = 1, limit = 20 } = req.query;

    const sortMap = {
      newest: { createdAt: -1 },
      top:    { likesCount: -1 },
    };

    const reviews = await Review.find({ book: req.params.bookId })
      .populate('user', 'username avatar')
      .sort(sortMap[sort] || sortMap.newest)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Review.countDocuments({ book: req.params.bookId });

    // If logged in, tell client which review the current user liked
    let myReviewId = null;
    if (req.user) {
      const mine = await Review.findOne({ user: req.user._id, book: req.params.bookId });
      if (mine) myReviewId = mine._id;
    }

    res.json({ reviews, total, page: Number(page), myReviewId });
  } catch (err) {
    next(err);
  }
};

// POST /api/books/:bookId/reviews
const createReview = async (req, res, next) => {
  try {
    const { rating, text } = req.body;

    if (!rating) return res.status(400).json({ message: 'Rating is required.' });

    const book = await Book.findById(req.params.bookId);
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const review = await Review.create({
      user:   req.user._id,
      book:   req.params.bookId,
      rating: Number(rating),
      text:   text || '',
    });

    // Recalculate book stats
    await Review.updateBookStats(book._id);

    await review.populate('user', 'username avatar');
    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
};

// PUT /api/reviews/:id
const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const { rating, text } = req.body;
    if (rating) review.rating = Number(rating);
    if (text !== undefined) review.text = text;
    await review.save();

    await Review.updateBookStats(review.book);
    await review.populate('user', 'username avatar');
    res.json({ review });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reviews/:id
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    const isOwner = review.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    const bookId = review.book;
    await review.deleteOne();
    await Review.updateBookStats(bookId);
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/reviews/:id/like  — toggle like on a review
const toggleLike = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found.' });

    const userId   = req.user._id;
    const alreadyLiked = review.likes.some(id => id.equals(userId));

    if (alreadyLiked) {
      review.likes     = review.likes.filter(id => !id.equals(userId));
      review.likesCount = review.likes.length;
    } else {
      review.likes.push(userId);
      review.likesCount = review.likes.length;
    }

    await review.save();
    res.json({ liked: !alreadyLiked, likesCount: review.likesCount });
  } catch (err) {
    next(err);
  }
};

module.exports = { getReviews, createReview, updateReview, deleteReview, toggleLike };
