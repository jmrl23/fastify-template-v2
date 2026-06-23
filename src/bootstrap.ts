import fastifyCors from '@fastify/cors';
import fastifyPlugin from 'fastify-plugin';
import { env } from './packages/zod/env';
import { autoload } from './plugins/autoload';

export const bootstrap = fastifyPlugin(async function (app) {
  if (env('NODE_ENV') === 'development') {
    await app.register((await import('./plugins/docs.js')).docs);
  }

  const corsOrigin = env('CORS_ORIGIN');
  if (corsOrigin) {
    await app.register(fastifyCors, {
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    });
  }

  await app.register(autoload);
});
