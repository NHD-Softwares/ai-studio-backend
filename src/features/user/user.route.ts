import { Router } from 'express';

import { asyncHandler } from '../../utils/asyncHandler.js';

import { getMe } from './user.controller.js';

const router = Router();

router.get('/me', asyncHandler(getMe));

export { router as userRouter };
