import { z } from 'zod';

const signUpSchema = z.object({
  name: z.string('Name is required'),
  email: z.email('Invalid email address'),
  password: z.string('Password is required').min(8, 'Password must be at least 8 characters long'),
  isTermsAccepted: z.literal(true, 'Terms and conditions must be accepted'),
});

const resendVerificationEmailSchema = z.object({
  email: z.email('Invalid email address'),
});

const signInEmailSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string('Password is required').min(8, 'Password must be at least 8 characters long'),
  rememberMe: z.boolean().default(true).optional(),
  callbackURL: z.url('Invalid callback URL').optional(),
});

const requestResetPasswordSchema = z.object({
  email: z.email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  newPassword: z
    .string('Password is required')
    .min(8, 'Password must be at least 8 characters long'),
});

type IRequestResetPassword = z.infer<typeof requestResetPasswordSchema>;

type IResetPassword = z.infer<typeof resetPasswordSchema>;

type ISignInEmail = z.infer<typeof signInEmailSchema>;

type ISignupSchema = z.infer<typeof signUpSchema>;

type IResendVerificationEmailSchema = z.infer<typeof resendVerificationEmailSchema>;

// Exporting schemas
export {
  signUpSchema,
  resendVerificationEmailSchema,
  signInEmailSchema,
  resetPasswordSchema,
  requestResetPasswordSchema,
};
//Exporting schema types
export {
  type ISignupSchema,
  type IResendVerificationEmailSchema,
  type ISignInEmail,
  type IResetPassword,
  type IRequestResetPassword,
};
