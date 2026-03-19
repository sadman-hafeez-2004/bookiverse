require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const morgan     = require('morgan');

const connectDB      = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');
const { initSocket } = require('./socket');

// Route files
const authRoutes   = require('./routes/auth');
const userRoutes   = require('./routes/users');
const bookRoutes   = require('./routes/books');
const authorRoutes = require('./routes/authors');
const chatRoutes   = require('./routes/chat');
const adminRoutes  = require('./routes/admin');

// Connect to MongoDB
connectDB();

const app    = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});
initSocket(io);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// Routes
app.use('/api/auth',    authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/books',   bookRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/chat',    chatRoutes);
app.use('/api/admin',   adminRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found.` }));

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Booknverse server running on port ${PORT} [${process.env.NODE_ENV}]`);
});
