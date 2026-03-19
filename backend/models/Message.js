const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      maxlength: [2000, 'Message must be at most 2000 characters'],
      trim: true,
    },
    // Whether the receiver has read the message
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Fast lookup: all messages in a conversation, newest last
messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
