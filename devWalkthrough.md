# Developer Walkthrough & Architectural Guide

Welcome to the **AI Studio Backend** boilerplate! This guide details the system architecture, code conventions, step-by-step feature development recipes, environment management, and deployment workflows.

---

## Table of Contents

1. [Architecture & Request Lifecycle](#1-architecture--request-lifecycle)
2. [Project Directory Layout](#2-project-directory-layout)
3. [Step-by-Step Recipe: Adding a New Feature](#3-step-by-step-recipe-adding-a-new-feature)
4. [Environment & Configuration Handling](#4-environment--configuration-handling)
5. [Error Handling & Logging Strategy](#5-error-handling--logging-strategy)
6. [Data Layer (Prisma & Supabase)](#6-data-layer-prisma--supabase)
7. [Caching Layer (Upstash Redis)](#7-caching-layer-upstash-redis)
8. [Testing Strategy (Vitest & Supertest)](#8-testing-strategy-vitest--supertest)
9. [Git & Branching Workflow](#9-git--branching-workflow)
10. [Reusing This Boilerplate for a New Project](#10-reusing-this-boilerplate-for-a-new-project)

---

## 1. Architecture & Request Lifecycle

This boilerplate strictly follows a **layered, functional architecture**. Code is structured into distinct single-responsibility layers without heavy OOP classes.

### Request Flow Diagram

```
[ Incoming HTTP Request ]
          │
          ▼
┌────────────────────────────────────────────────┐
│  pino-http Request Logger                      │  ──> Logs method, path, timing, redacts secrets
└────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────┐
│  Express JSON / URL Body Parsers               │
└────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────┐
│  Root Router (`src/routes/index.ts`)           │  ──> Dispatches to feature routers
└────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────┐
│  Controller (`src/controllers/*.ts`)           │  ──> Wrapped in `asyncHandler`, parses req params/body
└────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────┐
│  Service Layer (`src/services/*.ts`)           │  ──> Pure business logic, throws `ApiError`
└────────────────────────────────────────────────┘
    │                          │
    ▼                          ▼
┌─────────────────┐    ┌─────────────────┐
│  Prisma Client  │    │  Upstash Redis  │
│  (Supabase DB)  │    │  (Cache-Aside)  │
└─────────────────┘    └─────────────────┘
          │
          ├──> [ Success ] ──> Controller returns `res.status(200).json({ ... })`
          │
          └──> [ Exception ] ──> `throw new ApiError(msg, code)` OR unexpected Error
                                         │
                                         ▼
┌────────────────────────────────────────────────┐
│  Centralized Error Handler                     │  ──> Formats `{ status, statusCode, message }`
│  (`src/middleware/errorHandler.ts`)            │  ──> Suppresses stack trace in production
└────────────────────────────────────────────────┘
                                         │
                                         ▼
                              [ Outgoing HTTP Response ]
```

---

## 2. Project Directory Layout

```
ai-studio-backend/
├── .github/workflows/         # CI/CD Workflows
│   ├── ci.yml                 # PRs into dev: lint, typecheck, build, test
│   └── release.yml            # PRs into master: release gate + coverage
├── .husky/                    # Git pre-commit hooks
│   └── pre-commit             # Runs typecheck + lint-staged (format, lint, vitest related)
├── prisma/
│   ├── schema.prisma          # Prisma schema configured for Supabase
│   └── seed.ts                # Database seed script
├── src/
│   ├── config/
│   │   └── env.ts             # Zod-validated environment config (Single source of truth)
│   ├── controllers/           # HTTP controllers (req/res handling, input parsing)
│   │   └── health.controller.ts
│   ├── errors/
│   │   └── ApiError.ts        # Operational error class (statusCode, isOperational)
│   ├── lib/                   # Infrastructure clients & utilities
│   │   ├── logger.ts          # Pino logger instance
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── redis.ts           # Upstash Redis client & cache-aside utility
│   ├── middleware/            # Express middlewares
│   │   ├── errorHandler.ts    # Centralized error handler
│   │   └── requestLogger.ts   # HTTP request logging with pino-http
│   ├── routes/                # Route definitions & router aggregations
│   │   ├── health.route.ts
│   │   └── index.ts
│   ├── services/              # Pure business logic functions
│   ├── utils/                 # General helpers
│   │   └── asyncHandler.ts    # Async promise forwarding utility
│   ├── app.ts                 # Express app factory (testable, separated from listener)
│   └── index.ts               # Server entry point (binds port, handles graceful shutdown)
├── tests/
│   ├── integration/           # Supertest API route integration tests
│   │   └── health.test.ts
│   ├── unit/                  # Isolated unit tests
│   │   └── asyncHandler.test.ts
│   └── setup.ts               # Global Vitest setup (loads .env.test)
├── .dockerignore
├── .env.example               # Committed template documenting all env variables
├── .env.development           # Local dev secrets (git-ignored)
├── .env.test                  # Test environment config (git-ignored)
├── .gitignore
├── .nvmrc                     # Pinned to Node 24
├── .prettierignore
├── .prettierrc
├── docker-compose.yml         # Local Postgres & Redis containers (dev convenience)
├── Dockerfile                 # Production multi-stage Docker build
├── eslint.config.js           # ESLint flat config with TypeScript & Prettier integration
├── package.json
├── pnpm-lock.yaml
├── README.md
├── tsconfig.json              # Strict NodeNext ESM TypeScript configuration
└── vitest.config.ts           # Vitest configuration with v8 coverage
```

---

## 3. Step-by-Step Recipe: Adding a New Feature

Let's walk through building a new **Articles** resource end-to-end.

### Step 1: Update Database Schema & Migrate

Open `prisma/schema.prisma` and add your model:

```prisma
model Article {
  id        String   @id @default(cuid())
  slug      String   @unique
  title     String
  content   String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("articles")
}
```

Run migration and generate types:

```bash
pnpm db:migrate:dev --name create_articles_table
pnpm db:generate
```

---

### Step 2: Implement the Service Layer

Create `src/services/article.service.ts`.

- Keep it functional (export standalone `const` arrow functions).
- Use `prisma` from `src/lib/prisma.js`.
- Use `cacheGet` from `src/lib/redis.js` when caching is beneficial.
- Throw `ApiError` when business conditions fail.

```typescript
import { prisma } from '../lib/prisma.js';
import { cacheGet } from '../lib/redis.js';
import { ApiError } from '../errors/ApiError.js';
import type { Article } from '@prisma/client';

export const getArticleBySlug = async (slug: string): Promise<Article> => {
  return cacheGet(
    `article:${slug}`,
    async () => {
      const article = await prisma.article.findUnique({
        where: { slug },
      });

      if (!article) {
        throw new ApiError(`Article with slug '${slug}' not found`, 404);
      }

      return article;
    },
    300,
  ); // 5 min cache
};

export const createArticle = async (data: {
  title: string;
  slug: string;
  content: string;
}): Promise<Article> => {
  const existing = await prisma.article.findUnique({
    where: { slug: data.slug },
  });

  if (existing) {
    throw new ApiError(`An article with slug '${data.slug}' already exists`, 409);
  }

  return prisma.article.create({ data });
};
```

---

### Step 3: Implement the Controller Layer

Create `src/controllers/article.controller.ts`.

- Controllers parse and validate HTTP parameters, call services, and respond with JSON.
- Never write `try/catch` in controllers — route wrapping with `asyncHandler` forwards errors automatically.

```typescript
import type { Request, Response } from 'express';
import * as articleService from '../services/article.service.js';

export const getArticle = async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  const article = await articleService.getArticleBySlug(slug as string);
  res.status(200).json({ status: 'success', data: article });
};

export const createArticle = async (req: Request, res: Response): Promise<void> => {
  const { title, slug, content } = req.body;
  const article = await articleService.createArticle({ title, slug, content });
  res.status(201).json({ status: 'success', data: article });
};
```

---

### Step 4: Define the Route & Register It

Create `src/routes/article.route.ts`:

```typescript
import { Router } from 'express';
import { getArticle, createArticle } from '../controllers/article.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/:slug', asyncHandler(getArticle));
router.post('/', asyncHandler(createArticle));

export { router as articleRouter };
```

Mount it in `src/routes/index.ts`:

```typescript
import { Router } from 'express';
import { healthRouter } from './health.route.js';
import { articleRouter } from './article.route.js';

const router = Router();

router.use('/', healthRouter);
router.use('/articles', articleRouter);

export { router as rootRouter };
```

---

### Step 5: Write Integration & Unit Tests

Create `tests/integration/article.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Articles API', () => {
  const app = createApp();

  it('should return 404 for unknown article slug', async () => {
    const res = await request(app).get('/articles/non-existent-article');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('not found');
  });
});
```

Run tests:

```bash
pnpm test
```

---

## 4. Environment & Configuration Handling

All environment variables are validated by Zod at application startup in `src/config/env.ts`.

### How It Works

1. `src/config/env.ts` determines which file to load:
   - `NODE_ENV === 'production'` → loads `.env.production`
   - `NODE_ENV === 'test'` → loads `.env.test`
   - default / dev → loads `.env.development`
2. Zod validates the types and constraints (e.g., valid URLs, integers).
3. If validation fails, the app prints a formatted list of missing/invalid variables and halts immediately (`process.exit(1)`).
4. Application code imports `env` from `src/config/env.js`. **Direct access to `process.env` is prohibited across the codebase.**

### Adding a New Environment Variable

1. Add the variable to `envSchema` in `src/config/env.ts`:
   ```typescript
   STRIPE_SECRET_KEY: z.string().min(1),
   ```
2. Add the mock entry to `.env.example` with descriptive comments:
   ```env
   # Stripe Billing
   STRIPE_SECRET_KEY=sk_test_mock_value
   ```
3. Add the value to your `.env.development` and `.env.test`.

---

## 5. Error Handling & Logging Strategy

### Throwing Errors

Use `ApiError` for all operational errors:

```typescript
import { ApiError } from '../errors/ApiError.js';

throw new ApiError('Unauthorized action', 403);
throw new ApiError('Invalid email format', 422);
```

### Centralized Error Response Format

All errors return a predictable JSON payload:

```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Article with slug 'my-post' not found"
}
```

In development (`NODE_ENV=development`), the 500 error handler includes `stack` and `detail`. In production, internal error details and stack traces are suppressed.

### Logging Best Practices

Import `logger` from `src/lib/logger.js`:

```typescript
import { logger } from '../lib/logger.js';

// Pass an object with contextual metadata as the first argument, message as second:
logger.info({ userId: user.id, action: 'order_placed' }, 'Order processed successfully');
logger.warn({ ip: req.ip }, 'Rate limit threshold approaching');
logger.error({ err, orderId }, 'Failed to process payment');
```

---

## 6. Data Layer (Prisma & Supabase)

Supabase PostgreSQL utilizes PgBouncer connection pooling on port `6543`. Because PgBouncer transaction mode does not support DDL statements (like `CREATE TABLE`), Prisma requires two URLs:

- `DATABASE_URL`: Transaction pooler URL (port `6543`) used for high-concurrency runtime queries.
- `DIRECT_URL`: Direct PostgreSQL connection (port `5432`) used exclusively by Prisma migrations.

Configured in `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Common Commands

- `pnpm db:generate` — Generate typed Prisma Client.
- `pnpm db:migrate:dev` — Create and apply local migration.
- `pnpm db:migrate:deploy` — Apply pending migrations in production / CI.
- `pnpm db:seed` — Run database seed script.
- `pnpm db:studio` — Open interactive GUI to view and edit database records.

---

## 7. Caching Layer (Upstash Redis)

We use `@upstash/redis`, a lightweight, serverless-friendly REST Redis client. It does not require continuous TCP socket connections, preventing connection exhaustion.

### Cache-Aside Pattern

Use `cacheGet` from `src/lib/redis.js`:

```typescript
import { cacheGet } from '../lib/redis.js';

const userProfile = await cacheGet(
  `user:${id}:profile`,
  async () => {
    return prisma.user.findUnique({ where: { id } });
  },
  120,
); // Cached for 120 seconds
```

If Redis is temporarily unavailable, `cacheGet` logs a warning and automatically falls back to invoking the database fetcher directly, preventing application outages.

---

## 8. Testing Strategy (Vitest & Supertest)

### Structure

- **Unit Tests** (`tests/unit/`): Pure functions, calculations, middleware logic.
- **Integration Tests** (`tests/integration/`): Supertest requests against `createApp()`.

### Running Tests

- `pnpm test` — Runs the full test suite once.
- `pnpm test:watch` — Interactive test watcher for active development.
- `pnpm test:coverage` — Generates a code coverage report in `coverage/`.

---

## 9. Git & Branching Workflow

### Branch Strategy

```
feature/my-feature ──> [ PR to dev ] ──> CI (Typecheck, Lint, Test) ──> Merged to dev
                                                                             │
                                                                       [ QA / Staging ]
                                                                             │
                                                                             ▼
                                   [ PR dev -> master ] ──> Release Gate CI ──> Merged to master (Production)
```

### Pre-commit Hooks (Husky + lint-staged)

When you run `git commit`, Husky automatically:

1. Executes `pnpm typecheck` across the whole project (preventing broken types from entering git).
2. Executes `lint-staged`:
   - Runs `eslint --fix` on staged TypeScript files.
   - Runs `prettier --write` on staged files.
   - Runs `vitest related --run` to execute only the tests related to your staged changes.

### Recommended GitHub Branch Protections

- **`dev` branch**: Require pull request reviews, require status check `verify` from `ci.yml`.
- **`master` branch**: Require pull request reviews, require status check `release-verification` from `release.yml`, restrict direct pushes.

---

## 10. Reusing This Boilerplate for a New Project

To spin up a new repository from this starter template in under 3 minutes:

1. **Clone or copy the directory**:
   ```bash
   git clone <this-repo-url> my-new-service
   cd my-new-service
   rm -rf .git
   git init
   ```
2. **Update `package.json`**:
   Change `"name": "my-new-service"` and `"description"`.
3. **Configure environment**:
   ```bash
   cp .env.example .env.development
   ```
   Fill in your actual Supabase DB and Upstash Redis credentials in `.env.development`.
4. **Install & Initialize**:
   ```bash
   pnpm install
   pnpm db:generate
   pnpm dev
   ```
5. **Add your business models** in `prisma/schema.prisma` and follow the recipe in [Section 3](#3-step-by-step-recipe-adding-a-new-feature)!
