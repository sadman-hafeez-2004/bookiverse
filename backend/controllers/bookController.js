const Book       = require('../models/Book');
const Author     = require('../models/Author');
const Collection = require('../models/Collection');
const User       = require('../models/User');

// GET /api/books  — list with filters
const getBooks = async (req, res, next) => {
  try {
    const { search, genre, page = 1, limit = 20, sort = 'newest' } = req.query;

    const query = {};
    if (genre)  query.genre = genre;
    if (search) query.$text = { $search: search };

    const sortMap = {
      newest:     { createdAt: -1 },
      popular:    { collectionsCount: -1 },
      topRated:   { averageRating: -1 },
      mostReviews:{ reviewsCount: -1 },
    };

    const books = await Book.find(query)
      .populate('author', 'name photo')
      .populate('uploadedBy', 'username')
      .sort(sortMap[sort] || sortMap.newest)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Book.countDocuments(query);
    res.json({ books, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

// GET /api/books/:id
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('author', 'name photo bio nationality')
      .populate('uploadedBy', 'username avatar');

    if (!book) return res.status(404).json({ message: 'Book not found.' });

    // Check if logged-in user collected this book
    let isCollected = false;
    if (req.user) {
      isCollected = !!(await Collection.findOne({
        user: req.user._id,
        book: book._id,
      }));
    }

    res.json({ book, isCollected });
  } catch (err) {
    next(err);
  }
};

// POST /api/books  — upload new book
const createBook = async (req, res, next) => {
  try {
    const { title, genre, description, publishedYear, authorId } = req.body;

    if (!title || !genre || !authorId) {
      return res.status(400).json({ message: 'Title, genre and author are required.' });
    }

    const author = await Author.findById(authorId);
    if (!author) return res.status(404).json({ message: 'Author not found.' });

    const bookData = {
      title,
      genre,
      description:   description   || '',
      publishedYear: publishedYear || undefined,
      author:        authorId,
      uploadedBy:    req.user._id,
    };
    if (req.file) bookData.coverImage = req.file.path;

    const book = await Book.create(bookData);

    // Increment author's booksCount
    await Author.findByIdAndUpdate(authorId, { $inc: { booksCount: 1 } });

    await book.populate('author', 'name photo');
    res.status(201).json({ book });
  } catch (err) {
    next(err);
  }
};

// PUT /api/books/:id  — update (uploader or admin)
const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const isOwner = book.uploadedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this book.' });
    }

    const { title, genre, description, publishedYear } = req.body;
    if (title)        book.title        = title;
    if (genre)        book.genre        = genre;
    if (description)  book.description  = description;
    if (publishedYear) book.publishedYear = publishedYear;
    if (req.file)     book.coverImage   = req.file.path;

    await book.save();
    await book.populate('author', 'name photo');
    res.json({ book });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/books/:id  — admin or uploader
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const isOwner = book.uploadedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this book.' });
    }

    await book.deleteOne();
    await Author.findByIdAndUpdate(book.author, { $inc: { booksCount: -1 } });
    res.json({ message: 'Book deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/books/:id/collect  — toggle collect/uncollect
const toggleCollect = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found.' });

    const existing = await Collection.findOne({
      user: req.user._id,
      book: book._id,
    });

    if (existing) {
      await existing.deleteOne();
      await Book.findByIdAndUpdate(book._id,    { $inc: { collectionsCount: -1 } });
      await User.findByIdAndUpdate(req.user._id, { $inc: { collectedCount:   -1 } });
      return res.json({ collected: false, message: 'Removed from collection.' });
    }

    await Collection.create({ user: req.user._id, book: book._id });
    await Book.findByIdAndUpdate(book._id,    { $inc: { collectionsCount: 1 } });
    await User.findByIdAndUpdate(req.user._id, { $inc: { collectedCount:  1 } });
    res.json({ collected: true, message: 'Added to collection.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook, toggleCollect };
