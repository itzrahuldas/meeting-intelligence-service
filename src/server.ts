import { app } from './app';
import env from './config/env';
import { logger } from './utils/logger';
import { startScheduler } from './services/scheduler.service';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Server running on port ${env.PORT}`, {
    environment: env.NODE_ENV,
    port: env.PORT,
    docs: `http://localhost:${env.PORT}/api-docs`,
    health: `http://localhost:${env.PORT}/health`,
  });

  // Start the reminder scheduler
  startScheduler();
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});
