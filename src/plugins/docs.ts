import fastifySwagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import fastifyPlugin from 'fastify-plugin';

export const docs = fastifyPlugin(
  async function (app) {
    await app.register(fastifySwagger);
    await app.register(scalar, {
      routePrefix: '/docs',
      logLevel: 'silent',
      configuration: {
        theme: 'fastify',
        agent: {
          disabled: true,
        },
        mcp: {
          disabled: true,
        },
      },
    });
  },
  {
    name: 'fastify-template-docs',
  },
);
