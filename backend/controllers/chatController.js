const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const User         = require('../models/User');

// GET /api/chat/conversations  — my conversation list
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'username avatar')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json({ conversations });
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/conversations  — start or get existing conversation
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId is required.' });
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot chat with yourself.' });
    }

    const otherUser = await User.findById(userId);
    if (!otherUser) return res.status(404).json({ message: 'User not found.' });

    // Find existing conversation between the two users
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId], $size: 2 },
    }).populate('participants', 'username avatar').populate('lastMessage');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
      });
      await conversation.populate('participants', 'username avatar');
    }

    res.json({ conversation });
  } catch (err) {
    next(err);
  }
};

// GET /api/chat/conversations/:id/messages
const getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })          // newest first for pagination
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Mark messages as read
    await Message.updateMany(
      { conversation: conversation._id, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );

    res.json({ messages: messages.reverse(), page: Number(page) }); // reverse: oldest first
  } catch (err) {
    next(err);
  }
};

// POST /api/chat/conversations/:id/messages  — send a message (REST fallback)
const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Message text is required.' });

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: req.user._id,
    });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text,
    });

    // Update conversation's lastMessage + updatedAt
    conversation.lastMessage = message._id;
    await conversation.save();

    await message.populate('sender', 'username avatar');
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};

module.exports = { getConversations, getOrCreateConversation, getMessages, sendMessage };
