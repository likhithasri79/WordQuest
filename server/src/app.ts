import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';

export function createApp(): Express {
  const app = express();

  // Security HTTP headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );

  // Body parser with size boundary
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Structured HTTP request logging
  app.use(requestLogger);

  // Health endpoint
  app.use('/health', healthRouter);

  // 404 Not Found Catch-All
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
