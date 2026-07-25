const express = require('express');
const fs = require('fs');
const path = require('path');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://chatapp-frontend-steel-eight.vercel.app';

const allowedOrigins = [
  FRONTEND_URL,
  'https://chatapp-frontend-steel-eight.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

// ✅ Allow frontend domain (Vercel) — REQUIRED for CORS and Socket.IO
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow during production connection tests
    }
  },
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Health check for Render
app.get('/', (req, res) => {
  res.status(200).send("✅ Render backend is running");
});

app.use('/', userRoutes);
app.use('/chat', chatRoutes);

// ✅ HTTP server for Socket.IO
const server = http.createServer(app);

// ✅ Socket.IO with correct CORS config
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ✅ Store online users (userId => socketId)
const users = {};

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('register', (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('typing', ({ senderId, receiverId }) => {
    const receiverSocket = users[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit('typing', { senderId });
    }
  });

  socket.on('stopTyping', ({ senderId, receiverId }) => {
    const receiverSocket = users[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit('stopTyping', { senderId });
    }
  });

  socket.on('chat message', (msg) => {
    const { receiverId } = msg;
    const receiverSocket = users[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit('chat message', msg);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    for (const [userId, socketId] of Object.entries(users)) {
      if (socketId === socket.id) {
        delete users[userId];
        break;
      }
    }
  });
});

// ✅ Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
