import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('app version headers', () => {
  it('advertises the current app version on API responses', async () => {
    const app = createApp('test-version');

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.headers['x-app-version']).toBe('test-version');
  });

  it('exposes the app version header to browser clients', async () => {
    const app = createApp('test-version');

    const response = await request(app)
      .options('/health')
      .set('Origin', 'http://localhost:5174')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.headers['access-control-expose-headers']).toContain('X-App-Version');
  });
});
