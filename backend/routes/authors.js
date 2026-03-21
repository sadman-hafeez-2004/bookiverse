const express = require('express');
const router  = express.Router();
const {
  getAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} = require('../controllers/authorController');
const { protect, adminOnly }   = require('../middleware/auth');
const { uploadAuthorPhoto }    = require('../config/cloudinary');

router.get('/',       getAuthors);
router.get('/:id',    getAuthorById);

router.post('/',
  protect,
  uploadAuthorPhoto.single('photo'),
  createAuthor
);

// ✅ FIX: PUT also uses uploadAuthorPhoto so photo file is handled correctly
router.put('/:id',
  protect,
  uploadAuthorPhoto.single('photo'),
  updateAuthor
);

router.delete('/:id',
  protect,
  adminOnly,
  deleteAuthor
);

module.exports = router;
