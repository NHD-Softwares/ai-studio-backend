import { Router } from 'express';

import { asyncHandler } from '../../utils/asyncHandler.js';

import { editMe, getMe } from './user.controller.js';

const router = Router();

router.get('/me', asyncHandler(getMe));
router.patch('/me', asyncHandler(editMe));

export { router as userRouter };
