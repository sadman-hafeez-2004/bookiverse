const express = require('express');
const router  = express.Router();
const { getStats, getUsers, updateUserRole, deleteUser, deleteBook, deleteReview } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly); // all admin routes require login + admin role

router.get('/stats',              getStats);
router.get('/users',              getUsers);
router.put('/users/:id/role',     updateUserRole);
router.delete('/users/:id',       deleteUser);
router.delete('/books/:id',       deleteBook);
router.delete('/reviews/:id',     deleteReview);

module.exports = router;
