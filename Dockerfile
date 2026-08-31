# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build & Prepare
# ─────────────────────────────────────────────────────────────────────────────
FROM node:24-slim AS builder

WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency specifications first to leverage Docker layer caching
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm db:generate

# Copy application source code and configurations
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

# Transpile TypeScript to JavaScript in dist/
RUN pnpm build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Production Runtime
# ─────────────────────────────────────────────────────────────────────────────
FROM node:24-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Enable pnpm for production install
RUN corepack enable && corepack prepare pnpm@latest --activate

# Security: Create non-root system user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy manifests and prisma schema for production dependency resolution
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile && pnpm db:generate

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

# Set file ownership to non-root user
RUN chown -R appuser:nodejs /app
USER appuser

# Expose service port
EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the application
CMD ["node", "dist/index.js"]
