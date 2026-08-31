/**
 * ApiError — the only class in this codebase (justified: must extend Error).
 *
 * Application code throws this to signal known, operational errors:
 *   throw new ApiError('Resource not found', 404);
 *
 * The centralized error handler catches it and returns a consistent JSON shape.
 * Programmer bugs (unhandled rejections, null refs, etc.) fall through to the
 * generic 500 handler — never expose their messages in production.
 */
export class ApiError extends Error {
  public readonly statusCode: number;

  /**
   * isOperational = true  → expected error (bad input, not found, etc.)
   *                         → message is safe to expose to the client
   * isOperational = false → programmer bug — treat as 500, don't leak details
   */
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Fix prototype chain so `instanceof ApiError` works after TypeScript
    // compiles down to ES5 classes.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
