import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function initializeSocketIO(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.on('connection', (socket: Socket) => {
    logger.info('Socket connected', {
      socketId: socket.id,
      transport: socket.conn.transport.name,
      ip: socket.handshake.address,
    });

    socket.on('disconnect', (reason: string) => {
      logger.info('Socket disconnected', {
        socketId: socket.id,
        reason,
      });
    });

    socket.on('error', (err: Error) => {
      logger.error('Socket error encountered', {
        socketId: socket.id,
        message: err.message,
      });
    });
  });

  return io;
}
