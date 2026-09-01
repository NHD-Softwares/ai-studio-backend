import { Router, type Router as IRouter } from 'express';

import { getHealth } from '../controllers/health.controller.js';

const router: IRouter = Router();

router.get('/health', getHealth);

export { router as healthRouter };
