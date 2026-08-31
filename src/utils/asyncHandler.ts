import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * asyncHandler — wraps async route handlers so rejected promises are
 * automatically forwarded to Express's centralized error middleware.
 *
 * Without this, unhandled rejections in async route handlers crash the process,
 * requiring repetitive try/catch in every handler.
 *
 * Usage:
 *   router.get('/resource', asyncHandler(async (req, res) => {
 *     const data = await someService.fetchData();
 *     res.json({ data });
 *   }));
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
