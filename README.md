# React, TypeScript, Express, and Prisma starter

The frontend and backend are TypeScript. Vite serves the React development app, Express provides the API and production static files, and Prisma manages the MySQL schema and client.

## Requirements

- Node.js 22.12 or later
- Docker Compose

## Quick start

1. Create your local environment file and start the development database:

```sh
cp .env.example .env
docker compose -f compose.dev.yaml up -d --wait
```

2. Install dependencies and apply the starter migration:

```sh
npm ci
npm run db:migrate:dev
```

3. Start the Express server and Vite frontend in separate terminals:

```sh
npm run dev:server
```

```sh
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` requests to Express on port 5000. You can check the server and database connection at [http://localhost:5000/api/health](http://localhost:5000/api/health).

## Development workflow

### Database models and migrations

The starter includes a sample `User` model in `prisma/schema.prisma`. Add or edit models there, then create and apply a named migration:

```sh
npm run db:migrate:dev -- --name add-example-model
```

Prisma Migrate updates the development database and generates the Prisma client. Commit both the schema change and the new migration under `prisma/migrations/`. Use `npm run db:studio` to inspect and edit development data with Prisma Studio.

`DATABASE_URL` configures the app and Prisma. `SHADOW_DATABASE_URL` points to a separate schema used by Prisma Migrate during development. The Compose setup creates the local shadow schema when MySQL initializes. If you change the development MySQL credentials or database names, update `.env` to keep the Compose settings and connection URLs in sync. URL-encode special characters in usernames and passwords in database URLs.

MySQL data is stored in a named Docker volume. Stop the database with:

```sh
docker compose -f compose.dev.yaml down
```

Adding `-v` deletes the local database volume and its data.

`compose.dev.yaml` starts MySQL and the built app container. The container is served at [http://localhost:8080](http://localhost:8080) (set `APP_PORT` to change it), so it does not conflict with the dev server on port 5000. The container does not apply migrations; run `npm run db:migrate:dev` first. To start only the database, run `docker compose -f compose.dev.yaml up -d --wait mysql`.

### Tests and checks

Run the frontend component tests and Express HTTP route tests:

```sh
npm test
```

The Express tests use mocked database health checks and do not require MySQL. Use `npm run test:watch` while developing tests. Before submitting changes, run the TypeScript checks and production build:

```sh
npm run typecheck
npm run build
```

The server and client are both TypeScript. Keep the Prisma schema and migrations up to date when changing database models.

`.env.example` contains development-only credentials; never use them in production.

### Logging and troubleshooting

The server uses [pino](https://getpino.io). In development logs are pretty-printed; in production (`NODE_ENV=production`) they are JSON lines on stdout, readable with `docker compose logs app`.

- `LOG_LEVEL` sets verbosity (`fatal`, `error`, `warn`, `info`, `debug`, `trace`; default `info` in production, `debug` in development).
- Every `/api` request is logged with its method, URL, status code and `responseTime` (ms). Status 5xx logs at `error`, 4xx at `warn`. Successful health checks and static assets are not logged.
- Each response has an `x-request-id` header (an incoming `x-request-id` is reused). Error responses include `requestId`, so a user-reported ID can be searched in the logs.
- Requests slower than one second log a `Slow request` warning. Database queries slower than `SLOW_QUERY_MS` (default 500) log a `Slow database query` warning; at `debug` level all queries are logged with their duration. Query parameters are never logged.
- Errors are logged with stack traces, including unhandled request errors, unhandled promise rejections and uncaught exceptions. `authorization` and `cookie` headers are never logged.

Use `request.log` inside route handlers to log with the request ID attached, for example `request.log.info({ userId }, 'User created')`. Pass errors as `{ err }` so the stack is serialized. Avoid logging passwords, tokens or other personal data.

## Production

The production Compose service does not start a database. Set `DATABASE_URL` to the network-hosted MySQL address and credentials, then build and start the app:

```sh
docker compose up --build
```

The database host must be reachable from the app container. Keep production credentials outside source control. For app connections that require TLS, set `DATABASE_SSL=true`; provide a trusted CA certificate in `DATABASE_SSL_CA` when needed. When running Prisma migrations against a TLS-protected database, configure Prisma's MySQL TLS URL options in `DATABASE_URL` and make any referenced certificate file available to the migration process.

Before releasing an application version that includes new migrations, apply the committed migrations to the deployment database from a trusted environment with database access:

```sh
npm run db:migrate:deploy
```

Do not run production migrations automatically when the app starts.
