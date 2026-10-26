import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20, // Max concurrent connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL pool client', { error: err.message });
});

export const db = drizzle(pool, { schema });

/**
 * Checks PostgreSQL database connection health
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      const latencyMs = Date.now() - start;
      return { connected: true, latencyMs };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database connection error';
    return { connected: false, error: message };
  }
}
