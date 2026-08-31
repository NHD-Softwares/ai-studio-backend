import type { Request, Response, NextFunction } from 'express';
import type { ZodError, ZodType } from 'zod';

import { ApiError } from '../errors/ApiError.js';

type ValidationTarget = 'body' | 'params' | 'query';

interface ValidateOptions {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

const formatZodError = (error: ZodError): string =>
  error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');

export const validate =
  (schemas: ValidateOptions) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const targets: ValidationTarget[] = ['body', 'params', 'query'];

    for (const target of targets) {
      const schema = schemas[target];
      if (!schema) continue;

      const result = schema.safeParse(req[target]);

      if (!result.success) {
        return next(new ApiError(`Invalid ${target}: ${formatZodError(result.error)}`, 422));
      }

      (req[target] as unknown) = result.data;
    }

    next();
  };
