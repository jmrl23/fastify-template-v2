import fastifyAutoload from '@fastify/autoload';
import fastifyPlugin from 'fastify-plugin';
import path from 'node:path';

type Options = Partial<{
  dir: string;
  matchFilter(path: string): boolean;
  autoHooks: boolean;
  autoHooksPattern: RegExp;
  cascadeHooks: boolean;
}>;

export const autoload = fastifyPlugin<Options>(
  async function (app, options) {
    await app.register(fastifyAutoload, {
      dir: options.dir ?? defaultOptions.dir,
      matchFilter(path) {
        return path.endsWith('.route.ts') || path.endsWith('.route.js');
      },
      autoHooks: options.autoHooks ?? defaultOptions.autoHooks,
      autoHooksPattern:
        options.autoHooksPattern ?? defaultOptions.autoHooksPattern,
      cascadeHooks: options.cascadeHooks ?? defaultOptions.cascadeHooks,
    });
  },
  {
    name: 'fastify-template-autoload',
  },
);

const defaultOptions = {
  dir: path.resolve(__dirname, '../modules'),
  matchFilter(path: string) {
    return path.endsWith('.route.ts') || path.endsWith('.route.js');
  },
  autoHooks: true,
  autoHooksPattern: /autohooks/,
  cascadeHooks: true,
};
