import { FastifyInstance } from 'fastify';
import z from 'zod';

export default async function (app: FastifyInstance) {
  app.route({
    method: 'GET',
    url: '/',
    schema: {
      description: 'Liveness/readiness probe',
      tags: ['Health'],
      response: {
        200: z.toJSONSchema(z.object({ status: z.literal('ok') }), {
          target: 'draft-07',
        }),
      },
    },
    handler() {
      return { status: 'ok' };
    },
  });
}
