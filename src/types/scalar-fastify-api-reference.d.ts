/**
 * @scalar/fastify-api-reference ships .d.ts files with extensionless relative
 * imports, which fail to resolve under `moduleResolution: node16`/`nodenext`
 * (TS2834), collapsing the plugin's type to `any`. This stub restores the
 * plugin's real shape so `no-unsafe-argument` doesn't fire on `app.register`.
 */
declare module '@scalar/fastify-api-reference' {
  import type {
    FastifyBaseLogger,
    FastifyPluginCallback,
    FastifyTypeProviderDefault,
    RawServerDefault,
  } from 'fastify';

  export type FastifyApiReferenceOptions = {
    routePrefix?: `/${string}`;
    openApiDocumentEndpoints?: {
      json?: `/${string}`;
      yaml?: `/${string}`;
    };
    configuration?: Record<string, unknown>;
    logLevel?:
      'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  };

  const fastifyApiReference: FastifyPluginCallback<
    FastifyApiReferenceOptions,
    RawServerDefault,
    FastifyTypeProviderDefault,
    FastifyBaseLogger
  >;

  export default fastifyApiReference;
}
