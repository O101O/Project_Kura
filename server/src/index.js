/**
 * Main entry point for the Kura server application.
 * Sets up Express server, Socket.io, database connection, and routes.
 */

import dotenv from 'dotenv';
import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import Conversation from './models/Conversation.js';
import { getClientUrl, getPort, getUploadsDir } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import friendRequestRoutes from './routes/friendRequestRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import userSettingsRoutes from './routes/userSettingsRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { configureSocket } from './socket/socketHandler.js';
import { setIO } from './socket/socketState.js';

// Load environment variables
dotenv.config();

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Get configuration from environment
const clientUrl = getClientUrl();
const localOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

// CORS origin validation function
const corsOrigin = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }

  if (origin === clientUrl || localOriginPattern.test(origin)) {
    return callback(null, true);
  }

  return callback(new Error('Not allowed by CORS'));
};

// Initialize Socket.io server with CORS
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: true
  }
});

// Set Socket.io instance in state
setIO(io);

// Configure Socket.io handlers
configureSocket(io);

// Middleware setup
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(getUploadsDir()));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/api/user', userSettingsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/friend-request', friendRequestRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/events', eventRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Get port from environment
const port = getPort();

// Connect to database and start server
connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    // Sync database indexes for Conversation model
    Conversation.syncIndexes().catch((error) => {
      console.error('Failed to sync conversation indexes:', error.message);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
