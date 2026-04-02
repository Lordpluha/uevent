# uEvent

Event discovery and ticketing platform. Monorepo containing a NestJS API, React Router v7 web app, and a Kottster-based admin panel.

## Stack

| Layer | Technology |
|-------|-----------|
| API | NestJS 11, TypeORM, PostgreSQL |
| Web | React Router v7 (SSR), TanStack Query, Tailwind CSS |
| Admin | Kottster (separate service) |
| Payments | Stripe Connect |
| Email | SMTP (nodemailer) |
| Push | Web Push (VAPID) |
| Auth | JWT cookies + Google OAuth |

---

## Quick Start — Docker (recommended)

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) v2

### 1. Create an env file at the project root

```bash
cp apps/api/.env.example .env
```

Edit `.env` and fill in the required values (see [Environment Variables](#environment-variables)).

### 2. Start all services

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web app | http://localhost:5173 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| PostgreSQL | localhost:5434 |

> **Stripe webhooks**: The `stripe-cli` service only starts its forwarder. You must set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env` for it to authenticate. For Apple Pay / Google Pay domain registration run `bash apps/api/scripts/register-stripe-domain.sh` after the stack is up.

### Stop

```bash
docker compose down          # keep DB data
docker compose down -v       # wipe DB volume too
```

---

## Development Setup (without Docker)

### Prerequisites

- Node.js ≥ 18
- [pnpm](https://pnpm.io/installation) ≥ 10 (`corepack enable` or `npm i -g pnpm`)
- PostgreSQL ≥ 14 running locally (or start only the DB container: `pnpm db:up`)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
# API
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env

# Web
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env
```

### 3. Start dev servers

```bash
pnpm dev          # starts both api and web via Turborepo
```

Or individually:

```bash
pnpm --filter api dev
pnpm --filter web dev
```

### Seed the database

```bash
pnpm --filter api seed:all
```

---

## Environment Variables

### API (`apps/api/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_HOST` | ✓ | DB host (use `localhost` for local, `postgres` in Docker) |
| `POSTGRES_PORT` | ✓ | DB port (default `5432`) |
| `POSTGRES_USER` | ✓ | DB user |
| `POSTGRES_PASSWORD` | ✓ | DB password |
| `POSTGRES_DB` | ✓ | DB name |
| `DB_SYNCHRONIZE` | — | `true` in dev (auto-migrate), **must be `false` in production** |
| `JWT_SECRET` | ✓ | Secret for signing access JWTs |
| `CLIENT_URL` | ✓ | Frontend origin, e.g. `http://localhost:5173` |
| `API_URL` | ✓ | API origin, e.g. `http://localhost:3000` |
| `GOOGLE_CALLBACK_URL` | ✓ | Full OAuth callback URL, e.g. `http://localhost:3000/api/auth/users/google/callback` |
| `GOOGLE_CLIENT_ID` | — | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth app client secret |
| `STRIPE_SECRET_KEY` | — | Stripe secret key (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | — | Stripe webhook signing secret (`whsec_…`) |
| `STRIPE_PLATFORM_ACCOUNT_ID` | — | Stripe Connect platform account ID |
| `STRIPE_PLATFORM_COMMISSION_ACCOUNT` | — | Secondary commission account |
| `PAYMENT_CURRENCY` | — | Default currency code (default `usd`) |
| `STRIPE_PLATFORM_FEE_CENTS` | — | Platform fee per transaction in cents (default `100`) |
| `SMTP_HOST` | — | SMTP server host |
| `SMTP_PORT` | — | SMTP server port |
| `SMTP_USER` | — | SMTP auth user |
| `SMTP_PASS` | — | SMTP auth password |
| `SMTP_FROM_EMAIL` | — | From address for outgoing emails |
| `VAPID_PUBLIC_KEY` | — | VAPID public key for Web Push |
| `VAPID_PRIVATE_KEY` | — | VAPID private key |
| `VAPID_SUBJECT` | — | VAPID subject (`mailto:…`) |

### Web (`apps/web/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✓ | API base URL visible to the browser |
| `VITE_STRIPE_PUBLISHABLE_KEY` | — | Stripe publishable key (`pk_test_…`) |
| `VITE_PAYMENT_CURRENCY` | — | Currency code (default `usd`) |
| `VITE_SITE_URL` | — | Canonical site URL for SEO |
| `VITE_SITE_NAME` | — | Site name for SEO meta tags |

---

## Project Structure

```
uevent/
├── apps/
│   ├── api/          # NestJS backend — REST API, auth, payments, DB
│   ├── web/          # React Router v7 SSR frontend
│   └── admin/        # Kottster admin panel (standalone, separate compose)
├── packages/         # Shared packages (reserved for future use)
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Useful Scripts

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Start all apps in watch mode |
| `pnpm build` | Production build for all apps |
| `pnpm db:up` | Start only the PostgreSQL container |
| `pnpm db:down` | Stop the PostgreSQL container |
| `pnpm db:logs` | Tail PostgreSQL logs |
| `pnpm --filter api seed:all` | Seed the database with demo data |
| `bash apps/api/scripts/register-stripe-domain.sh` | Register domain with Stripe for Apple/Google Pay |

---

## Admin Panel

The admin panel (`apps/admin/`) is a separate [Kottster](https://kottster.app) application with its own `docker-compose.yml`. Run it independently:

```bash
cd apps/admin
docker compose up --build
```

---

## Production Notes

- Set `DB_SYNCHRONIZE=false` — the API will refuse to start in `NODE_ENV=production` if this is `true`. Use a proper migration strategy for schema changes.
- The `stripe-cli` service in `docker-compose.yml` is for local webhook testing only. Remove it from production deployments.
- All secrets (`JWT_SECRET`, `STRIPE_*`, `SMTP_*`, `VAPID_*`) must be set before starting the stack. The API validates all required env vars on startup and exits with a descriptive error if any are missing.
- The `GOOGLE_CALLBACK_URL` must point to the publicly reachable API URL if Google OAuth is enabled.
