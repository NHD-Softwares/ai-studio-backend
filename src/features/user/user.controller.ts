import { fromNodeHeaders } from 'better-auth/node';
import type { Request, Response } from 'express';

import { ApiError } from '../../errors/ApiError.js';
import { auth } from '../../lib/auth.js';
import { sendResponse } from '../../utils/response.js';

import { editUserSchema } from './user.schema.js';

export const getMe = async (req: Request, res: Response) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
    query: { disableCookieCache: true },
  });

  if (!session) throw new ApiError('Not authenticated', 401);

  res.setHeader('Cache-Control', 'no-store');

  sendResponse(res, 200, 'Session retrieved successfully', {
    user: session.user,
    session: session.session,
  });
};

export const editMe = async (req: Request, res: Response) => {
  const validatedBody = editUserSchema.parse(req.body);

  const data = await auth.api.updateUser({
    body: { name: validatedBody.name },
    headers: fromNodeHeaders(req.headers),
  });

  if (!data) throw new ApiError('Failed to update user', 500);

  sendResponse(res, 200, 'User updated successfully');
};
