# AI Studio Backend — Express + TypeScript Boilerplate

A production-ready starter template for building robust, scalable REST APIs using **Express.js 5**, **TypeScript**, **Prisma**, and **Upstash Redis**.

---

## ⚡ Features

- **Runtime**: Node.js 24+ with native ES Modules (`"type": "module"`).
- **Language**: TypeScript with strict `NodeNext` resolution and functional style conventions.
- **Package Manager**: pnpm for fast, isolated, deterministic dependency management.
- **Validation**: Zod-based typed environment variables and request validations with fail-fast startup checks.
- **Data Layer**: Prisma ORM configured for Supabase PostgreSQL (pooler + direct migration support).
- **Caching**: Serverless-friendly Upstash Redis REST client with typed cache-aside utility.
- **Logging**: High-performance structured logging with Pino and `pino-http` request tracking.
- **Error Handling**: Custom `ApiError` class with centralized middleware error formatting.
- **Testing**: Vitest + Supertest integration for blazing-fast unit and API integration tests.
- **Code Quality**: ESLint flat config, Prettier, Husky pre-commit hooks, and `lint-staged`.
- **Containers**: Multi-stage production `Dockerfile` and `docker-compose.yml` for local dev.
- **CI/CD**: GitHub Actions workflows for pull requests into `dev` and release gates into `master`.

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js**: `v24.x` or higher (see `.nvmrc`)
- **pnpm**: `v11.x` (`npm install -g pnpm`)
- **PostgreSQL Database** (e.g. [Supabase](https://supabase.com))
- **Upstash Redis Instance** ([Upstash](https://upstash.com))

### 2. Installation

```bash
git clone <repository-url>
cd ai-studio-backend
pnpm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.development
```

Edit `.env.development` and provide your database and Redis connection details.

### 4. Database Setup

Generate Prisma client and run migrations:

```bash
pnpm db:generate
pnpm db:migrate:dev
```

### 5. Start Development Server

```bash
pnpm dev
```

The server will start at `http://localhost:3000`. Test the health check endpoint:

```bash
curl http://localhost:3000/health
```

---

## 📜 Available Scripts

| Command                  | Description                                          |
| :----------------------- | :--------------------------------------------------- |
| `pnpm dev`               | Starts server with `tsx watch` for hot-reloading     |
| `pnpm build`             | Compiles TypeScript source to `dist/`                |
| `pnpm start`             | Runs compiled production server from `dist/index.js` |
| `pnpm typecheck`         | Validates TypeScript types across the project        |
| `pnpm lint`              | Runs ESLint on all files                             |
| `pnpm format`            | Formats code with Prettier                           |
| `pnpm format:check`      | Checks code formatting without modifying files       |
| `pnpm test`              | Runs all Vitest test suites                          |
| `pnpm test:watch`        | Runs Vitest in interactive watch mode                |
| `pnpm test:coverage`     | Generates test coverage report                       |
| `pnpm db:generate`       | Generates typed Prisma Client                        |
| `pnpm db:migrate:dev`    | Applies new migrations in development                |
| `pnpm db:migrate:deploy` | Applies pending migrations in production             |
| `pnpm db:seed`           | Seeds database with initial data                     |
| `pnpm db:studio`         | Opens Prisma Studio GUI                              |

---

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t ai-studio-backend .
```

### Run Container

```bash
docker run -p 3000:3000 --env-file .env.production ai-studio-backend
```

---

## 📖 Comprehensive Documentation

For complete architectural details, step-by-step recipes for creating new endpoints/services, and workflow guidelines, please consult:

👉 **[Developer Walkthrough Guide (devWalkthrough.md)](./devWalkthrough.md)**

---

## 📄 License

MIT
