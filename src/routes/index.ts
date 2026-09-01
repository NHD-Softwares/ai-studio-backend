import { Router, type Router as IRouter } from 'express';

import { healthRouter } from './health.route.js';

const router: IRouter = Router();

// Root route aggregator
router.use('/', healthRouter);

export { router as rootRouter };
