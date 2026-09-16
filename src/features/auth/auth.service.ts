import { type IncomingHttpHeaders } from 'node:http';

import { ApiError } from '../../errors/ApiError.js';
import { auth } from '../../lib/auth.js';
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

  // temporary callback url until the front end is ready
  const response = await auth.api.sendVerificationEmail({
    body: { email, callbackURL: 'http://localhost:3000/email-verified' },
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
      redirectTo: 'http://localhost:3000/reset-password', // TODO: THis is temp till the frontend gets ready
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
  });

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
