import { env } from '../config/env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Sensitive field keys that must be redacted in logs
const SENSITIVE_KEYS = new Set([
  'token',
  'recoverytoken',
  'recovery_token',
  'password',
  'secret',
  'word',
  'player_a_word',
  'player_b_word',
  'authorization',
]);

/**
 * Recursively redacts sensitive fields from objects before serialization
 */
function redact(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(redact);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = redact(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function writeLog(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[env.LOG_LEVEL]) {
    return;
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: redact(meta) } : {}),
  };

  const output = JSON.stringify(logEntry);
  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => writeLog('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => writeLog('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => writeLog('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => writeLog('error', message, meta),
};
