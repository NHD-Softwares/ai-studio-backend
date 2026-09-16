import { fromNodeHeaders } from 'better-auth/node';

import { ApiError } from '../errors/ApiError.js';
import { auth } from '../lib/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Routes that do not require email verification
const allowNonVerifiedEmail: string[] = [];

const authenticate = asyncHandler(async (req, _res, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  const requestPath = req.originalUrl.split('?')[0] ?? '';
  const isEmailVerificationRequired = !allowNonVerifiedEmail.includes(requestPath);

  if (!session) throw new ApiError('Not authenticated', 401);

  if (!session.user.emailVerified && isEmailVerificationRequired)
    throw new ApiError('Email not verified', 403);

  req.user = session.user;
  req.authSession = session.session;

  next();
});

export { authenticate };
