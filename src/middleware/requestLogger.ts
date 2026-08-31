import { pinoHttp } from 'pino-http';
import { logger } from '../lib/logger.js';

export const requestLogger = pinoHttp({
  logger,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res, responseTime) => {
    const url = typeof req.url === 'string' ? req.url : '';
    const method = typeof req.method === 'string' ? req.method : 'UNKNOWN';
    return `${method} ${url} completed with ${res.statusCode} in ${responseTime}ms`;
  },
  customErrorMessage: (req, res, err) => {
    const url = typeof req.url === 'string' ? req.url : '';
    const method = typeof req.method === 'string' ? req.method : 'UNKNOWN';
    return `${method} ${url} failed with ${res.statusCode}: ${err.message}`;
  },
});
