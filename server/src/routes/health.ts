import { Router, Request, Response } from 'express';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  const memory = process.memoryUsage();
  
  res.status(200).json({
    status: 'healthy',
    serverTime: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    memoryUsageMB: {
      heapUsed: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
    },
    version: '1.0.0',
  });
});
