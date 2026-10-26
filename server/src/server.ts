import { createServer } from 'http';
import { createApp } from './app.js';
import { initializeSocketIO } from './realtime/socketServer.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();
const httpServer = createServer(app);
const io = initializeSocketIO(httpServer);

const server = httpServer.listen(env.PORT, () => {
  logger.info('🚀 WordQuest Server started successfully', {
    port: env.PORT,
    environment: env.NODE_ENV,
    clientUrl: env.CLIENT_URL,
  });
});

function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Stop accepting new connections
  io.close(() => {
    logger.info('Socket.IO connections closed.');
  });

  server.close((err) => {
    if (err) {
      logger.error('Error during HTTP server closure', { error: err.message });
      process.exit(1);
    }
    logger.info('HTTP server successfully stopped. Process exiting.');
    process.exit(0);
  });

  // Force close after 10 seconds if hanging
  setTimeout(() => {
    logger.error('Forceful shutdown triggered after 10s timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { app, httpServer, io };
