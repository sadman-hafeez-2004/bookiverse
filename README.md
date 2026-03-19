# Booknverse 📚

A social book collection network built with the MERN stack.

## Features
- Browse and search books, authors, and readers
- Upload book covers, author bios and photos (Cloudinary)
- Collect books to your personal profile
- Write and like reviews with star ratings
- Follow other readers
- Real-time 1-on-1 chat (Socket.io)
- Admin panel (manage users, books, reviews)
- Auto dark/light mode

## Tech Stack
- **Frontend**: React 18, Vite, Zustand, React Router, Socket.io-client
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.io
- **Storage**: Cloudinary (images)
- **Auth**: JWT

## Project Structure
```
booknverse/
├── backend/       ← Node.js + Express API
└── frontend/      ← React app (Vite)
```

## Quick Start

### 1. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in: MONGO_URI, JWT_SECRET, CLOUDINARY_* keys
npm run dev        # Starts on http://localhost:5000
```

### 2. Frontend setup
```bash
cd frontend
npm install
npm run dev        # Starts on http://localhost:5173
```

### 3. Environment variables (backend/.env)
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/booknverse
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET  | /api/auth/me | Protected |
| PUT  | /api/auth/password | Protected |
| GET  | /api/books | Public |
| POST | /api/books | Protected |
| POST | /api/books/:id/collect | Protected |
| GET  | /api/books/:bookId/reviews | Public |
| POST | /api/books/:bookId/reviews | Protected |
| POST | /api/books/reviews/:id/like | Protected |
| GET  | /api/authors | Public |
| POST | /api/authors | Protected |
| GET  | /api/users | Public |
| POST | /api/users/:id/follow | Protected |
| PUT  | /api/users/me | Protected |
| POST | /api/chat/conversations | Protected |
| GET  | /api/admin/stats | Admin |
| GET  | /api/admin/users | Admin |

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| message:send | Client → Server | Send a chat message |
| message:new | Server → Client | New message received |
| typing:start / typing:stop | Both | Typing indicator |
| user:online / user:offline | Server → Client | Online status |
| conversation:join | Client → Server | Join a chat room |
