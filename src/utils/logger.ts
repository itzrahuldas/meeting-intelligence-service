import winston from 'winston';
import env from '../config/env';

const { combine, timestamp, printf, colorize, json } = winston.format;

const devFormat = printf(({ level, message, timestamp, traceId, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${timestamp} [${traceId || 'no-trace'}] ${level}: ${message} ${metaStr}`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    env.NODE_ENV === 'development' ? combine(colorize(), devFormat) : json()
  ),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'meeting-intelligence' },
});
