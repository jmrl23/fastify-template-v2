import fastify from 'fastify';
import { HttpError, NotFound } from 'http-errors';
import { loggers } from './packages/pino/logger';
import { env } from './packages/zod/env';

export const app = fastify({
  loggerInstance: loggers[env('NODE_ENV')],
  trustProxy: env('TRUST_PROXY'),
  routerOptions: {
    ignoreTrailingSlash: true,
  },
});

app.setNotFoundHandler(async function notFoundHandler(request) {
  throw new NotFound(`Cannot ${request.method} ${request.url}`);
});

app.setErrorHandler(async function errorHandler(error) {
  const isHttpError = error instanceof HttpError;
  if (isHttpError && error.statusCode > 499) {
    this.log.error(error.stack ?? error.message);
  }
  return error;
});
