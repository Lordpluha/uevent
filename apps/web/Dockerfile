FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@10.33.0

# ── Install all workspace dependencies ────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile

# ── Build React Router web app ────────────────────────────────────────────────
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
WORKDIR /app/apps/web
RUN pnpm run build

# ── Deploy: flatten prod deps with pnpm deploy ────────────────────────────────
FROM base AS deploy
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
RUN pnpm --filter web deploy --prod --legacy /prod/web

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Run as non-root user
RUN addgroup -g 1001 nodejs && adduser -D -u 1001 -G nodejs appuser

COPY --from=build  /app/apps/web/build ./build
COPY --from=deploy /prod/web/node_modules ./node_modules
COPY apps/web/package.json ./package.json
COPY apps/web/public ./public

USER appuser
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/ || exit 1
CMD ["node_modules/.bin/react-router-serve", "./build/server/index.js"]