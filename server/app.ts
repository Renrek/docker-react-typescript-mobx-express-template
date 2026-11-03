import express, { type ErrorRequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pinoHttp } from 'pino-http';
import type { Logger } from './logger.js';

export type DatabaseHealthCheck = () => Promise<unknown>;

export interface AppOptions {
    logger: Logger;
    slowRequestMs?: number;
}

// Body parser and similar middleware attach a 4xx status to errors caused by the client.
function getClientErrorStatus(error: unknown): number | undefined {
    const status = (error as { status?: unknown } | null)?.status;
    return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined;
}

export function createApp(checkDatabase: DatabaseHealthCheck, { logger, slowRequestMs = 1000 }: AppOptions) {
    const app = express();
    const buildDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../build');

    app.use(pinoHttp({
        logger,
        genReqId: (request, response) => {
            const incoming = request.headers['x-request-id'];
            const id = typeof incoming === 'string' && incoming ? incoming : randomUUID();
            response.setHeader('x-request-id', id);
            return id;
        },
        // Keep the health check (polled by Docker) and static assets out of the logs.
        autoLogging: {
            ignore: (request) => request.url === '/api/health' || !request.url?.startsWith('/api'),
        },
        customLogLevel: (_request, response, error) => {
            if (error || response.statusCode >= 500) return 'error';
            if (response.statusCode >= 400) return 'warn';
            return 'info';
        },
        serializers: {
            req: (request: { id: string; method: string; url: string }) => ({
                id: request.id,
                method: request.method,
                url: request.url,
            }),
            res: (response: { statusCode: number }) => ({ statusCode: response.statusCode }),
        },
    }));

    // Slow requests are logged at warn level, including ones excluded from automatic logging.
    app.use((request, response, next) => {
        const start = process.hrtime.bigint();
        response.on('finish', () => {
            const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
            if (durationMs >= slowRequestMs) {
                request.log.warn(
                    { method: request.method, url: request.originalUrl, statusCode: response.statusCode, durationMs },
                    'Slow request',
                );
            }
        });
        next();
    });

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(buildDirectory));

    app.get('/api/health', async (request, response) => {
        const start = process.hrtime.bigint();
        try {
            await checkDatabase();
            response.status(200).json({ status: 'ok' });
        } catch (error) {
            request.log.error(
                { err: error, durationMs: Number(process.hrtime.bigint() - start) / 1e6 },
                'Database health check failed',
            );
            response.status(503).json({ status: 'unavailable' });
        }
    });

    app.use('/api', (_request, response) => {
        response.status(404).json({ error: 'API route not found' });
    });

    app.get('*', (_request, response) => {
        response.sendFile(resolve(buildDirectory, 'index.html'));
    });

    const handleError: ErrorRequestHandler = (error: unknown, request, response, next) => {
        const status = getClientErrorStatus(error) ?? 500;
        if (status >= 500) {
            request.log.error({ err: error }, 'Request failed');
        } else {
            // Client errors can carry the request body, so log only the message.
            request.log.warn({ status, reason: error instanceof Error ? error.message : 'Bad request' }, 'Request rejected');
        }

        if (response.headersSent) {
            next(error);
            return;
        }

        response.status(status).json({
            error: status >= 500 ? 'Internal server error' : 'Bad request',
            requestId: request.id,
        });
    };
    app.use(handleError);

    return app;
}
