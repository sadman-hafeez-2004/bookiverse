const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      maxlength: [2000, 'Bio must be at most 2000 characters'],
    },
    photo: {
      type: String,
      default: '', // Cloudinary URL
    },
    nationality: {
      type: String,
      default: '',
    },

    // Uploaded by which user
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Denormalized: how many books reference this author
    booksCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Index for search by name
authorSchema.index({ name: 'text' });

module.exports = mongoose.model('Author', authorSchema);
