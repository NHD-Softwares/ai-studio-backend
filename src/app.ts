import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { ApiError } from './errors/ApiError.js';
import { healthRouter } from './features/health/health.route.js';
import { rootRouter } from './index.route.js';
import { auth } from './lib/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: [env.CLIENT_ORIGIN, 'http://localhost:3000', 'https://ai-studio-ruddy.vercel.app'], // Temp till fix env on railway
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type'],
    }),
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(requestLogger);

  app.use('/api/v1', rootRouter);

  // TODO: That's temporary until we get the frontend ready
  app.get('/email-verified', (_req, res) => res.status(200).send('Email verified successfully'));

  app.all('/api/auth/*splat', toNodeHandler(auth));
  app.use('/health', healthRouter);

  app.use((_req, _res, next) => {
    next(new ApiError('Resource not found', 404));
  });

  app.use(errorHandler);

  return app;
};
