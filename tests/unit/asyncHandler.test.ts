import type { Request, Response, NextFunction } from 'express';
import { describe, it, expect, vi } from 'vitest';

import { ApiError } from '../../src/errors/ApiError.js';
import { asyncHandler } from '../../src/utils/asyncHandler.js';

describe('asyncHandler', () => {
  it('should successfully execute an async handler without error', async () => {
    const mockReq = {} as Request;
    const mockRes = { json: vi.fn() } as unknown as Response;
    const mockNext = vi.fn() as NextFunction;

    const fn = asyncHandler(async (_req, res) => {
      await Promise.resolve();
      res.json({ success: true });
    });

    fn(mockReq, mockRes, mockNext);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should catch errors in async handler and forward them to next()', async () => {
    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const mockNext = vi.fn() as NextFunction;
    const testError = new ApiError('Something broke', 400);

    const fn = asyncHandler(async () => {
      await Promise.resolve();
      throw testError;
    });

    fn(mockReq, mockRes, mockNext);

    // Give microtask promise resolution a tick
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(mockNext).toHaveBeenCalledWith(testError);
  });
});
