import { type Request, type Response } from 'express';

import { sendResponse } from '../../utils/response.js';

import {
  requestResetPasswordSchema,
  resendVerificationEmailSchema,
  resetPasswordSchema,
  signInEmailSchema,
  signUpSchema,
} from './auth.schema.js';
import {
  requestResetPasswordService,
  resendVerificationEmailService,
  resetPasswordService,
  signInEmailService,
  signOutService,
  signUpEmailService,
} from './auth.service.js';

// TODO MAX PRIORITY: Make the authenticate middleware, and make sure users can't do anything if not verified, make them stuck in the /verify.
// TODO 1: Test all the current endpoint
// TODO 2: Implement google and facebook auth
// TODO 3: Implement change password endpoint

const signUpEmail = async (req: Request, res: Response) => {
  const validatedBody = signUpSchema.parse(req.body);

  const authRes = await signUpEmailService(validatedBody);
  const data = (await authRes.json()) as object;

  const setCookie = authRes.headers.get('set-cookie');

  if (setCookie) {
    res.setHeader('Set-Cookie', setCookie);
  }

  sendResponse(res, 200, 'User signed up successfully', data);
};

const resendVerificationEmail = async (req: Request, res: Response) => {
  const validatedBody = resendVerificationEmailSchema.parse(req.body);

  void (await resendVerificationEmailService(validatedBody.email));

  sendResponse(res, 200, 'Verification email sent successfully');
};

const signInEmail = async (req: Request, res: Response) => {
  const validatedBody = signInEmailSchema.parse(req.body);

  const authRes = await signInEmailService(validatedBody, req.headers);
  const data = (await authRes.json()) as object;

  const setCookie = authRes.headers.get('set-cookie');

  if (setCookie) {
    res.setHeader('Set-Cookie', setCookie);
  }

  sendResponse(res, 200, 'User signed in successfully', data);
};

const signOut = async (req: Request, res: Response) => {
  void (await signOutService(req.headers));

  sendResponse(res, 200, 'User signed out successfully');
};

const requestResetPassword = async (req: Request, res: Response) => {
  const validatedBody = requestResetPasswordSchema.parse(req.body);

  void (await requestResetPasswordService(validatedBody.email));

  sendResponse(res, 200, 'Reset password email sent successfully');
};

const resetPassword = async (req: Request, res: Response) => {
  const token = req.query.token as string;
  const validatedBody = resetPasswordSchema.parse(req.body);

  void (await resetPasswordService(validatedBody.newPassword, token));

  sendResponse(res, 200, 'Password reset successfully');
};

export {
  signUpEmail,
  signInEmail,
  signOut,
  resetPassword,
  resendVerificationEmail,
  requestResetPassword,
};
