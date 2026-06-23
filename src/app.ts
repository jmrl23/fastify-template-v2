import fastify from 'fastify';
import { HttpError, NotFound } from 'http-errors';
import { logger } from './packages/pino/logger';

export const app = fastify({
  loggerInstance: logger,
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
