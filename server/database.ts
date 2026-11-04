import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './generated/prisma/client.js';
import { logger } from './logger.js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set before starting the server.');
}

const url = new URL(databaseUrl);

if (url.protocol !== 'mysql:') {
    throw new Error('DATABASE_URL must use the mysql:// protocol.');
}

const database = decodeURIComponent(url.pathname.slice(1));
const sslCa = process.env.DATABASE_SSL_CA;
const sslEnabled = process.env.DATABASE_SSL === 'true' || Boolean(sslCa);

if (!url.hostname || !url.username || !database) {
    throw new Error('DATABASE_URL must include a host, username, and database name.');
}

const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    connectionLimit: 10,
    allowPublicKeyRetrieval: process.env.DATABASE_ALLOW_PUBLIC_KEY_RETRIEVAL === 'true',
    ...(sslEnabled
        ? {
            ssl: {
                rejectUnauthorized: true,
                ...(sslCa ? { ca: sslCa } : {}),
            },
        }
        : {}),
});

const slowQueryMs = Number(process.env.SLOW_QUERY_MS ?? 500);

export const prisma = new PrismaClient({
    adapter,
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
    ],
});

prisma.$on('query', (event) => {
    // Query text only; parameters are never logged because they may contain sensitive data.
    if (event.duration >= slowQueryMs) {
        logger.warn({ durationMs: event.duration, query: event.query }, 'Slow database query');
    } else {
        logger.debug({ durationMs: event.duration, query: event.query }, 'Database query');
    }
});
prisma.$on('warn', (event) => logger.warn({ target: event.target }, event.message));
prisma.$on('error', (event) => logger.error({ target: event.target }, event.message));
