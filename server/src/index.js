import dotenv from 'dotenv';
import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import friendRequestRoutes from './routes/friendRequestRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import userSettingsRoutes from './routes/userSettingsRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { configureSocket } from './socket/socketHandler.js';
import { setIO } from './socket/socketState.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const localOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

const corsOrigin = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }

  if (origin === clientUrl || localOriginPattern.test(origin)) {
    return callback(null, true);
  }

  return callback(new Error('Not allowed by CORS'));
};

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: true
  }
});

setIO(io);
configureSocket(io);

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userSettingsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friend-request', friendRequestRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/group', groupRoutes);
app.use('/api/support', supportRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
