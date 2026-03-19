const mongoose = require('mongoose');

// A conversation is between exactly 2 users (1-on-1 DM)
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],

    // Reference to the last message for quick preview in chat list
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },

    // Unread count per participant: { userId: count }
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Ensure exactly 2 participants
conversationSchema.pre('save', function (next) {
  if (this.participants.length !== 2) {
    return next(new Error('A conversation must have exactly 2 participants'));
  }
  next();
});

// Fast lookup: find conversation between two specific users
conversationSchema.index({ participants: 1 });

// Sort conversations by latest activity
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
