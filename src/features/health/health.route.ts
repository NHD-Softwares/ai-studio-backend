import { Router, type Router as IRouter } from 'express';

import { getHealth } from './health.controller.js';

const healthRouter: IRouter = Router();

healthRouter.get('/health', getHealth);

export { healthRouter };
