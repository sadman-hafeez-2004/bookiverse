const jwt          = require('jsonwebtoken');
const User         = require('./models/User');
const Message      = require('./models/Message');
const Conversation = require('./models/Conversation');

// Map: userId (string) -> socketId
const onlineUsers = new Map();

const initSocket = (io) => {
  // Authenticate socket connection via JWT in handshake
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    console.log(`🟢 ${socket.user.username} connected (${socket.id})`);

    // Broadcast online status to everyone
    io.emit('user:online', { userId });

    // Join a conversation room
    socket.on('conversation:join', (conversationId) => {
      socket.join(conversationId);
    });

    // Leave a conversation room
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(conversationId);
    });

    // Send a message
    socket.on('message:send', async ({ conversationId, text }, callback) => {
      try {
        if (!text || !conversationId) return;

        // Verify user is a participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: socket.user._id,
        });
        if (!conversation) return;

        // Save message to DB
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user._id,
          text: text.trim(),
        });

        // Update conversation lastMessage
        conversation.lastMessage = message._id;
        await conversation.save();

        await message.populate('sender', 'username avatar');

        // Emit to everyone in the room (including sender for confirmation)
        io.to(conversationId).emit('message:new', { message });

        // Also notify the other participant if they're online but not in the room
        const otherParticipant = conversation.participants.find(
          (p) => p.toString() !== socket.user._id.toString()
        );
        if (otherParticipant) {
          const otherSocketId = onlineUsers.get(otherParticipant.toString());
          if (otherSocketId) {
            io.to(otherSocketId).emit('conversation:update', {
              conversationId,
              lastMessage: message,
            });
          }
        }

        if (callback) callback({ success: true, message });
      } catch (err) {
        console.error('Socket message error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Typing indicators
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:start', {
        userId,
        username: socket.user.username,
        conversationId,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(conversationId).emit('typing:stop', { userId, conversationId });
    });

    // Get online users list
    socket.on('users:online', () => {
      socket.emit('users:online', { onlineUsers: Array.from(onlineUsers.keys()) });
    });

    // Disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user:offline', { userId });
      console.log(`🔴 ${socket.user.username} disconnected`);
    });
  });
};

module.exports = { initSocket, onlineUsers };
