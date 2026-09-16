# AI Studio Backend — Express + TypeScript Boilerplate

A production-grade starter for building REST APIs with **Express 5**, **TypeScript**, **Prisma**, and **Upstash Redis**. Currently deployed on **Railway**.

---

## ⚡ Features

- **Runtime**: Node.js 24+ with native ES Modules (`"type": "module"`).
- **Language**: TypeScript, strict mode, `NodeNext` resolution, ES2023 target.
- **Package Manager**: npm.
- **Validation**: Zod-based typed environment variables (fail-fast on startup) plus a reusable `validate()` request middleware for body/params/query.
- **Data Layer**: Prisma ORM (`@prisma/adapter-pg` driver adapter over a `pg` `Pool`) against Supabase PostgreSQL, with a custom generated-client output path.
- **Caching**: Upstash Redis REST client with a typed cache-aside helper (`cacheGet`) that falls back to the DB fetcher if Redis is unavailable.
- **Logging**: Structured logging with Pino + `pino-http` request logging, secrets redacted.
- **Error Handling**: Custom `ApiError` class with a centralized error-handling middleware.
- **Code Quality**: ESLint flat config, Prettier, Husky pre-commit hook (typecheck + lint-staged).
- **CI**: GitHub Actions on push/PR to `master`/`dev` — typecheck, lint, format check, and build. No test step is wired into CI yet.
- **Testing**: Vitest + Supertest are set up with a couple of example tests, but not enforced anywhere (not in CI, not in the pre-commit hook). Deliberately deferred for now.
- **Containers**: None. No `Dockerfile`/`docker-compose.yml` — the project deploys directly to Railway. Deferred deliberately for the same reason as testing: not needed yet at this project's size.

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js**: `v24.x` (see `.nvmrc`)
- **PostgreSQL Database** (e.g. [Supabase](https://supabase.com))
- **Upstash Redis Instance** ([Upstash](https://upstash.com))

### 2. Installation

```bash
git clone <repository-url>
cd ai-studio-backend
npm install
```

### 3. Environment Setup

```bash
cp .env.example .env.development
```

Fill in `.env.development` with your database and Redis connection details. Required variables (validated by Zod at startup — see `src/config/env.ts`):

| Variable                   | Notes                                                              |
| -------------------------- | ------------------------------------------------------------------ |
| `NODE_ENV`                 | `development` \| `production` \| `test`, defaults to `development` |
| `PORT`                     | Defaults to `3000`                                                 |
| `DATABASE_URL`             | Supabase pooler URL (port `6543`) — runtime queries                |
| `DIRECT_URL`               | Supabase direct URL (port `5432`) — migrations only                |
| `UPSTASH_REDIS_REST_URL`   | Upstash REST endpoint                                              |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token                                                 |
| `LOG_LEVEL`                | Pino level, defaults to `info`                                     |
| `CLIENT_ORIGIN`            | Allowed CORS origin                                                |

The file loaded depends on `NODE_ENV`: `.env.production`, `.env.test`, or `.env.development` (default). All of these are git-ignored except `.env.example`.

### 4. Database Setup

```bash
npm run db:generate
npm run db:migrate:dev
```

### 5. Start Development Server

```bash
npm run dev
```

Server starts at `http://localhost:3000`. The health check lives at:

```bash
curl http://localhost:3000/api/v1/health
```

> Note: there's also a second, currently non-functional `app.use('/health', healthRouter)` mount in `src/app.ts` — since `healthRouter` defines its own `/health` path internally, that mount actually resolves to `/health/health`, not `/health`. Worth cleaning up; the real health check is `/api/v1/health`.

---

## 📜 Available Scripts

| Command                     | Description                                           |
| :-------------------------- | :---------------------------------------------------- |
| `npm run dev`               | Starts server with `tsx watch` for hot-reloading      |
| `npm run build`             | Compiles TypeScript source to `dist/`                 |
| `npm start`                 | Runs compiled production server from `dist/index.js`  |
| `npm run typecheck`         | Validates TypeScript types across the project         |
| `npm run lint`              | Runs ESLint on all files                              |
| `npm run format`            | Formats code with Prettier                            |
| `npm run format:check`      | Checks code formatting without modifying files        |
| `npm test`                  | Runs all Vitest test suites (not run in CI currently) |
| `npm run test:watch`        | Runs Vitest in interactive watch mode                 |
| `npm run test:coverage`     | Generates a test coverage report                      |
| `npm run db:generate`       | Generates the typed Prisma Client                     |
| `npm run db:migrate:dev`    | Applies new migrations in development                 |
| `npm run db:migrate:deploy` | Applies pending migrations in production              |
| `npm run db:seed`           | Seeds the database with initial data                  |
| `npm run db:studio`         | Opens Prisma Studio GUI                               |

---

## 🚂 Deployment

Deployed on **Railway**. CI (`.github/workflows/ci.yml`) runs on push/PR to `master` and `dev`: typecheck, lint, format check, and a build job. No Docker image is built — Railway builds and runs the app directly from the Node.js source.

---

## 📖 Comprehensive Documentation

For architecture details, the request lifecycle, and a step-by-step recipe for adding a new feature, see:

👉 **[Developer Walkthrough Guide (devWalkthrough.md)](./devWalkthrough.md)**

---

## 📄 License

MIT
