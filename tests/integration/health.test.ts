import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('GET /health', () => {
  const app = createApp();

  it('should return 200 with status ok and uptime', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    const body = res.body as { status: string; timestamp: string; uptime: number };
    expect(body).toHaveProperty('status', 'ok');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
    expect(typeof body.uptime).toBe('number');
  });

  it('should return 404 for nonexistent routes with standard error shape', async () => {
    const res = await request(app).get('/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      status: 'error',
      statusCode: 404,
      message: 'Resource not found',
    });
  });
});
