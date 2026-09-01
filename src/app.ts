import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { ApiError } from './errors/ApiError.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { healthRouter } from './routes/health.route.js';
import { rootRouter } from './routes/index.js';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type'],
    }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(requestLogger);

  app.use('/api/v1', rootRouter);

  app.use('/health', healthRouter);

  app.use((_req, _res, next) => {
    next(new ApiError('Resource not found', 404));
  });

  app.use(errorHandler);

  return app;
};
