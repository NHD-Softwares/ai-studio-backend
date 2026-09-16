import { Router } from 'express';

import { asyncHandler } from '../../utils/asyncHandler.js';

import {
  resendVerificationEmail,
  signUpEmail,
  signInEmail,
  resetPassword,
  signOut,
  requestResetPassword,
} from './auth.controller.js';

const authRouter = Router();

authRouter.post('/sign-up/email', asyncHandler(signUpEmail));
authRouter.post('/sign-in/email', asyncHandler(signInEmail));
authRouter.post('/sign-out', asyncHandler(signOut));
authRouter.post('/resend-verification', asyncHandler(resendVerificationEmail));
authRouter.post('/request-reset-password', asyncHandler(requestResetPassword));
authRouter.post('/reset-password', asyncHandler(resetPassword));

export { authRouter };
