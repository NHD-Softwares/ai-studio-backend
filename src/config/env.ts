import { z } from 'zod';
import { config } from 'dotenv';
import { logger } from '../lib/logger.js';

// Load the correct .env file based on NODE_ENV
// Priority: .env.production | .env.test | .env.development (default)
const envFile =
  process.env['NODE_ENV'] === 'production'
    ? '.env.production'
    : process.env['NODE_ENV'] === 'test'
      ? '.env.test'
      : '.env.development';

config({ path: envFile });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CLIENT_ORIGIN: z.url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error('❌  Invalid or missing environment variables:\n');
  const errors = parsed.error.flatten().fieldErrors;
  Object.entries(errors).forEach(([field, messages]) => {
    logger.error(`  ${field}: ${messages?.join(', ')}`);
  });
  logger.error(`\nLoaded from: ${envFile}`);
  logger.error('Copy .env.example → .env.development and fill in the values.\n');
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
