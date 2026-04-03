FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── Install all workspace dependencies ────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
# Stub other workspace packages so pnpm can resolve the graph
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile

# ── Build NestJS API ──────────────────────────────────────────────────────────
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter api build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Run as non-root user
RUN addgroup -g 1001 nodejs && adduser -D -u 1001 -G nodejs appuser

COPY --from=build /app/apps/api/dist ./dist
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=deps  /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api/package.json ./package.json

# Create storage directory with correct ownership
RUN mkdir -p storage/events storage/users storage/organizations storage/verifications \
  && chown -R appuser:nodejs storage

USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "dist/main"]
