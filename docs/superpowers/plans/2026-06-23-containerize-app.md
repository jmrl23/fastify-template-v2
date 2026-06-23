# Optimized Containerization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Containerize the Fastify template into a small, secure, production-ready Docker image with graceful shutdown and a healthcheck.

**Architecture:** A 3-stage Dockerfile on `node:24-alpine` (compile → prune to prod deps → minimal runtime), preceded by small app-code changes: a `/health` route, lazy-loaded dev docs so ~15MB of Swagger/Scalar leaves the prod image, and SIGTERM/SIGINT graceful shutdown.

**Tech Stack:** Node 24, Yarn Classic, TypeScript (`tsc` → CommonJS `build/`), Fastify 5, Docker multi-stage, Alpine, tini.

## Global Constraints

- Runtime base image: `node:24-alpine`. Build with the same base.
- Yarn installs use `--frozen-lockfile` for reproducibility.
- Production image runs as the non-root built-in `node` user.
- Build output is CommonJS in `build/`; start command is `node build/main.js`.
- Dynamic imports use `.js` specifiers (matches existing `main.ts` style, e.g. `import('./app.js')`).
- Existing `yarn test` and `yarn lint` must stay green after every task.
- Full coverage is maintained: any new file under `src/modules/**` must have its handler exercised by a spec.

---

### Task 1: Health route

**Files:**
- Create: `src/modules/health/health.route.ts`
- Test: `src/modules/health/health.route.spec.ts`

**Interfaces:**
- Consumes: nothing (autoloaded by `@fastify/autoload` via the `*.route.ts` matcher; folder `health` → URL prefix `/health`).
- Produces: HTTP endpoint `GET /health` → `200 { "status": "ok" }`. Relied on by the Dockerfile `HEALTHCHECK` in Task 4.

- [ ] **Step 1: Write the failing test**

Create `src/modules/health/health.route.spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import fastify, { FastifyInstance } from 'fastify';
import healthRoute from './health.route';

function buildApp(): FastifyInstance {
  const app = fastify();
  void app.register(healthRoute, { prefix: '/health' });
  return app;
}

describe('health route', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/modules/health/health.route.spec.ts`
Expected: FAIL — cannot find module `./health.route`.

- [ ] **Step 3: Write the route**

Create `src/modules/health/health.route.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/modules/health/health.route.spec.ts`
Expected: PASS.

- [ ] **Step 5: Verify lint stays green**

Run: `yarn lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/modules/health/health.route.ts src/modules/health/health.route.spec.ts
git commit -m "feat: add /health route for container healthcheck"
```

---

### Task 2: Lazy-load dev docs and slim production dependencies

**Files:**
- Modify: `src/bootstrap.ts`
- Modify: `package.json` (move two deps from `dependencies` to `devDependencies`)

**Interfaces:**
- Consumes: `./plugins/docs` (now imported dynamically), `env('NODE_ENV')`.
- Produces: unchanged public behavior — docs mount at `/docs` only when `NODE_ENV === 'development'`. Difference: `@fastify/swagger` and `@scalar/fastify-api-reference` are no longer loaded (or installed) in production.

> **Verification note:** This task is a refactor + dependency move. Its correctness is verified by `yarn build` (compiles with the deps moved), `yarn lint`, and the existing `yarn test` suite staying green — not by a new unit test, because the production-exclusion behavior can only be observed once the deps are physically absent, which happens in the Task 4 image build (`prod-deps` stage installs `--production`). A brittle autoload-based bootstrap test is deliberately avoided.

- [ ] **Step 1: Confirm the current static import (baseline)**

Run: `yarn build && yarn test`
Expected: build succeeds, all tests pass (baseline green before changes).

- [ ] **Step 2: Change the docs import to be dynamic and development-only**

Edit `src/bootstrap.ts`. Replace the entire file contents with:

```ts
import fastifyPlugin from 'fastify-plugin';
import { autoload } from './plugins/autoload';
import { env } from './packages/zod/env';

export const bootstrap = fastifyPlugin(async function (app) {
  if (env('NODE_ENV') === 'development') {
    const { docs } = await import('./plugins/docs.js');
    await app.register(docs);
  }

  await app.register(autoload);
});
```

(The top-level `import { docs } from './plugins/docs';` line is removed; `docs` is now imported inside the branch.)

- [ ] **Step 3: Move docs packages to devDependencies in `package.json`**

In `package.json`, delete these two lines from the `"dependencies"` block:

```json
    "@fastify/swagger": "^9.7.0",
    "@scalar/fastify-api-reference": "^1.61.0",
```

And add them into the `"devDependencies"` block (keep alphabetical-ish ordering near the top):

```json
    "@fastify/swagger": "^9.7.0",
    "@scalar/fastify-api-reference": "^1.61.0",
```

- [ ] **Step 4: Reinstall so the lockfile reflects the new dependency grouping**

Run: `yarn install`
Expected: completes; `yarn.lock` may show updated grouping. Both packages remain installed locally (they are devDependencies, still present in dev).

- [ ] **Step 5: Verify build, lint, and tests stay green**

Run: `yarn build && yarn lint && yarn test`
Expected: build succeeds (proves `docs.ts` still type-checks with the deps available at build time), lint clean, all existing tests pass.

- [ ] **Step 6: Manually confirm dev docs still work**

Run: `NODE_ENV=development yarn dev` in one terminal, then in another: `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/docs`
Expected: `200`. Stop the dev server afterward (Ctrl-C).

- [ ] **Step 7: Commit**

```bash
git add src/bootstrap.ts package.json yarn.lock
git commit -m "perf: lazy-load docs and move swagger/scalar to devDependencies"
```

---

### Task 3: Graceful shutdown on SIGTERM/SIGINT

**Files:**
- Modify: `src/main.ts`

**Interfaces:**
- Consumes: the `app` instance created in `main()`.
- Produces: process-level `SIGTERM`/`SIGINT` handlers that call `app.close()` then `process.exit(0)`. Pairs with `tini` as PID 1 in Task 4.

> **Verification note:** `main.ts` bootstraps the server and is outside the coverage scope (`collectCoverageFrom` is `modules/**` only; `app.ts`/`bootstrap.ts`/`main.ts` are likewise untested in this repo). It is verified by `yarn build` here and by the `docker stop` graceful-shutdown check in Task 4.

- [ ] **Step 1: Add signal handlers in `main.ts`**

Edit `src/main.ts`. Replace the whole file with:

```ts
async function main() {
  await (await import('./init.js')).init();

  const [{ app }, { bootstrap }, { detect }] = await Promise.all([
    import('./app.js'),
    import('./bootstrap.js'),
    import('detect-port'),
  ]);

  const host = '0.0.0.0';
  const port = await detect({
    hostname: host,
    port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
  });

  await app.register(bootstrap);

  const closeGracefully = async (signal: NodeJS.Signals) => {
    app.log.info(`Received ${signal}, shutting down`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void closeGracefully('SIGTERM'));
  process.on('SIGINT', () => void closeGracefully('SIGINT'));

  app.listen(
    {
      host,
      port,
      listenTextResolver(address) {
        return `Listening at ${address}`;
      },
    },
    (error) => {
      if (error) {
        console.error(error);
        process.exit(1);
      }
    },
  );
}

void main();
```

- [ ] **Step 2: Verify build and lint**

Run: `yarn build && yarn lint`
Expected: build succeeds, lint clean.

- [ ] **Step 3: Manually confirm shutdown locally**

Run: `yarn build && yarn start` in one terminal. Press Ctrl-C.
Expected: a `Received SIGINT, shutting down` log line, then the process exits cleanly (no hang, exit code 0).

- [ ] **Step 4: Commit**

```bash
git add src/main.ts
git commit -m "feat: graceful shutdown on SIGTERM/SIGINT"
```

---

### Task 4: Dockerfile, .dockerignore, and healthcheck

**Files:**
- Create: `.dockerignore`
- Create: `Dockerfile`

**Interfaces:**
- Consumes: `GET /health` (Task 1), graceful shutdown (Task 3), slimmed prod deps (Task 2).
- Produces: a runnable production image exposing port 3001, running as `node`, with `tini` as PID 1 and a container `HEALTHCHECK`.

- [ ] **Step 1: Create `.dockerignore`**

Create `.dockerignore`:

```
node_modules
build
coverage
.git
.gitignore
.env
.env.*
*.local
Dockerfile
.dockerignore
docs
**/*.spec.ts
**/*.test.ts
jest.config.ts
jest.global-setup.ts
jest.global-teardown.ts
eslint.config.ts
tsconfig.eslint.json
.prettierrc
```

- [ ] **Step 2: Create the multi-stage `Dockerfile`**

Create `Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1

# ---- Stage 1: build (compile TypeScript) ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN yarn build

# ---- Stage 2: production dependencies only ----
FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

# ---- Stage 3: minimal runtime ----
FROM node:24-alpine AS runtime
RUN apk add --no-cache tini
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/build ./build
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider "http://127.0.0.1:${PORT:-3001}/health" || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "build/main.js"]
```

- [ ] **Step 3: Build the image**

Run: `docker build -t fastify-template:latest .`
Expected: build completes through all three stages with no errors. Crucially, the `prod-deps` stage installs WITHOUT `@scalar/*` / `@fastify/swagger`, and the runtime still starts (proves Task 2's lazy import works).

- [ ] **Step 4: Run the container**

Run: `docker run -d --rm -p 3001:3001 --name ft fastify-template:latest`
Then wait ~2s and run: `curl -s http://127.0.0.1:3001/health`
Expected: `{"status":"ok"}`.

- [ ] **Step 5: Verify non-root user**

Run: `docker exec ft whoami`
Expected: `node`.

- [ ] **Step 6: Verify the healthcheck reports healthy**

Run: `docker inspect --format '{{.State.Health.Status}}' ft`
Expected: `healthy` (allow up to ~35s for the first interval; re-run if `starting`).

- [ ] **Step 7: Verify graceful shutdown**

Run: `docker stop ft && docker logs ft 2>&1 | tail -n 5`
Expected: logs include a `Received SIGTERM, shutting down` line and the container stops promptly (well under the 10s Docker kill grace period). Note: `--rm` removes the container after stop; if you need logs, drop `--rm` in Step 4 and `docker rm ft` manually after inspecting.

- [ ] **Step 8: Check the image size**

Run: `docker images fastify-template:latest`
Expected: a non-root Alpine image roughly in the ~180–200MB range (well under a naive single-stage build).

- [ ] **Step 9: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: add optimized multi-stage Dockerfile and .dockerignore"
```

---

## Self-Review

**Spec coverage:**
- Multi-stage build / Alpine / prod-only deps / non-root / layer caching → Task 4 (Dockerfile stages, `--production`, `USER node`, lockfile-before-source). ✔
- Health route for HEALTHCHECK → Task 1. ✔
- Lazy docs import + move deps to devDependencies (~15MB saving) → Task 2. ✔
- Graceful shutdown + tini → Task 3 (handlers) + Task 4 (tini ENTRYPOINT). ✔
- `.dockerignore` → Task 4 Step 1. ✔
- HEALTHCHECK via busybox wget with `${PORT}` → Task 4 Step 2. ✔
- Runtime env (`NODE_ENV=production`, `PORT`, `EXPOSE`) → Task 4 Step 2. ✔
- Verification (build, /health 200, graceful stop, non-root, tests/lint green) → Tasks 1–4 steps. ✔

**Placeholder scan:** No TBD/TODO/"handle edge cases"; all code and commands are concrete. ✔

**Type/name consistency:** `GET /health` → `{ status: 'ok' }` is produced in Task 1 and consumed by the Task 4 healthcheck URL. `closeGracefully` defined once in Task 3. Dynamic import path `./plugins/docs.js` matches existing `.js`-specifier convention. ✔
