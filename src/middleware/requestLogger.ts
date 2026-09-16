import { pinoHttp } from 'pino-http';

import { logger } from '../lib/logger.js';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
};

const getMethodColor = (method: string): string => {
  switch (method.toUpperCase()) {
    case 'GET':
      return `${colors.green}${method}${colors.reset}`;
    case 'POST':
      return `${colors.yellow}${method}${colors.reset}`;
    case 'PUT':
    case 'PATCH':
      return `${colors.cyan}${method}${colors.reset}`;
    case 'DELETE':
      return `${colors.red}${method}${colors.reset}`;
    default:
      return `${colors.magenta}${method}${colors.reset}`;
  }
};

export const requestLogger = pinoHttp({
  logger,
  // Suppress automatic dumping of req/res details
  serializers: {
    req: () => undefined,
    res: () => undefined,
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res, responseTime) => {
    const url = typeof req.url === 'string' ? req.url : '';
    const rawMethod = typeof req.method === 'string' ? req.method : 'UNKNOWN';
    const method = getMethodColor(rawMethod);

    return `${method} ${colors.bold}${url}${colors.reset} ${colors.green}${res.statusCode}${colors.reset} ${colors.dim}(${responseTime}ms)${colors.reset}`;
  },
  customErrorMessage: (req, res, err) => {
    const url = typeof req.url === 'string' ? req.url : '';
    const rawMethod = typeof req.method === 'string' ? req.method : 'UNKNOWN';
    const method = getMethodColor(rawMethod);

    return `${method} ${colors.bold}${url}${colors.reset} ${colors.red}${res.statusCode}${colors.reset} - ${colors.red}${err.message}${colors.reset}`;
  },
});
