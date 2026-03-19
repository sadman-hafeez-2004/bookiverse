const User   = require('../models/User');
const Book   = require('../models/Book');
const Review = require('../models/Review');
const Author = require('../models/Author');

// GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const [users, books, authors, reviews] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      Author.countDocuments(),
      Review.countDocuments(),
    ]);
    res.json({ stats: { users, books, authors, reviews } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = search ? { username: { $regex: search, $options: 'i' } } : {};
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(query);
    res.json({ users, total });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id/role  — promote/demote user
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be user or admin.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id, { role }, { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/books/:id
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    res.json({ message: 'Book deleted.' });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/reviews/:id
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found.' });
    await Review.updateBookStats(review.book);
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getUsers, updateUserRole, deleteUser, deleteBook, deleteReview };
