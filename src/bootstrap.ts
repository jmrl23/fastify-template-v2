import fastifyPlugin from 'fastify-plugin';
import { autoload } from './plugins/autoload';
import { docs } from './plugins/docs';

export const bootstrap = fastifyPlugin(async function (app) {
  if (process.env.NODE_ENV === 'development') {
    await app.register(docs);
  }

  await app.register(autoload);
});
