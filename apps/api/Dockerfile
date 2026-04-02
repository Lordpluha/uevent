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

COPY --from=build /app/apps/api/dist ./dist
COPY --from=deps  /app/node_modules ./node_modules
COPY --from=deps  /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main"]
