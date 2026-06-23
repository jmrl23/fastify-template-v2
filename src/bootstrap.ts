import fastifyPlugin from 'fastify-plugin';
import { autoload } from './plugins/autoload';
import { env } from './packages/zod/env';

export const bootstrap = fastifyPlugin(async function (app) {
  if (env('NODE_ENV') === 'development') {
    await app.register((await import('./plugins/docs.js')).docs);
  }

  await app.register(autoload);
});
