const User         = require('../models/User');
const Book         = require('../models/Book');
const Review       = require('../models/Review');
const Author       = require('../models/Author');
const Genre        = require('../models/Genre');
const Announcement = require('../models/Announcement');

// ── Stats ─────────────────────────────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [users, books, authors, reviews, genres] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      Author.countDocuments(),
      Review.countDocuments(),
      Genre.countDocuments(),
    ]);
    const recentUsers = await User.find().select('username createdAt').sort({ createdAt: -1 }).limit(5);
    const recentBooks = await Book.find().select('title createdAt').sort({ createdAt: -1 }).limit(5);
    res.json({ stats: { users, books, authors, reviews, genres }, recentUsers, recentBooks });
  } catch (err) { next(err); }
};

// ── Users ─────────────────────────────────────────────────────
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
  } catch (err) { next(err); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) { next(err); }
};

const banUser = async (req, res, next) => {
  try {
    const { isBanned, banReason = '' } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned, banReason: isBanned ? banReason : '' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user, message: isBanned ? 'User banned.' : 'User unbanned.' });
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (err) { next(err); }
};

// ── Books ─────────────────────────────────────────────────────
const getBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = search ? { title: { $regex: search, $options: 'i' } } : {};
    const books = await Book.find(query)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Book.countDocuments(query);
    res.json({ books, total });
  } catch (err) { next(err); }
};

const featureBook = async (req, res, next) => {
  try {
    const { isFeatured } = req.body;
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true }
    ).populate('author', 'name');
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    res.json({ book, message: isFeatured ? 'Book featured!' : 'Book unfeatured.' });
  } catch (err) { next(err); }
};

const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    // Also decrement author booksCount
    if (book.author) {
      await Author.findByIdAndUpdate(book.author, { $inc: { booksCount: -1 } });
    }
    res.json({ message: 'Book deleted.' });
  } catch (err) { next(err); }
};

// ── Authors ───────────────────────────────────────────────────
const getAuthors = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};
    const authors = await Author.find(query)
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Author.countDocuments(query);
    res.json({ authors, total });
  } catch (err) { next(err); }
};

const updateAuthor = async (req, res, next) => {
  try {
    const { name, bio, nationality } = req.body;
    const update = {};
    if (name)        update.name        = name;
    if (bio !== undefined) update.bio   = bio;
    if (nationality !== undefined) update.nationality = nationality;

    const author = await Author.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!author) return res.status(404).json({ message: 'Author not found.' });
    res.json({ author });
  } catch (err) { next(err); }
};

const deleteAuthor = async (req, res, next) => {
  try {
    const author = await Author.findByIdAndDelete(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found.' });
    res.json({ message: 'Author deleted.' });
  } catch (err) { next(err); }
};

// ── Reviews ───────────────────────────────────────────────────
const getReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const reviews = await Review.find()
      .populate('user', 'username')
      .populate('book', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Review.countDocuments();
    res.json({ reviews, total });
  } catch (err) { next(err); }
};

const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found.' });
    await Review.updateBookStats(review.book);
    res.json({ message: 'Review deleted.' });
  } catch (err) { next(err); }
};

// ── Genres ────────────────────────────────────────────────────
// GET /api/admin/genres — protected (admin only)
const getGenres = async (req, res, next) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    res.json({ genres });
  } catch (err) { next(err); }
};

// GET /api/admin/genres/all — public (used by frontend dropdowns)
// FIX: returns ALL genres including both default and custom ones
const getAllGenres = async (req, res, next) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    res.json({ genres });
  } catch (err) { next(err); }
};

const createGenre = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Genre name is required.' });
    }

    // Check for duplicate (case-insensitive)
    const existing = await Genre.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' }
    });
    if (existing) {
      return res.status(400).json({ message: `Genre "${existing.name}" already exists.` });
    }

    const genre = await Genre.create({
      name: name.trim(),
      createdBy: req.user._id,
    });
    res.status(201).json({ genre });
  } catch (err) { next(err); }
};

const updateGenre = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Genre name is required.' });
    }
    const genre = await Genre.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );
    if (!genre) return res.status(404).json({ message: 'Genre not found.' });
    res.json({ genre });
  } catch (err) { next(err); }
};

const deleteGenre = async (req, res, next) => {
  try {
    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.status(404).json({ message: 'Genre not found.' });
    if (genre.isDefault) {
      return res.status(400).json({ message: 'Cannot delete a default genre.' });
    }
    await genre.deleteOne();
    res.json({ message: 'Genre deleted.' });
  } catch (err) { next(err); }
};

// ── Announcements ─────────────────────────────────────────────
const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json({ announcements });
  } catch (err) { next(err); }
};

const getActiveAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find({ active: true })
      .sort({ createdAt: -1 })
      .limit(3);
    res.json({ announcements });
  } catch (err) { next(err); }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required.' });
    }
    const ann = await Announcement.create({
      title,
      message,
      type: type || 'info',
      createdBy: req.user._id,
    });
    res.status(201).json({ announcement: ann });
  } catch (err) { next(err); }
};

const toggleAnnouncement = async (req, res, next) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ message: 'Announcement not found.' });
    ann.active = !ann.active;
    await ann.save();
    res.json({ announcement: ann, message: ann.active ? 'Activated.' : 'Deactivated.' });
  } catch (err) { next(err); }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const ann = await Announcement.findByIdAndDelete(req.params.id);
    if (!ann) return res.status(404).json({ message: 'Announcement not found.' });
    res.json({ message: 'Announcement deleted.' });
  } catch (err) { next(err); }
};

module.exports = {
  getStats,
  getUsers, updateUserRole, banUser, deleteUser,
  getBooks, featureBook, deleteBook,
  getAuthors, updateAuthor, deleteAuthor,
  getReviews, deleteReview,
  getGenres, getAllGenres, createGenre, updateGenre, deleteGenre,
  getAnnouncements, getActiveAnnouncements,
  createAnnouncement, toggleAnnouncement, deleteAnnouncement,
};
