const Book       = require('../models/Book');
const Author     = require('../models/Author');
const Collection = require('../models/Collection');
const Review     = require('../models/Review');
const User       = require('../models/User');
const { deleteImage } = require('../config/cloudinary');

// GET /api/books
const getBooks = async (req, res, next) => {
  try {
    const { search, genre, page = 1, limit = 20, sort = 'newest' } = req.query;
    const query = {};
    if (genre)  query.genre = genre;
    if (search) query.$text = { $search: search };

    const sortMap = {
      newest:      { createdAt: -1 },
      popular:     { collectionsCount: -1 },
      topRated:    { averageRating: -1 },
      mostReviews: { reviewsCount: -1 },
    };

    const books = await Book.find(query)
      .populate('author', 'name photo')
      .populate('uploadedBy', 'username')
      .sort(sortMap[sort] || sortMap.newest)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Book.countDocuments(query);
    res.json({ books, total, page: Number(page) });
  } catch (err) { next(err); }
};

// GET /api/books/:id
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('author', 'name photo bio nationality')
      .populate('uploadedBy', 'username avatar');
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    let isCollected = false;
    if (req.user) {
      isCollected = !!(await Collection.findOne({ user: req.user._id, book: book._id }));
    }
    res.json({ book, isCollected });
  } catch (err) { next(err); }
};

// POST /api/books
const createBook = async (req, res, next) => {
  try {
    const { title, genre, description, publishedYear, authorId } = req.body;
    if (!title || !genre || !authorId)
      return res.status(400).json({ message: 'Title, genre and author are required.' });

    const author = await Author.findById(authorId);
    if (!author) return res.status(404).json({ message: 'Author not found.' });

    const bookData = {
      title, genre,
      description:   description   || '',
      publishedYear: publishedYear || undefined,
      author:        authorId,
      uploadedBy:    req.user._id,
    };
    if (req.file) bookData.coverImage = req.file.path;

    const book = await Book.create(bookData);

    // Author booksCount +1
    await Author.findByIdAndUpdate(authorId, { $inc: { booksCount: 1 } });

    await book.populate('author', 'name photo');
    res.status(201).json({ book });
  } catch (err) { next(err); }
};

// PUT /api/books/:id
const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const isOwner = book.uploadedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized to edit this book.' });

    const { title, genre, description, publishedYear, authorId } = req.body;
    if (title)         book.title         = title;
    if (genre)         book.genre         = genre;
    if (description)   book.description   = description;
    if (publishedYear) book.publishedYear = publishedYear;
    if (authorId)      book.author        = authorId;

    if (req.file) {
      await deleteImage(book.coverImage);
      book.coverImage = req.file.path;
    }

    await book.save();
    await book.populate('author', 'name photo');
    res.json({ book });
  } catch (err) { next(err); }
};

// DELETE /api/books/:id
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const isOwner = book.uploadedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized to delete this book.' });

    // 1. Delete cover from Cloudinary
    await deleteImage(book.coverImage);

    // 2. Find all collectors → decrement their collectedCount
    const collections = await Collection.find({ book: book._id }).select('user');
    if (collections.length > 0) {
      await User.updateMany(
        { _id: { $in: collections.map(c => c.user) } },
        { $inc: { collectedCount: -1 } }
      );
      await Collection.deleteMany({ book: book._id });
    }

    // 3. Delete all reviews for this book
    await Review.deleteMany({ book: book._id });

    // 4. Decrement author booksCount
    await Author.findByIdAndUpdate(book.author, { $inc: { booksCount: -1 } });

    // 5. Delete the book
    await book.deleteOne();

    res.json({ message: 'Book deleted.' });
  } catch (err) { next(err); }
};

// POST /api/books/:id/collect
const toggleCollect = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const existing = await Collection.findOne({ user: req.user._id, book: book._id });

    if (existing) {
      await existing.deleteOne();
      await Book.findByIdAndUpdate(book._id,     { $inc: { collectionsCount: -1 } });
      await User.findByIdAndUpdate(req.user._id, { $inc: { collectedCount:   -1 } });
      return res.json({ collected: false, message: 'Removed from collection.' });
    }

    await Collection.create({ user: req.user._id, book: book._id });
    await Book.findByIdAndUpdate(book._id,     { $inc: { collectionsCount: 1 } });
    await User.findByIdAndUpdate(req.user._id, { $inc: { collectedCount:  1 } });
    res.json({ collected: true, message: 'Added to collection.' });
  } catch (err) { next(err); }
};

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook, toggleCollect };
