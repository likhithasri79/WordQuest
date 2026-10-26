import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index.js';
import { logger } from '../utils/logger.js';

async function runMigrations() {
  logger.info('Starting PostgreSQL migrations via Drizzle...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    logger.info('✅ Database migrations applied successfully.');
    await pool.end();
    process.exit(0);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown migration error';
    logger.error('❌ Failed to apply database migrations', { error: message });
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
