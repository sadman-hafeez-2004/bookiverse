const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // ✅ Display name — shown prominently on profile (required)
    displayName: {
      type:      String,
      required:  [true, 'Display name is required'],
      trim:      true,
      maxlength: [50, 'Display name must be at most 50 characters'],
    },

    username: {
      type:      String,
      required:  [true, 'Username is required'],
      unique:    true,
      trim:      true,
      minlength: [3,  'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },

    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select:    false,
    },

    avatar: {
      type:    String,
      default: '',
    },

    coverImage: {
      type:    String,
      default: '',
    },

    bio: {
      type:      String,
      maxlength: [300, 'Bio must be at most 300 characters'],
      default:   '',
    },

    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },

    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    collectedCount: { type: Number, default: 0 },

    isBanned:  { type: Boolean, default: false },
    banReason: { type: String,  default: '' },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
