import fastifyPlugin from 'fastify-plugin';
import { env } from './packages/zod/env';
import { autoload } from './plugins/autoload';

export const bootstrap = fastifyPlugin(async function (app) {
  if (env('NODE_ENV') === 'development') {
    await app.register((await import('./plugins/docs.js')).docs);
  }

  await app.register(autoload);
});
