require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const morgan     = require('morgan');

const connectDB      = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');
const { initSocket } = require('./socket');

const authRoutes   = require('./routes/auth');
const userRoutes   = require('./routes/users');
const bookRoutes   = require('./routes/books');
const authorRoutes = require('./routes/authors');
const chatRoutes   = require('./routes/chat');
const adminRoutes  = require('./routes/admin');

connectDB();

const app    = express();
const server = http.createServer(app);

// CORS — allow localhost + all vercel URLs
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.includes('vercel.app') ||
      origin.includes('onrender.com') ||
      origin === process.env.CLIENT_URL
    ) return callback(null, true);
    callback(new Error('CORS blocked: ' + origin));
  },
  credentials: true,
};

const io = new Server(server, {
  cors: { origin: corsOptions.origin, methods: ['GET', 'POST'] },
});
initSocket(io);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

app.use('/api/auth',    authRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/books',   bookRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/chat',    chatRoutes);
app.use('/api/admin',   adminRoutes);

app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found.` }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Booknverse server running on port ${PORT} [${process.env.NODE_ENV}]`);
});
