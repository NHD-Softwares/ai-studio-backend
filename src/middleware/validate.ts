import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';

type ValidationTarget = 'body' | 'params' | 'query';

interface ValidateOptions {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export const validate =
  (schemas: ValidateOptions) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const targets: ValidationTarget[] = ['body', 'params', 'query'];

    for (const target of targets) {
      const schema = schemas[target];
      if (!schema) continue;

      const result = schema.safeParse(req[target]);

      if (!result.success) {
        return next(result.error);
      }

      (req[target] as unknown) = result.data;
    }

    next();
  };
