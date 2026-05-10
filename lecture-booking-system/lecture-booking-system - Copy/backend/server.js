require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup for real-time forum updates
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Attach io to requests for use in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/forums', require('./routes/forums'));
app.use('/api/timetable', require('./routes/timetable'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/dm', require('./routes/dm'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Lecture Booking System API is running.', timestamp: new Date() });
});

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Forum rooms
  socket.on('join:forum', (forumId) => {
    socket.join(`forum:${forumId}`);
  });
  socket.on('leave:forum', (forumId) => {
    socket.leave(`forum:${forumId}`);
  });

  // DM rooms — each user joins their personal room for notifications
  socket.on('join:user', (userId) => {
    socket.join(`user:${userId}`);
  });

  // DM conversation room — both parties join when chat is open
  socket.on('join:dm', (conversationId) => {
    socket.join(`dm:${conversationId}`);
  });
  socket.on('leave:dm', (conversationId) => {
    socket.leave(`dm:${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── ERROR HANDLING ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = { app, server, io };
