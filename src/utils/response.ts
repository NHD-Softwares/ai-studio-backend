import type { Response } from 'express';

const sendResponse = (res: Response, statusCode: number, message?: string, data?: object) => {
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    ...(message && { message }),
    ...(data && { data }),
  });
};

export { sendResponse };
