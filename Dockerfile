# Multi-stage build for Fack API's
# Optimized for Next.js standalone output and minimal Alpine image footprint

# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:26-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace and package files
COPY package.json pnpm-workspace.yaml ./

# Install dependencies including devDependencies for building
RUN pnpm install

# ─── Stage 2: Builder ─────────────────────────────────────────────────────────
FROM node:26-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment to production for build optimization
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run next build. Note: next.config.ts has output: 'standalone' configured.
RUN pnpm build

# ─── Stage 3: Runner ──────────────────────────────────────────────────────────
FROM node:26-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="/data/fack.db"

# Create a non-root system user and group for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set up the persistent data directory for SQLite
RUN mkdir -p /data && chown nextjs:nodejs /data
VOLUME /data

# Copy built standalone folder, public directory, and static assets
# Standalone mode copies only the necessary files for production
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

# Run as non-root user
USER nextjs

EXPOSE 3000

# Start Next.js using the standalone server script
CMD ["node", "server.js"]
