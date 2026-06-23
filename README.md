# Fastify 5 REST API Template

A batteries-included starting point for building REST APIs with **Fastify 5** and **TypeScript** (ESM). Autoloaded vertical-slice modules, end-to-end Zod validation, and a production-ready Docker build — clone it and start adding endpoints.

![Node](https://img.shields.io/badge/node-%E2%89%A524-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-ESM-3178C6?logo=typescript&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Fastify 5 + TypeScript (ESM)** — modern, fully typed, ES modules throughout.
- **Autoloaded modules** — drop a `*.route.ts` file into `src/modules/` and it's registered automatically. No central route table.
- **End-to-end Zod validation** — one schema validates env vars, request bodies/params/queries, *and* generates response JSON Schemas.
- **Interactive API docs** — Swagger spec rendered with [Scalar](https://scalar.com) at `/docs` (development only).
- **Opt-in CORS** — enabled only when `CORS_ORIGIN` is set.
- **Trust proxy** — configurable via `TRUST_PROXY` for correct client IPs behind load balancers.
- **Auto port detection** — falls back to the next free port if the configured one is taken.
- **Graceful shutdown** — drains in-flight requests on `SIGTERM`/`SIGINT`.
- **Multi-stage Docker build** — minimal non-root runtime image with a built-in healthcheck.
- **Colocated Jest tests** — every slice keeps its `*.spec.ts` next to the code it covers.

## Quick start

**Prerequisites:** Node.js ≥ 24 and [Yarn](https://yarnpkg.com).

```bash
yarn install
yarn dev
```

The server starts on **http://localhost:3001**. Once it's up:

| What | URL |
| --- | --- |
| API | http://localhost:3001 |
| Interactive docs (dev only) | http://localhost:3001/docs |
| Health probe | http://localhost:3001/health |

> If port `3001` is already in use, the server automatically picks the next free port and logs the address it bound to.

## Scripts

| Script | Description |
| --- | --- |
| `yarn dev` | Start the dev server with hot reload (`tsx watch`). |
| `yarn build` | Compile TypeScript to `build/`. |
| `yarn start` | Run the compiled server (`build/main.js`). |
| `yarn test` | Run the full Jest suite. |
| `yarn test:watch` | Run Jest in watch mode. |
| `yarn test:coverage` | Run tests with a coverage report. |
| `yarn lint` | Check with ESLint. |
| `yarn lint:fix` | Auto-fix ESLint issues. |
| `yarn format` | Format `src/` with Prettier. |

## Project structure

```
src/
├── main.ts                 # entrypoint: env init, port detection, graceful shutdown
├── app.ts                  # Fastify instance + global error/not-found handlers
├── bootstrap.ts            # registers docs (dev), CORS (opt-in), and autoload
├── init.ts                 # loads .env files via dotenvx before anything else
├── configs/
│   └── env.ts              # Zod schema describing every environment variable
├── packages/               # thin wrappers (pino logger, env accessor)
├── plugins/
│   ├── autoload.ts         # registers every *.route.ts under modules/
│   └── docs.ts             # Swagger + Scalar UI
└── modules/                # vertical slices — one folder per resource
    ├── globals.autohooks.ts  # decorates the instance with shared services
    ├── health/
    │   └── health.route.ts
    └── tasks/
        ├── tasks.route.ts    # handlers + route schemas
        ├── tasks.service.ts  # business logic (no Fastify knowledge)
        ├── tasks.dto.ts      # Zod schemas + inferred types
        ├── tasks.route.spec.ts
        └── tasks.service.spec.ts
```

**The slice convention.** Each module folder is self-contained and owns four kinds of file:

- `*.dto.ts` — Zod schemas and the types inferred from them. The single source of truth for a resource's shape.
- `*.service.ts` — business logic as a plain class. Knows nothing about HTTP; easy to unit-test.
- `*.route.ts` — a default-export `async (app) => { ... }` function defining handlers and their request/response schemas.
- `*.spec.ts` — Jest tests, colocated.

Routes are matched by autoload using the `*.route.ts` suffix and prefixed with their folder name (so `modules/tasks/tasks.route.ts` serves under `/tasks`). Shared services are attached to the Fastify instance via `*.autohooks.ts` and called through `this` inside handlers — routes never hold state.

## Using the example API

The template ships a `health` probe and an in-memory `tasks` CRUD module so you have something working on first run. Responses are wrapped in a `{ "data": ... }` envelope.

```bash
# Health probe
curl http://localhost:3001/health
# { "status": "ok" }

# Create a task
curl -X POST http://localhost:3001/tasks \
  -H 'Content-Type: application/json' \
  -d '{ "title": "Write docs", "description": "Draft the README" }'
# { "data": { "id": "…", "title": "Write docs", "completed": false, "createdAt": "…", "updatedAt": "…", … } }

# List tasks (supports id, title, description, completed, and createdAt/updatedAt range filters)
curl http://localhost:3001/tasks
curl 'http://localhost:3001/tasks?completed=true'

# Update a task (partial)
curl -X PATCH http://localhost:3001/tasks/<taskId> \
  -H 'Content-Type: application/json' \
  -d '{ "completed": true }'

# Delete a task
curl -X DELETE http://localhost:3001/tasks/<taskId>
```

> Task data lives in memory and resets on restart. This is a template — swap the service for a real datastore when you build on it.

## Adding your own module

Use the `tasks` slice as your reference. To add, say, a `users` resource:

1. **Create the folder:** `src/modules/users/`.

2. **Define the schema** in `users.dto.ts` — a Zod object plus its inferred type:

   ```ts
   import z from 'zod';

   export const user = z.object({
     id: z.uuidv4(),
     email: z.email(),
     createdAt: z.iso.datetime(),
   });
   export type User = z.infer<typeof user>;
   ```

3. **Write the logic** in `users.service.ts` as a plain class — no Fastify imports.

4. **Expose the shared service** by decorating the instance in `src/modules/globals.autohooks.ts` (or a module-local `*.autohooks.ts`):

   ```ts
   app.decorate('usersService', new UsersService());
   ```

   Add the matching property to the `FastifyInstance` interface declaration so it's typed on `this`.

5. **Add the route** in `users.route.ts` — default-export an async function and call through `this.usersService`:

   ```ts
   import { FastifyInstance } from 'fastify';

   export default async function (app: FastifyInstance) {
     app.route({
       method: 'GET',
       url: '/',
       schema: { description: 'List users', tags: ['Users'] },
       handler() {
         return { data: this.usersService.getUsers() };
       },
     });
   }
   ```

6. **Colocate tests** in `users.service.spec.ts` / `users.route.spec.ts`.

That's it — autoload registers the route on the next start (under `/users`), and it shows up in `/docs` automatically. No central registration step.

## Configuration

Environment variables are validated by a Zod schema in `src/configs/env.ts` and read through the `env()` helper — never `process.env` directly. Invalid config fails fast at startup.

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | One of `development`, `test`, `production`. Gates the docs UI and log formatting. |
| `PORT` | `3001` | Port to bind. Auto-bumps to the next free port if taken. |
| `TRUST_PROXY` | `loopback` | Comma-separated proxy IPs/subnets Fastify should trust for client-IP resolution. |
| `CORS_ORIGIN` | _(unset)_ | Comma-separated allowed origins. CORS is disabled entirely when this is unset. |

**Env file loading.** On startup `init.ts` loads files via `dotenvx` in this order of precedence (first found wins per key): `.env.<NODE_ENV>.local` → `.env.<NODE_ENV>` → `.env.local` → `.env`. Keep secrets in the `*.local` variants — they're gitignored.

## Docker

The included multi-stage `Dockerfile` produces a small image that compiles TypeScript, installs production dependencies only, and runs as a non-root `node` user under [tini](https://github.com/krallin/tini).

```bash
docker build -t fastify-template .
docker run -p 3001:3001 fastify-template
```

The image sets `NODE_ENV=production`, exposes port `3001`, and ships a `HEALTHCHECK` that polls `/health`. Pass runtime config with `-e`, e.g. `docker run -p 3001:3001 -e CORS_ORIGIN=https://example.com fastify-template`.

## License

MIT © Jomariel Gaitera
