import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { logger } from '../../utils/logger';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.frontendUrl || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  // Authentication Middleware for Sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      // sub is now the user.uuid (string)
      socket.data.userUuid = decoded.sub;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userUuid = socket.data.userUuid;
    const roomName = `user_${userUuid}`;
    
    // Join a private room for this user
    socket.join(roomName);
    
    logger.info(`[Socket] User ${userUuid} connected and joined room ${roomName}`, { 
      socketId: socket.id 
    });

    socket.on('disconnect', () => {
      logger.info(`[Socket] User ${userUuid} disconnected`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const broadcastToUser = (userUuid: string, event: string, data: any) => {
  if (io) {
    io.to(`user_${userUuid}`).emit(event, data);
  }
};
