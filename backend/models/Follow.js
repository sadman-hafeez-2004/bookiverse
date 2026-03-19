const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    // The user who is following
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The user being followed
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Can only follow someone once
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Fast lookup: all followers of a user
followSchema.index({ following: 1 });

// Fast lookup: all users a person follows
followSchema.index({ follower: 1 });

// Prevent self-follow at schema level
followSchema.pre('save', function (next) {
  if (this.follower.equals(this.following)) {
    return next(new Error('Users cannot follow themselves'));
  }
  next();
});

module.exports = mongoose.model('Follow', followSchema);
