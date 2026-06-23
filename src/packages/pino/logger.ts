import { FastifyReply, FastifyRequest } from 'fastify';
import pino, { LoggerOptions } from 'pino';

const options: Record<string, LoggerOptions> = {
  development: {
    level: 'debug',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      },
    },
    serializers: {
      req(request: FastifyRequest) {
        return {
          method: request.method,
          url: request.url,
          query: request.query,
          params: request.params,
        };
      },
      res(response: FastifyReply) {
        return {
          statusCode: response.statusCode,
          headers:
            typeof response.getHeaders === 'function'
              ? response.getHeaders()
              : {},
        };
      },
    },
  },
  production: {
    level: 'info',
    serializers: {
      req(request: FastifyRequest) {
        return {
          method: request.method,
          url: request.url,
        };
      },
      res(response: FastifyReply) {
        return {
          statusCode: response.statusCode,
          headers:
            typeof response.getHeaders === 'function'
              ? response.getHeaders()
              : {},
        };
      },
    },
  },
  test: {
    level: 'debug',
  },
};

export const loggers = {
  development: () => pino(options.development),
  production: () => pino(options.production),
  test: () => pino(options.test),
};
