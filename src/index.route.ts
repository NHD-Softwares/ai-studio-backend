import { Router } from 'express';

import { authRouter } from './features/auth/auth.route.js';
import { healthRouter } from './features/health/health.route.js';
import { authenticate } from './middleware/authenticate.js';

const router = Router();

// unauthenticated routes
router.use('/', healthRouter);
router.use('/auth', authRouter);

// Authenticate Middleware
router.use(authenticate);

// Authenticated routes

export { router as rootRouter };
