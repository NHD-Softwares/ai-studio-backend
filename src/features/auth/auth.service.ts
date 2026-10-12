import { type IncomingHttpHeaders } from 'node:http';

import { env } from '../../config/env.js';
import { ApiError } from '../../errors/ApiError.js';
import { auth } from '../../lib/auth.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';

import { type ISignInEmail, type ISignupSchema } from './auth.schema.js';

const signUpEmailService = async (credentials: ISignupSchema) => {
  const { email, password, name, isTermsAccepted } = credentials;

  if (!isTermsAccepted) throw new ApiError('Terms and conditions must be accepted', 422);

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (user) throw new ApiError('User already exists', 422);

  const response = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
    asResponse: true,
  });

  if (!response.ok) throw new ApiError(response.statusText, response.status);

  void auth.api
    .sendVerificationEmail({
      body: { email, callbackURL: `${env.CLIENT_ORIGIN}/email-verified` },
    })
    .catch(() => logger.error('Failed to send verification email'));

  return response;
};

const resendVerificationEmailService = async (email: string) => {
  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  // if the user is not found
  if (!user) throw new ApiError('User not found', 404);

  if (user.emailVerified) throw new ApiError('User is already verified', 422);

  const response = await auth.api.sendVerificationEmail({
    body: { email, callbackURL: `${env.CLIENT_ORIGIN}/email-verified` },
  });

  if (!response.status) throw new ApiError('Failed to send verification email', 500);

  return response;
};

const signInEmailService = async (credentials: ISignInEmail, headers: IncomingHttpHeaders) => {
  const response = await auth.api.signInEmail({
    body: {
      email: credentials.email,
      password: credentials.password,
    },
    asResponse: true,
    headers: new Headers(headers as HeadersInit),
  });

  if (!response.ok && response.status === 401) throw new ApiError('Invalid email or password', 401);

  if (!response.ok) throw new ApiError(response.statusText, response.status);

  return response;
};

const signOutService = async (headers: IncomingHttpHeaders) => {
  await auth.api.signOut({
    headers: new Headers(headers as HeadersInit),
  });
};

const requestResetPasswordService = async (email: string) => {
  const response = await auth.api.requestPasswordReset({
    body: {
      email,
    },
  });

  if (!response.status) throw new ApiError('Failed to send reset password email', 500);
};

const resetPasswordService = async (newPassword: string, token: string) => {
  if (!token) throw new ApiError('Token is required', 400);

  const response = await auth.api.resetPassword({
    body: {
      newPassword,
      token,
    },
    asResponse: true,
  });

  if (!response.ok) throw new ApiError(`Invalid or expired token`, 400);

  return response;
};

export {
  signUpEmailService,
  signInEmailService,
  signOutService,
  resetPasswordService,
  requestResetPasswordService,
  resendVerificationEmailService,
};
