const Author = require('../models/Author');
const Book   = require('../models/Book');
const { deleteImage } = require('../config/cloudinary');

// GET /api/authors  — list / search
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
  } catch (err) {
    next(err);
  }
};

// GET /api/authors/:id
const getAuthorById = async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id).populate('uploadedBy', 'username');
    if (!author) return res.status(404).json({ message: 'Author not found.' });

    const books = await Book.find({ author: author._id })
      .select('title coverImage genre averageRating reviewsCount collectionsCount')
      .sort({ createdAt: -1 });

    res.json({ author, books });
  } catch (err) {
    next(err);
  }
};

// POST /api/authors  — create new author (logged-in users)
const createAuthor = async (req, res, next) => {
  try {
    const { name, bio, nationality } = req.body;
    if (!name) return res.status(400).json({ message: 'Author name is required.' });

    const authorData = {
      name,
      bio:         bio || '',
      nationality: nationality || '',
      uploadedBy:  req.user._id,
    };
    if (req.file) authorData.photo = req.file.path;

    const author = await Author.create(authorData);
    res.status(201).json({ author });
  } catch (err) {
    next(err);
  }
};

// PUT /api/authors/:id  — update (uploader or admin)
const updateAuthor = async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found.' });

    const isOwner = author.uploadedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this author.' });
    }

    const { name, bio, nationality } = req.body;
    if (name)        author.name        = name;
    if (bio)         author.bio         = bio;
    if (nationality) author.nationality = nationality;

    // If a new photo is uploaded, delete the old one from Cloudinary first
    if (req.file) {
      await deleteImage(author.photo);
      author.photo = req.file.path;
    }

    await author.save();
    res.json({ author });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/authors/:id  — admin only
const deleteAuthor = async (req, res, next) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Author not found.' });

    // Delete author photo from Cloudinary
    await deleteImage(author.photo);

    await author.deleteOne();
    res.json({ message: 'Author deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuthors, getAuthorById, createAuthor, updateAuthor, deleteAuthor };
