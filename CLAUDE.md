# Project Instructions

Fastify 5 REST API template (TypeScript, ESM). Package manager: **yarn**.

## Commands

```bash
yarn dev                 # start dev server (tsx watch)
yarn build               # compile to build/ (tsc)
yarn test                # full Jest suite
yarn test path/to.spec   # single file (test:coverage for coverage)
yarn lint                # ESLint check
yarn lint:fix            # ESLint auto-fix
yarn format              # Prettier write
```

## Architecture

- `src/modules/<name>/` — vertical slices, autoloaded. Each is `*.route.ts` (handlers + Zod schemas), `*.service.ts` (logic), `*.dto.ts` (Zod types), `*.spec.ts` (colocated tests).
- `src/plugins/` — Fastify plugins (autoload, docs). `src/configs/`, `src/packages/` — env + pino/zod wrappers.
- Services attach to the Fastify instance (`this.tasksService`); routes call through them, never hold state.
- Env is Zod-validated in `src/configs/env.ts`; read via the `env()` helper, never `process.env` directly.

## Workflow (agent-orchestrated feature implementation)

- Brainstorm the approach first; for any non-trivial feature, prefer a subagent-driven pipeline over doing it all inline.
- Implement test-first (`/tdd`), then loop — implement → run the matching `*.spec.ts` → review → fix — until every stated requirement is satisfied.
- Before finishing, run the review agents (code-reviewer, silent-failure-hunter, security-reviewer, performance-reviewer) on the diff and resolve findings.
- Match the existing module slice convention exactly when adding features.

## Don'ts

- Don't edit `build/`/`coverage/` (generated) or read/commit `.env*`. Don't add a database/ORM or frontend unasked — this is an in-memory API template.

## graphify

- Knowledge graph at `graphify-out/` (built via `venv/bin/graphify`). For architecture/relationship questions prefer `graphify query "<q>"` / `path "<A>" "<B>"` / `explain "<x>"` over raw grep. Run `graphify update .` after code changes (AST-only, no API cost).
