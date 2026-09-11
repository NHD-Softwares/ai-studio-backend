import { Router } from 'express';

import { healthRouter } from './src/features/health/health.route.js';

const router = Router();

// Root route aggregator
router.use('/', healthRouter);

export { router as rootRouter };
