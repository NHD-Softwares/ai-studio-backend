import { betterAuth, type SecondaryStorage } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { sendEmail, sendResetPasswordEmail, sendVerificationEmail } from './email.js';
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
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,

    onExistingUserSignUp: async ({ user }, _request) => {
      await sendEmail({
        to: user.email,
        subject: 'Sign-up attempt with your email',
        text: 'Someone tried to create an account using your email address. If this was you, try signing in instead. If not, you can safely ignore this email.',
      });
    },

    sendResetPassword: async ({ user, url }, _request) => {
      const resetUrl = new URL(url);
      resetUrl.searchParams.set('callbackURL', '/reset-password');
      await sendResetPasswordEmail({
        to: user.email,
        url: resetUrl.toString(),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,

    sendVerificationEmail: async ({ user, url }, _request) => {
      const verifyUrl = new URL(url);
      verifyUrl.searchParams.set('callbackURL', '/email-verified');
      await sendVerificationEmail({ to: user.email, url: verifyUrl.toString() });
    },
  },

  secondaryStorage: redisSecondaryStorage,

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
});
