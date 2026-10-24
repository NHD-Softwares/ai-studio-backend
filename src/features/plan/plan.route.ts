import { Router } from 'express';

import { asyncHandler } from '../../utils/asyncHandler.js';

import { getCreditPackages, getSubscriptionPlans } from './plan.controller.js';

const planRouter = Router();

planRouter.get('/credits', asyncHandler(getCreditPackages));

planRouter.get('/subscriptions', asyncHandler(getSubscriptionPlans));

export { planRouter };
