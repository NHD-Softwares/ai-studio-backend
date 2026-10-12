import { betterAuth, type SecondaryStorage } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { env } from '../config/env.js';

import { runInBackground, sendResetPasswordEmail, sendVerificationEmail } from './email.js';
import { prisma } from './prisma.js';
import { redis } from './redis.js';

const redisSecondaryStorage: SecondaryStorage = {
  get(key) {
    return redis.get(key);
  },
  getAndDelete(key) {
    return redis.getdel(key);
  },
  async increment(key, ttl) {
    if (!Number.isInteger(ttl) || ttl <= 0) {
      throw new TypeError('Redis increment TTL must be a positive integer');
    }
    const [value] = await redis.multi().incr(key).expire(key, ttl, 'NX').exec();
    return value;
  },
  async set(key, value, ttl) {
    if (ttl) {
      await redis.set(key, value, { ex: ttl });
    } else {
      await redis.set(key, value);
    }
  },
  async delete(key) {
    await redis.del(key);
  },
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.CLIENT_ORIGIN],
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,

    sendResetPassword: ({ user, url }) => {
      const resetUrl = new URL(url);
      resetUrl.searchParams.set('callbackURL', `${env.CLIENT_ORIGIN}/reset-password`);
      return runInBackground(
        sendResetPasswordEmail({ to: user.email, url: resetUrl.toString() }),
        'Reset password email',
      );
    },
  },

  emailVerification: {
    autoSignInAfterVerification: true,

    sendVerificationEmail: ({ user, url }) => {
      const verifyUrl = new URL(url);
      verifyUrl.searchParams.set('callbackURL', `${env.CLIENT_ORIGIN}/email-verified`);
      return runInBackground(
        sendVerificationEmail({ to: user.email, url: verifyUrl.toString() }),
        'Verification email',
      );
    },
  },

  secondaryStorage: redisSecondaryStorage,

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },
});
