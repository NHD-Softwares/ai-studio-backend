import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Load the appropriate environment variables
const envFile =
  process.env['NODE_ENV'] === 'production'
    ? '.env.production'
    : process.env['NODE_ENV'] === 'test'
      ? '.env.test'
      : '.env.development';

config({ path: envFile });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // For Prisma migrations on Supabase, DIRECT_URL (direct port 5432) is preferred.
    // Falls back to DATABASE_URL if DIRECT_URL is not set.
    url: env('DIRECT_URL') || env('DATABASE_URL'),
  },
});
