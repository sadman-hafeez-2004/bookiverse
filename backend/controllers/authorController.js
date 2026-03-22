const Author     = require('../models/Author');
const Book       = require('../models/Book');
const Collection = require('../models/Collection');
const Review     = require('../models/Review');
const User       = require('../models/User');
const { deleteImage } = require('../config/cloudinary');

// GET /api/authors
const getAuthors = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const query = search ? { $text: { $search: search } } : {};
    const authors = await Author.find(query)
      .populate('uploadedBy', 'username')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Author.countDocuments(query);
    res.json({ authors, total, page: Number(page) });
  } catch (err) { next(err); }
};

// GET /api/authors/:id
const getAuthorById = async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id).populate('uploadedBy', 'username');
    if (!author) return res.status(404).json({ message: 'Author not found.' });

    const books = await Book.find({ author: author._id })
      .select('title coverImage genre averageRating reviewsCount collectionsCount')
      .sort({ createdAt: -1 });

    // Return live booksCount from actual DB query
    res.json({ author: { ...author.toObject(), booksCount: books.length }, books });
  } catch (err) { next(err); }
};

// POST /api/authors
const createAuthor = async (req, res, next) => {
  try {
    const { name, bio, nationality } = req.body;
    if (!name) return res.status(400).json({ message: 'Author name is required.' });

    const authorData = {
      name,
      bio:         bio         || '',
      nationality: nationality || '',
      uploadedBy:  req.user._id,
    };
    if (req.file) authorData.photo = req.file.path;

    const author = await Author.create(authorData);
    res.status(201).json({ author });
  } catch (err) { next(err); }
};

// PUT /api/authors/:id
const updateAuthor = async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found.' });

    const isOwner = author.uploadedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized to edit this author.' });

    const { name, bio, nationality } = req.body;
    if (name)        author.name        = name;
    if (bio)         author.bio         = bio;
    if (nationality) author.nationality = nationality;

    if (req.file) {
      await deleteImage(author.photo);
      author.photo = req.file.path;
    }

    await author.save();
    res.json({ author });
  } catch (err) { next(err); }
};

// DELETE /api/authors/:id — admin only
// Cascade: deletes all books, their covers, collections, reviews
const deleteAuthor = async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found.' });

    // 1. Delete author photo from Cloudinary
    await deleteImage(author.photo);

    // 2. Find all books by this author
    const books = await Book.find({ author: author._id }).select('_id coverImage');

    if (books.length > 0) {
      const bookIds = books.map(b => b._id);

      // 3. Delete all book covers from Cloudinary
      await Promise.all(books.map(b => deleteImage(b.coverImage)));

      // 4. Find all collectors → decrement their collectedCount
      const collections = await Collection.find({ book: { $in: bookIds } }).select('user');
      if (collections.length > 0) {
        await User.updateMany(
          { _id: { $in: collections.map(c => c.user) } },
          { $inc: { collectedCount: -1 } }
        );
        await Collection.deleteMany({ book: { $in: bookIds } });
      }

      // 5. Delete all reviews for these books
      await Review.deleteMany({ book: { $in: bookIds } });

      // 6. Delete all books
      await Book.deleteMany({ author: author._id });
    }

    // 7. Delete the author — total author count is live from DB so no extra step needed
    await author.deleteOne();

    res.json({ message: 'Author deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getAuthors, getAuthorById, createAuthor, updateAuthor, deleteAuthor };
