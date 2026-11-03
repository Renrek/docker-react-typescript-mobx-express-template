---
name: platform-conventions
description: "Use when extending or restructuring this React, TypeScript, Express, Prisma, MySQL, and Docker template. Follow its architecture, testing, migration, and deployment conventions."
---

# Platform Conventions

Use this skill when implementing features, tests, database changes, or deployment updates in this starter. Preserve its established choices unless the user explicitly requests a change. Inspect the current files and scripts before relying on this guide, and update it when a platform convention changes.

## Platform

- Keep frontend and backend code in TypeScript. The frontend is React with Vite; state management uses MobX. Do not introduce plain JavaScript application modules.
- The backend is Express on Node.js with ESM. Server TypeScript is compiled with `server/tsconfig.json`; use `.js` extensions in relative TypeScript imports to match NodeNext output.
- Prisma manages the MySQL schema and generated client. The generated client lives under `server/generated/prisma`; do not hand-edit generated files.
- Axios is an application dependency and is used by both frontend and backend code. Do not remove it without checking all call sites and confirming with the user.

## Application structure

- Put Express middleware and route wiring in `server/app.ts` through the exported `createApp` factory. Keep that module importable without opening a listening port or connecting to MySQL.
- Keep process lifecycle in `server/server.ts`: load environment configuration, connect and validate Prisma, listen, and handle graceful shutdown.
- Log with the shared pino `logger` from `server/logger.ts`, not `console`. In routes use `request.log` (carries the request ID) and pass errors as `{ err }`. The logger is injected into `createApp` so tests can capture output with an in-memory stream. Never log secrets, credentials, or query parameters.
- Add routes under `/api` before the API not-found handler. Preserve the existing health endpoint response contract unless the feature intentionally changes it.
- Use the existing React/Vite structure and follow nearby component, MobX, and Axios patterns instead of creating parallel abstractions.

## Database workflow

- Define database models and mappings in `prisma/schema.prisma`.
- For model or schema changes, create and apply a named development migration:

  ```sh
  npm run db:migrate:dev -- --name describe-change
  ```

- Commit the schema and migration files under `prisma/migrations/`. Never edit a migration that has already been applied in shared environments; create a follow-up migration.
- Use `npm run db:studio` for local database inspection. `DATABASE_URL` configures the app and Prisma; `SHADOW_DATABASE_URL` is used by Prisma Migrate in development.
- Do not run production migrations automatically on app startup. Apply committed migrations explicitly with `npm run db:migrate:deploy` from an authorized environment before releasing the corresponding app version.

## Tests and verification

- Use the existing Vitest runner for frontend and server tests; do not introduce Jest without an explicit request.
- Frontend tests use the configured `jsdom` environment and `src/setupTests.ts`.
- Express route tests should use Supertest with an app created through `createApp` and mocked dependencies. Keep server tests in the Node environment (use the per-file Vitest environment directive when needed). They should not require a live MySQL server unless a separately requested integration suite is being added.
- Cover response status and body, as well as relevant dependency behavior. Stub or assert expected error logging instead of allowing expected failure-path tests to emit noisy logs.
- Before finishing changes, run the smallest relevant test set; for cross-cutting changes, run:

  ```sh
  npm run typecheck
  npm test
  npm run build
  ```

## Docker and configuration

- `compose.dev.yaml` provides local MySQL; the frontend and Express server run as local processes during development. Follow the setup in `README.md`.
- `compose.yaml` runs the application against an externally hosted/network-reachable MySQL database. Do not add a production database service unless explicitly requested.
- Keep the Dockerfile separate from Compose. Production builds compile the TypeScript server and Vite client into the image.
- Never commit `.env` or production credentials. `.env.example` contains development-only values; keep configuration aligned across Compose and the database connection URLs.
- Preserve the health endpoint behavior used by the production Compose health check.

## Completion checklist

1. Inspect relevant code and reuse existing patterns.
2. Keep TypeScript, app/startup separation, and the current dependency direction intact.
3. If the Prisma schema changes, add a migration and describe how to apply it.
4. Update directly related README documentation when workflows or commands change.
5. Run relevant tests and type/build checks, and report any validation not run.
