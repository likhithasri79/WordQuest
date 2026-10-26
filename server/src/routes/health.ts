import { Router, Request, Response } from 'express';
import { env } from '../config/env.js';
import { checkDatabaseHealth } from '../db/index.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const memory = process.memoryUsage();
  const dbHealth = await checkDatabaseHealth();
  
  const isHealthy = dbHealth.connected || env.NODE_ENV === 'test';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    serverTime: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    database: {
      status: dbHealth.connected ? 'connected' : 'disconnected',
      ...(dbHealth.latencyMs !== undefined ? { latencyMs: dbHealth.latencyMs } : {}),
      ...(dbHealth.error ? { error: dbHealth.error } : {}),
    },
    memoryUsageMB: {
      heapUsed: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
    },
    version: '1.0.0',
  });
});

