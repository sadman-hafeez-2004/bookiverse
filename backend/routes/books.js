const express = require('express');
const router  = express.Router();
const {
  getBooks, getBookById, createBook, updateBook, deleteBook, toggleCollect,
} = require('../controllers/bookController');
const { getReviews, createReview, updateReview, deleteReview, toggleLike } = require('../controllers/reviewController');
const { protect, optionalAuth, adminOnly } = require('../middleware/auth');
const { uploadBookCover } = require('../config/cloudinary');

router.get('/',                            getBooks);
router.get('/:id',                         optionalAuth, getBookById);
router.post('/',                           protect, uploadBookCover.single('coverImage'), createBook);
router.put('/:id',                         protect, uploadBookCover.single('coverImage'), updateBook);
router.delete('/:id',                      protect, deleteBook);
router.post('/:id/collect',               protect, toggleCollect);

// Reviews nested under books
router.get('/:bookId/reviews',             optionalAuth, getReviews);
router.post('/:bookId/reviews',            protect, createReview);
router.put('/reviews/:id',                protect, updateReview);
router.delete('/reviews/:id',             protect, deleteReview);
router.post('/reviews/:id/like',          protect, toggleLike);

module.exports = router;
