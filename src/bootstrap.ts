import fastifyPlugin from 'fastify-plugin';
import { autoload } from './plugins/autoload';
import { docs } from './plugins/docs';
import { env } from './packages/zod/env';

export const bootstrap = fastifyPlugin(async function (app) {
  if (env('NODE_ENV') === 'development') {
    await app.register(docs);
  }

  await app.register(autoload);
});
