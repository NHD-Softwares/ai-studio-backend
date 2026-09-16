# Developer Walkthrough & Architectural Guide

This guide covers the system architecture, code conventions, a step-by-step recipe for adding a new feature, environment handling, and the current CI/deployment setup — as the repo actually stands today, not an aspirational version of it.

---

## Table of Contents

1. [Architecture & Request Lifecycle](#1-architecture--request-lifecycle)
2. [Project Directory Layout](#2-project-directory-layout)
3. [Step-by-Step Recipe: Adding a New Feature](#3-step-by-step-recipe-adding-a-new-feature)
4. [Environment & Configuration Handling](#4-environment--configuration-handling)
5. [Error Handling & Logging Strategy](#5-error-handling--logging-strategy)
6. [Data Layer (Prisma & Supabase)](#6-data-layer-prisma--supabase)
7. [Caching Layer (Upstash Redis)](#7-caching-layer-upstash-redis)
8. [Testing — Current Status](#8-testing--current-status)
9. [Git, CI & Deployment Workflow](#9-git-ci--deployment-workflow)
10. [Known Quirks / Not-Yet-Cleaned-Up Items](#10-known-quirks--not-yet-cleaned-up-items)
11. [Reusing This Boilerplate for a New Project](#11-reusing-this-boilerplate-for-a-new-project)

---

## 1. Architecture & Request Lifecycle

Layered, functional architecture. Code is split into single-responsibility layers, minimal OOP (the one deliberate exception is `ApiError`, which has to extend `Error`).

```
[ Incoming HTTP Request ]
          │
          ▼
┌────────────────────────────────────────────────┐
│  helmet + cors                                  │
└────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────┐
│  express.json / urlencoded body parsers         │  ──> 10kb limit
└────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────┐
│  pino-http Request Logger (requestLogger)       │  ──> logs method, path, status, timing
└────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────┐
│  Root Router — mounted at /api/v1               │  ──> src/routes/index.ts → dispatches to feature routers
└────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────┐
│  Controller (src/controllers/*.ts)              │  ──> wrapped in asyncHandler, parses req params/body
└────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────┐
│  Service Layer (src/services/*.ts)              │  ──> convention only — folder doesn't exist yet,
│                                                  │      no feature has needed it so far
└────────────────────────────────────────────────┘
    │                          │
    ▼                          ▼
┌─────────────────┐    ┌─────────────────┐
│  Prisma Client   │    │  Upstash Redis  │
│  (Supabase DB)   │    │  (cache-aside)  │
└─────────────────┘    └─────────────────┘
          │
          ├──> [ Success ] ──> Controller returns res.status(...).json({ ... })
          │
          └──> [ Exception ] ──> throw new ApiError(msg, code) OR unexpected Error
                                         │
                                         ▼
┌────────────────────────────────────────────────┐
│  Centralized Error Handler                      │  ──> formats { status, statusCode, message }
│  (src/middleware/errorHandler.ts)               │  ──> stack/detail only attached in development
└────────────────────────────────────────────────┘
                                         │
                                         ▼
                              [ Outgoing HTTP Response ]
```

If no route matches, `app.ts` forwards a 404 `ApiError('Resource not found', 404)` into the same centralized handler — so 404s and thrown errors return an identically shaped payload.

---

## 2. Project Directory Layout

This is the actual current layout — not every folder mentioned in older docs exists yet.

```
ai-studio-backend/
├── .github/
│   ├── actions/core-setup/    # Composite action: node setup, npm install, prisma generate
│   └── workflows/ci.yml       # Single workflow: typecheck, lint, format:check, build
├── .husky/
│   └── pre-commit             # npm run typecheck && npm exec lint-staged
├── prisma/
│   └── schema.prisma          # Datasource + one example model (Post)
├── src/
│   ├── config/
│   │   └── env.ts             # Zod-validated environment config (single source of truth)
│   ├── controllers/
│   │   └── health.controller.ts
│   ├── errors/
│   │   └── ApiError.ts        # Operational error class (statusCode, isOperational)
│   ├── lib/
│   │   ├── logger.ts          # Pino logger instance (redacts auth headers, password/token fields)
│   │   ├── prisma.ts          # Prisma client singleton, using @prisma/adapter-pg over a pg Pool
│   │   └── redis.ts           # Upstash Redis client
│   ├── middleware/
│   │   ├── errorHandler.ts    # Centralized error handler
│   │   ├── requestLogger.ts   # pino-http request logging
│   │   └── validate.ts        # Zod-based body/params/query validation middleware
│   ├── routes/
│   │   ├── health.route.ts
│   │   └── index.ts           # Root router, mounted at /api/v1 in app.ts
│   ├── utils/
│   │   └── asyncHandler.ts    # Wraps async handlers, forwards rejections to next()
│   ├── app.ts                 # Express app factory (testable, no listener)
│   └── index.ts                # Entry point — binds port, graceful shutdown on SIGTERM/SIGINT
├── tests/
│   ├── integration/health.test.ts   # Supertest against createApp()
│   ├── unit/asyncHandler.test.ts
│   └── setup.ts                # Loads .env.test — not wired into CI or pre-commit currently
├── .env.example                # Committed template — real .env.* files are all git-ignored
├── .nvmrc                      # Pinned to Node 24
├── eslint.config.js
├── package.json / package-lock.json   # npm, not pnpm
├── prisma.config.ts             # Prisma CLI config — uses DIRECT_URL, falls back to DATABASE_URL
├── tsconfig.json / tsconfig.build.json
└── vitest.config.ts
```

There is **no** `Dockerfile`, `docker-compose.yml`, or `.dockerignore` in this repo, and no `src/services/` folder yet — both were deliberately dropped/deferred rather than removed after being built.

---

## 3. Step-by-Step Recipe: Adding a New Feature

Walking through adding a **Posts** resource — matching the example model already in `prisma/schema.prisma`.

### Step 1: Confirm/Extend the Schema

The `Post` model already exists in `prisma/schema.prisma`:

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}
```

After any schema change:

```bash
npm run db:migrate:dev -- --name your_change_name
npm run db:generate
```

(The generated client output lives at `generated/prisma`, not the default `node_modules/@prisma/client` — this path is git-ignored and regenerated on install/build.)

### Step 2: Validation Schemas (optional but recommended)

Use the existing `validate` middleware rather than hand-rolling checks in the controller:

```typescript
// src/schemas/post.schema.ts
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
});
```

### Step 3: Service Layer

`src/services/` doesn't exist yet — create it when you add your first real feature.

```typescript
// src/services/post.service.ts
import { prisma } from '../lib/prisma.js';
import { cacheGet } from '../lib/redis.js';
import { ApiError } from '../errors/ApiError.js';
import type { Post } from '../../generated/prisma/index.js';

export const getPostById = async (id: string): Promise<Post> => {
  return cacheGet(
    `post:${id}`,
    async () => {
      const post = await prisma.post.findUnique({ where: { id } });
      if (!post) throw new ApiError(`Post '${id}' not found`, 404);
      return post;
    },
    300,
  );
};

export const createPost = async (data: { title: string; content?: string }): Promise<Post> => {
  return prisma.post.create({ data });
};
```

### Step 4: Controller Layer

Never `try/catch` in controllers — `asyncHandler` forwards rejections automatically.

```typescript
// src/controllers/post.controller.ts
import type { Request, Response } from 'express';
import * as postService from '../services/post.service.js';

export const getPost = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const post = await postService.getPostById(id as string);
  res.status(200).json({ status: 'success', data: post });
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
  const post = await postService.createPost(req.body);
  res.status(201).json({ status: 'success', data: post });
};
```

### Step 5: Route, With Validation Wired In

```typescript
// src/routes/post.route.ts
import { Router } from 'express';
import { getPost, createPost } from '../controllers/post.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { createPostSchema } from '../schemas/post.schema.js';

const router = Router();

router.get('/:id', asyncHandler(getPost));
router.post('/', validate({ body: createPostSchema }), asyncHandler(createPost));

export { router as postRouter };
```

Register it in `src/routes/index.ts`:

```typescript
import { Router, type Router as IRouter } from 'express';
import { healthRouter } from './health.route.js';
import { postRouter } from './post.route.js';

const router: IRouter = Router();

router.use('/', healthRouter);
router.use('/posts', postRouter);

export { router as rootRouter };
```

This resolves to `/api/v1/posts/...` since `rootRouter` is mounted at `/api/v1` in `app.ts`.

### Step 6: Tests (if/when you pick testing back up)

```typescript
// tests/integration/post.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('Posts API', () => {
  const app = createApp();

  it('should return 404 for an unknown post id', async () => {
    const res = await request(app).get('/api/v1/posts/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
```

```bash
npm test
```

Remember: this isn't run in CI or the pre-commit hook right now, so it's on you to run it locally before merging.

---

## 4. Environment & Configuration Handling

All env vars are validated by Zod at startup in `src/config/env.ts`.

1. File loaded is based on `NODE_ENV`: `production` → `.env.production`, `test` → `.env.test`, else → `.env.development`.
2. Zod validates types/constraints (URLs, positive ints, enums).
3. On failure, the app logs which fields are missing/invalid and exits (`process.exit(1)`) — it never boots half-configured.
4. Everywhere else in the codebase, import `env` from `src/config/env.js`. Direct `process.env` access is avoided outside of `env.ts` and the two files that need it before `env.ts` runs (`logger.ts`'s default level, `env.ts`'s own `NODE_ENV` check).

### Adding a New Environment Variable

1. Add it to `envSchema` in `src/config/env.ts`.
2. Add a mock entry with a comment to `.env.example`.
3. Add the real value to your local `.env.development` / `.env.test`.

---

## 5. Error Handling & Logging Strategy

### Throwing Errors

```typescript
import { ApiError } from '../errors/ApiError.js';

throw new ApiError('Unauthorized action', 403);
throw new ApiError('Invalid email format', 422);
```

### Response Shape

```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Post 'abc123' not found"
}
```

5xx errors are logged at `error` level; 4xx `ApiError`s are logged as `warn`. In development, unexpected (non-`ApiError`) 500s also include `stack` and `detail` in the response — suppressed in production.

### Logging

```typescript
import { logger } from '../lib/logger.js';

logger.info({ userId: user.id, action: 'order_placed' }, 'Order processed successfully');
logger.warn({ ip: req.ip }, 'Rate limit threshold approaching');
logger.error({ err, orderId }, 'Failed to process payment');
```

`authorization`/`cookie` headers and `body.password`/`body.token` are auto-redacted.

---

## 6. Data Layer (Prisma & Supabase)

Supabase uses PgBouncer pooling on port `6543`, which doesn't support DDL — so two URLs are required:

- `DATABASE_URL` — pooler URL (`6543`), used at runtime.
- `DIRECT_URL` — direct connection (`5432`), used only by Prisma migrations (`prisma.config.ts` also prefers `DIRECT_URL`, falling back to `DATABASE_URL`).

The Prisma client is wired through `@prisma/adapter-pg` over a `pg.Pool` (see `src/lib/prisma.ts`), rather than Prisma's default connection handling, and the generated client output is redirected to `generated/prisma` (set in `schema.prisma`'s `generator` block) instead of the default `node_modules/@prisma/client`.

### Common Commands

- `npm run db:generate` — generate the typed client
- `npm run db:migrate:dev` — create + apply a local migration
- `npm run db:migrate:deploy` — apply pending migrations (production/CI)
- `npm run db:seed` — run `prisma/seed.ts`
- `npm run db:studio` — open Prisma Studio

---

## 7. Caching Layer (Upstash Redis)

`@upstash/redis` — REST-based, no persistent TCP socket, safe for serverless/short-lived environments.

```typescript
import { cacheGet } from '../lib/redis.js';

const userProfile = await cacheGet(
  `user:${id}:profile`,
  async () => prisma.user.findUnique({ where: { id } }),
  120, // seconds
);
```

If Redis is unreachable, `cacheGet` logs a warning and falls back to calling the fetcher directly — a cache outage doesn't take down the API.

---

## 8. Testing — Current Status

Vitest + Supertest are installed and configured (`vitest.config.ts`, `tests/setup.ts`), with two example tests (`tests/integration/health.test.ts`, `tests/unit/asyncHandler.test.ts`). Deliberately **not** wired into CI or the pre-commit hook right now — dropped to avoid slowing down early iteration on a medium-sized single-dev project. The plan is to pick it back up properly (with an actual read of the docs first) once the project grows or in a refactor pass, rather than layering it on now without fully understanding it.

- `npm test` — run the suite once
- `npm run test:watch` — watch mode
- `npm run test:coverage` — coverage report

---

## 9. Git, CI & Deployment Workflow

### CI (`.github/workflows/ci.yml`)

Runs on push and PR to `master` and `dev`. Two jobs:

- **tests job** (name is a holdover — it currently runs typecheck, lint, and format-check, not the test suite): `npm run typecheck`, `npm run lint`, `npm run format:check`.
- **build job**: `npm run build`.

Both jobs use a shared composite action (`.github/actions/core-setup`) that installs Node 24, runs `npm install`, and runs `npm run db:generate` (needs `DATABASE_URL`/`DIRECT_URL` secrets to generate the Prisma client).

There is no separate release/production-gate workflow — one CI file covers both branches.

### Pre-commit (Husky)

On `git commit`:

1. `npm run typecheck` — full project typecheck.
2. `npm exec lint-staged` — `eslint --fix` + `prettier --write` on staged files (JS/TS/JSON/MD/YAML). No test run here either.

### Deployment

Deployed on **Railway**, directly from source — no Docker image involved.

---

## 10. Known Quirks / Not-Yet-Cleaned-Up Items

Worth knowing about if you're extending this:

- `app.ts` mounts `healthRouter` twice: once via `rootRouter` at `/api/v1` (giving the real, working `/api/v1/health`), and once directly at `app.use('/health', healthRouter)`. Since `healthRouter` itself defines `/health` internally, that second mount actually resolves to `/health/health`, not `/health`. Harmless but worth removing or fixing.
- The CI job that runs typecheck/lint/format is still named `tests` in `ci.yml` — no actual test execution happens in it.
- `src/services/` is referenced as a convention (see Section 3) but doesn't exist in the repo yet — nothing has needed it so far.

---

## 11. Reusing This Boilerplate for a New Project

1. **Clone and detach git history**:
   ```bash
   git clone <this-repo-url> my-new-service
   cd my-new-service
   rm -rf .git
   git init
   ```
2. **Update `package.json`** — `name` and `description`.
3. **Configure environment**:
   ```bash
   cp .env.example .env.development
   ```
   Fill in your own Supabase/Upstash credentials.
4. **Install & run**:
   ```bash
   npm install
   npm run db:generate
   npm run dev
   ```
5. **Add your models** in `prisma/schema.prisma`, then follow [Section 3](#3-step-by-step-recipe-adding-a-new-feature) for the feature pattern.
6. Decide deliberately whether this new project needs Docker/tests wired in from day one, or whether it's small enough to defer them like this one did.
