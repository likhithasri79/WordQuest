import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Player Authentication & Guest Identity REST API', () => {
  const app = createApp();

  it('POST /api/auth/guest creates a guest player with 64-char hex recovery token', async () => {
    const res = await request(app)
      .post('/api/auth/guest')
      .send({ nickname: 'QuizMaster', avatarId: 'avatar-05' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('player');
    expect(res.body.player).toHaveProperty('id');
    expect(res.body.player.nickname).toBe('QuizMaster');
    expect(res.body.player.avatarId).toBe('avatar-05');

    expect(res.body).toHaveProperty('recoveryToken');
    expect(typeof res.body.recoveryToken).toBe('string');
    expect(res.body.recoveryToken.length).toBe(64); // 32 bytes in hex = 64 characters
  });

  it('GET /api/auth/me authenticates player with valid Bearer token', async () => {
    // 1. Create player
    const regRes = await request(app)
      .post('/api/auth/guest')
      .send({ nickname: 'TokenTester' });
    const token = regRes.body.recoveryToken;

    // 2. Fetch /me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.player.nickname).toBe('TokenTester');
    expect(meRes.body.player.id).toBe(regRes.body.player.id);
  });

  it('GET /api/auth/me rejects invalid or missing token with 401', async () => {
    const noTokenRes = await request(app).get('/api/auth/me');
    expect(noTokenRes.status).toBe(401);

    const badTokenRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_fake_token_12345');
    expect(badTokenRes.status).toBe(401);
  });
});
