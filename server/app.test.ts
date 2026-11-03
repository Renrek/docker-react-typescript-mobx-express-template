// @vitest-environment node

import { Writable } from 'node:stream';
import { pino } from 'pino';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp, type DatabaseHealthCheck } from './app.js';

function createTestLogger() {
    const entries: Array<Record<string, any>> = [];
    const stream = new Writable({
        write(chunk, _encoding, callback) {
            entries.push(JSON.parse(chunk.toString()));
            callback();
        },
    });

    return { entries, logger: pino({ level: 'debug' }, stream) };
}

describe('GET /api/health', () => {
    it('returns ok when the database health check succeeds', async () => {
        const { logger } = createTestLogger();
        const checkDatabase = vi.fn<DatabaseHealthCheck>(async () => undefined);
        const response = await request(createApp(checkDatabase, { logger })).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'ok' });
        expect(checkDatabase).toHaveBeenCalledOnce();
    });

    it('returns unavailable and logs the error when the database health check fails', async () => {
        const { entries, logger } = createTestLogger();
        const error = new Error('Database unavailable');
        const checkDatabase = vi.fn<DatabaseHealthCheck>().mockRejectedValue(error);
        const response = await request(createApp(checkDatabase, { logger })).get('/api/health');

        expect(response.status).toBe(503);
        expect(response.body).toEqual({ status: 'unavailable' });
        expect(entries).toContainEqual(expect.objectContaining({
            level: 50,
            msg: 'Database health check failed',
            err: expect.objectContaining({ message: 'Database unavailable' }),
            durationMs: expect.any(Number),
        }));
    });
});

describe('request logging', () => {
    it('returns the existing API not-found response and logs it as a warning with a request id', async () => {
        const { entries, logger } = createTestLogger();
        const checkDatabase = vi.fn<DatabaseHealthCheck>(async () => undefined);
        const response = await request(createApp(checkDatabase, { logger }))
            .get('/api/not-found')
            .set('x-request-id', 'test-request-id');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'API route not found' });
        expect(response.headers['x-request-id']).toBe('test-request-id');
        expect(checkDatabase).not.toHaveBeenCalled();
        expect(entries).toContainEqual(expect.objectContaining({
            level: 40,
            req: { id: 'test-request-id', method: 'GET', url: '/api/not-found' },
            res: expect.objectContaining({ statusCode: 404 }),
            responseTime: expect.any(Number),
        }));
    });

    it('generates a request id when none is supplied', async () => {
        const { logger } = createTestLogger();
        const response = await request(createApp(async () => undefined, { logger })).get('/api/not-found');

        expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('logs requests slower than the configured threshold', async () => {
        const { entries, logger } = createTestLogger();
        await request(createApp(async () => undefined, { logger, slowRequestMs: 0 })).get('/api/not-found');

        expect(entries).toContainEqual(expect.objectContaining({
            level: 40,
            msg: 'Slow request',
            durationMs: expect.any(Number),
        }));
    });

    it('does not log successful health check polling', async () => {
        const { entries, logger } = createTestLogger();
        await request(createApp(async () => undefined, { logger })).get('/api/health');

        expect(entries).toEqual([]);
    });
});

describe('error handling', () => {
    it('returns a client error with the request id for malformed JSON', async () => {
        const { entries, logger } = createTestLogger();
        const response = await request(createApp(async () => undefined, { logger }))
            .post('/api/anything')
            .set('content-type', 'application/json')
            .send('{ invalid');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ error: 'Bad request', requestId: expect.any(String) });
        expect(entries).toContainEqual(expect.objectContaining({ level: 40, msg: 'Request rejected' }));
    });
});
