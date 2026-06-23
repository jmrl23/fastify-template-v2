# Optimized Containerization of the Fastify Template

**Date:** 2026-06-23
**Status:** Approved

## Goal

Produce a production Docker image that is as small and secure as practical:

- Multi-stage build (toolchain never reaches the runtime image)
- Alpine runtime base (`node:24-alpine`)
- Production-only dependencies
- Non-root user
- Proper PID-1 signal handling with graceful shutdown
- Built-in container healthcheck

## Context

The project is a Fastify + TypeScript template:

- Node 24, Yarn Classic (1.22), `yarn.lock` committed.
- Build: `tsc -p tsconfig.build.json` → `build/` (CommonJS; no `"type"` field).
- Start: `node ./build/main.js`.
- Env: `@dotenvx/dotenvx` loads `.env.*` files if present, otherwise falls back to `process.env`.
- Logging: `pino`; `pino-pretty` transport is used **only** in development (it is a devDependency).
- Docs: `@fastify/swagger` + `@scalar/fastify-api-reference` are registered **only** when `NODE_ENV === 'development'`, but `bootstrap.ts` imports the docs plugin **statically**, so these ~15MB of packages are `require`d at startup even in production.
- Routing: `@fastify/autoload` loads `src/modules/**/*.route.ts`, with the module folder name as the URL prefix.

## Architecture — Multi-stage Dockerfile

Single base image `node:24-alpine`, three stages:

### Stage 1 — `build`
- Copy `package.json` + `yarn.lock`, run `yarn install --frozen-lockfile` (all deps, incl. dev).
- Copy `src/` and `tsconfig*.json`.
- Run `yarn build` → emits `build/`.

### Stage 2 — `prod-deps`
- Copy `package.json` + `yarn.lock`, run `yarn install --frozen-lockfile --production`.
- `yarn cache clean` to drop the package cache.
- Produces a clean production-only `node_modules`, cached independently of source changes.

### Stage 3 — `runtime`
- Fresh `node:24-alpine`.
- `apk add --no-cache tini`.
- Copy `node_modules` from `prod-deps` and `build/` from `build`, both `--chown=node:node`.
- Copy `package.json` (needed for `main` / runtime metadata).
- `ENV NODE_ENV=production`, `ENV PORT=3001`, `EXPOSE 3001`.
- `USER node` (built-in non-root user, uid 1000).
- `HEALTHCHECK` (see below).
- `ENTRYPOINT ["/sbin/tini", "--"]` so tini is PID 1 and forwards signals.
- `CMD ["node", "build/main.js"]`.

### Layer caching
`package.json` + `yarn.lock` are copied and installed **before** source is copied in both install stages, so dependency layers rebuild only when the lockfile changes.

## Code changes

All changes preserve existing development behavior.

### 1. New health route — `src/modules/health/health.route.ts`
- `GET /health` → `{ status: 'ok' }`.
- Follows the existing autoloaded `*.route.ts` folder-prefix convention (folder `health` → prefix `/health`, route url `/`).
- Required by the container `HEALTHCHECK`.

### 2. Lazy docs import — `src/bootstrap.ts`
- Remove the top-level `import { docs } from './plugins/docs'`.
- Inside the `NODE_ENV === 'development'` branch, use `const { docs } = await import('./plugins/docs.js')` before registering.
- Effect: Swagger/Scalar are never loaded in production, so the packages can be dev-only.

### 3. Graceful shutdown — `src/main.ts`
- Add `SIGTERM` and `SIGINT` handlers that log, call `await app.close()`, then `process.exit(0)`.
- Combined with tini, this gives clean connection draining on `docker stop`.

### 4. Dependency move — `package.json`
- Move `@fastify/swagger` and `@scalar/fastify-api-reference` from `dependencies` to `devDependencies`.
- Drops ~15MB from the production image. The `build` stage still installs them (it installs all deps), so `tsc` compiles `docs.ts` fine; the `prod-deps` stage and runtime image exclude them. Since `docs.js` is only dynamically imported in development, production never loads them.

## Supporting files

### `.dockerignore`
Excludes from the build context: `node_modules`, `build`, `coverage`, `.git`, `.env*`, test/spec files, and other artifacts not needed to build. Keeps the build context small and prevents secrets/bloat from entering image layers.

### `HEALTHCHECK`
Uses busybox `wget` (already present in Alpine), shell form so `${PORT}` expands:

```
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT:-3001}/health" || exit 1
```

No extra binary (curl) required.

## Runtime configuration

- Env vars injected at `docker run` time. dotenvx falls back to `process.env` when no `.env` files exist in the image (none are copied in).
- `NODE_ENV=production` ensures docs are not registered and pino uses the production (non-pretty) logger — consistent with `pino-pretty` being dev-only.

## Expected result

A non-root Alpine image roughly **~180–200MB** uncompressed, versus 1GB+ for a naive single-stage image that bundles the toolchain, dev dependencies, and source.

## Verification

1. `docker build` succeeds.
2. Container starts; `GET /health` returns 200.
3. `docker stop` shows graceful-shutdown log lines (signal received → app closed).
4. Process runs as the non-root `node` user.
5. Existing `yarn test` and `yarn lint` still pass after the code changes.

## Out of scope

- `docker-compose.yml` (not requested).
- Dedicated env-var documentation file (not requested).
- Multi-arch builds, CI pipeline wiring, image registry/publishing.
- Replacing `detect-port` (harmless in a single-process container; left as-is).
