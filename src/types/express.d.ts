import type { auth } from '../lib/auth.js';

type AuthSession = typeof auth.$Infer.Session;

declare global {
  namespace Express {
    interface Request {
      user: AuthSession['user'];
      authSession: AuthSession['session'];
    }
  }
}
