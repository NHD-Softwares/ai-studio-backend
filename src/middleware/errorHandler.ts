import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import { ApiError } from '../errors/ApiError.js';
import { logger } from '../lib/logger.js';

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    logger.warn({ errors: formattedErrors }, 'Validation error');

    res.status(422).json({
      status: 'fail',
      statusCode: 422,
      message: 'Validation failed',
      errors: formattedErrors,
    });
    return;
  }

  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err, statusCode: err.statusCode }, err.message);
    } else {
      logger.warn({ statusCode: err.statusCode, message: err.message }, 'Operational error');
    }

    res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
    });
    return;
  }

  // Unexpected runtime / programmer error
  const unexpectedError =
    err instanceof Error
      ? err
      : new Error(typeof err === 'string' ? err : 'Unknown server exception');

  logger.error({ err: unexpectedError }, 'Unhandled unexpected exception caught by errorHandler');

  res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && {
      stack: unexpectedError.stack,
      detail: unexpectedError.message,
    }),
  });
};
