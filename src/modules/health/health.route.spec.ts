import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import fastify, { FastifyInstance } from 'fastify';
import healthRoute from './health.route';

function buildApp(): FastifyInstance {
  const app = fastify();
  void app.register(healthRoute, { prefix: '/health' });
  return app;
}

describe('health route', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});
