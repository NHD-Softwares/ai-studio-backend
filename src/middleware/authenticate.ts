import { fromNodeHeaders } from 'better-auth/node';

import { ApiError } from '../errors/ApiError.js';
import { auth } from '../lib/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Routes that do not require email verification
const allowNonVerifiedEmail: string[] = ['/users/me'];

const authenticate = asyncHandler(async (req, _res, next) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  const cleanPath =
    req.path.length > 1 && req.path.endsWith('/') ? req.path.slice(0, -1) : req.path;

  const isEmailVerificationRequired = !allowNonVerifiedEmail.includes(cleanPath);

  if (!session) throw new ApiError('Not authenticated', 401);

  if (!session.user.emailVerified && isEmailVerificationRequired)
    throw new ApiError('Email not verified', 403);

  req.user = session.user;
  req.authSession = session.session;

  next();
});

export { authenticate };
