import 'dotenv/config';
import { createApp } from './app.js';
import { prisma } from './database.js';
import { logger } from './logger.js';

const port = Number(process.env.PORT ?? 5000);
const app = createApp(() => prisma.$queryRaw`SELECT 1`, { logger });

process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception; exiting');
    process.exit(1);
});

async function startServer(): Promise<void> {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;

    const server = app.listen(port, () => {
        logger.info({ port, nodeEnv: process.env.NODE_ENV }, 'Server is active');
    });

    const shutdown = (signal: NodeJS.Signals): void => {
        logger.info({ signal }, 'Shutting down');
        server.close((error) => {
            if (error) {
                logger.error({ err: error }, 'Error closing HTTP server');
                process.exitCode = 1;
            }

            void prisma.$disconnect().catch((disconnectError: unknown) => {
                logger.error({ err: disconnectError }, 'Error disconnecting Prisma');
                process.exitCode = 1;
            });
        });
    };

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
}

startServer().catch((error: unknown) => {
    logger.fatal({ err: error }, 'Unable to start server');
    void prisma.$disconnect().catch((disconnectError: unknown) => {
        logger.error({ err: disconnectError }, 'Error disconnecting Prisma');
    }).finally(() => {
        process.exitCode = 1;
    });
});
