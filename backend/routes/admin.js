const express = require('express');
const router  = express.Router();
const {
  getStats,
  getUsers, updateUserRole, banUser, deleteUser,
  getBooks, featureBook, deleteBook,
  getAuthors, updateAuthor, deleteAuthor,
  getReviews, deleteReview,
  getGenres, createGenre, updateGenre, deleteGenre,
  getAnnouncements, getActiveAnnouncements, createAnnouncement, toggleAnnouncement, deleteAnnouncement,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes (no auth needed)
router.get('/announcements/active', getActiveAnnouncements);
router.get('/genres/all', getGenres);

// All routes below — admin only
router.use(protect, adminOnly);

router.get('/stats',                       getStats);
router.get('/users',                       getUsers);
router.put('/users/:id/role',              updateUserRole);
router.put('/users/:id/ban',               banUser);
router.delete('/users/:id',                deleteUser);
router.get('/books',                       getBooks);
router.put('/books/:id/feature',           featureBook);
router.delete('/books/:id',                deleteBook);
router.get('/authors',                     getAuthors);
router.put('/authors/:id',                 updateAuthor);
router.delete('/authors/:id',              deleteAuthor);
router.get('/reviews',                     getReviews);
router.delete('/reviews/:id',              deleteReview);
router.get('/genres',                      getGenres);
router.post('/genres',                     createGenre);
router.put('/genres/:id',                  updateGenre);
router.delete('/genres/:id',               deleteGenre);
router.get('/announcements',               getAnnouncements);
router.post('/announcements',              createAnnouncement);
router.put('/announcements/:id/toggle',    toggleAnnouncement);
router.delete('/announcements/:id',        deleteAnnouncement);

module.exports = router;
