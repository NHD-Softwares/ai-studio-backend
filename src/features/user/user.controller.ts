import { fromNodeHeaders } from 'better-auth/node';
import type { Request, Response } from 'express';

import { ApiError } from '../../errors/ApiError.js';
import { auth } from '../../lib/auth.js';
import { sendResponse } from '../../utils/response.js';

export const getMe = async (req: Request, res: Response) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
    query: { disableCookieCache: true },
  });

  if (!session) throw new ApiError('Not authenticated', 401);

  res.setHeader('Cache-Control', 'no-store');

  res.status(200).json({
    success: true,
    message: 'Session retrieved successfully',
    data: {
      user: session.user,
      session: session.session,
    },
  });

  sendResponse(res, 200, 'Session retrieved successfully', {
    data: {
      user: session.user,
      session: session.session,
    },
  });
};
