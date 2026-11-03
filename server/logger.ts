import { pino, type Logger } from 'pino';

export type { Logger };

const isProduction = process.env.NODE_ENV === 'production';

// pino-pretty is a dev dependency, so it is only used outside production.
export const logger: Logger = pino({
    level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]',
        ],
        censor: '[redacted]',
    },
    ...(isProduction ? {} : { transport: { target: 'pino-pretty', options: { colorize: true } } }),
});
