import { Router } from 'express';

import { authRouter } from './features/auth/auth.route.js';
import { healthRouter } from './features/health/health.route.js';
import { planRouter } from './features/plan/plan.route.js';
import { userRouter } from './features/user/user.route.js';
import { authenticate } from './middleware/authenticate.js';

const router = Router();

// unauthenticated routes
router.use('/', healthRouter);
router.use('/auth', authRouter);
router.use('/plan', planRouter);

// Authenticate Middleware
router.use(authenticate);
router.use('/users', userRouter);

// Authenticated routes

export { router as rootRouter };
