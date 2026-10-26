import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('GET /health Endpoint', () => {
  const app = createApp();

  it('should return 200 OK with server health metadata', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('serverTime');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(res.body).toHaveProperty('environment');
    expect(res.body).toHaveProperty('memoryUsageMB');
    expect(res.body).toHaveProperty('version');

    // Verify serverTime is valid ISO 8601 string
    expect(new Date(res.body.serverTime).toISOString()).toBe(res.body.serverTime);
  });

  it('should return 404 for non-existent routes', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
});
