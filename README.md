# EdgeLink — SEO Intelligence

**Know what is holding your website back.**

A production-minded SEO automation platform for agencies: manage clients and sites, run crawl + AI audits through a BullMQ worker, watch progress live, and deliver a branded PDF report with a mock/live notification trail.

Built for the Edgelink Technology full-stack assessment (AI Developer & Automation Engineer — SEO Automation Dashboard).

---

## What actually works

Everything below is implemented and was exercised against a real Postgres database, Redis queue and headless Chromium.

**Audit pipeline**

- Trigger from the admin UI, the API, or a monthly schedule; job enters BullMQ (`seo-audit-jobs`).
- Persistent worker (`npm run worker`) processes jobs outside the Next.js request lifecycle.
- Crawler (`fetch` + Cheerio, SSRF-hardened) collects title, meta, headings, canonical, robots directives, images/alt text, links, word count, structured data, robots.txt and sitemap.xml.
- 26 deterministic on-page/technical checks, each with pass / warn / fail and its measured evidence.
- PageSpeed Insights, Search Console, DataForSEO and Twilio WhatsApp adapters run from `src/mocks/` when `USE_MOCKS=true`, and call the real API when it is `false`.
- AI analysis: Anthropic Claude (`ANTHROPIC_MODEL`, default `claude-sonnet-4-6`) with a strict Zod-validated JSON contract, one repair retry, or the deterministic fixture when `AI_USE_MOCKS=true`. The source (`CLAUDE` / `MOCK`) is stored on the audit and disclosed in the UI and PDF — mock output is never presented as Claude output.
- Progress, stage, per-stage events and errors are persisted; the UI polls live and survives a page reload.
- Failures retry once through BullMQ, then persist a readable error with a **Retry** action; a reconciliation sweep fails audits stuck in `QUEUED`/`RUNNING`.
- Reports: Puppeteer renders A4 HTML → PDF (page numbers stamped with pdf-lib), stored by an adapter, downloadable only by an authorized owner. Notifications: WhatsApp mock and an email adapter (mock or SMTP) record every attempt with recipient and provider id.

**Product surface**

- Public marketing site (`/`) with a live SEO signal visualisation, pipeline walkthrough, report preview and pricing — no fabricated testimonials or customer logos.
- Admin portal (`/app`): overview with score trends, clients, websites, audits, audit detail, reports, schedules, settings, ⌘K command palette.
- Client portal (`/client`): read-only audit history and reports for that client only.
- Auth: bcrypt credentials, HttpOnly signed session cookie, server-side role checks on every route and API, tenant scoping on every query.
- Monthly scheduling: per-website day/hour, UTC, next-run computed, and a secret-protected cron endpoint (`POST /api/cron/schedules`) that is idempotent under overlapping invocations.
- Light and dark theme, reduced-motion support, keyboard focus states.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 14.2 App Router, React 18, TypeScript |
| UI | Tailwind CSS, Radix primitives (shadcn/ui pattern), Lucide icons, GSAP scroll reveal |
| Data | PostgreSQL (Supabase / Neon) + Prisma 6 |
| Queue | BullMQ 5 + Redis (Upstash or self-hosted) |
| Crawl | `fetch` + Cheerio, private-address/redirect validation |
| AI | `@anthropic-ai/sdk` + deterministic fixture fallback |
| PDF | Puppeteer (`puppeteer-core`) + pdf-lib page stamping |
| Email | Nodemailer (mock or SMTP) |
| Tests | Vitest |

## Architecture

```
Browser ── Next.js App Router (server components + route handlers)
              │                    │
              │ enqueue            │ read/write
              ▼                    ▼
        BullMQ queue  ────────►  Worker process (npm run worker)
        (Redis)                    │ crawl → checks → integrations → AI → persist
                                   │ → PDF (Puppeteer) → storage → notifications
                                   ▼
                            PostgreSQL (Prisma)
```

Why a separate worker: a BullMQ consumer is a long-lived process. It cannot be a Vercel function. The web app deploys to Vercel; the worker deploys to any always-on host (Railway, Fly.io, Render, a VPS, or the included Docker image). The cron endpoint only *enqueues*; it never runs an audit inline.

### Pipeline stages

`queued → crawling → technical-checks → integrations → on-page-analysis → ai-analysis → persistence → report → notifications → completed`

Every stage transition writes an `AuditEvent` row and updates `progress`, so the client sees real stages, not a fake timer.

## Project layout

```
prisma/
  schema.prisma            # User, Client, Website, Audit, AuditEvent, Report,
                           # NotificationAttempt, AuditSchedule
  seed.ts                  # demo agency, two clients, two websites, one schedule
scripts/
  e2e-pipeline.ts          # full pipeline without HTTP (queue → worker → PDF)
  verify-system.ts         # dedupe, schedule claim, cron auth against the running app
  inspect-audits.ts        # human-readable audit dump
  inspect-notifications.ts # notification delivery rows
src/
  app/                     # marketing, /login, /app (admin), /client, /api
  components/              # ui primitives, dashboard, audit analysis, marketing
  lib/                     # auth, session, authz, env validation, urls (SSRF), api helpers
  server/                  # audits, crawl, checks, robots, sitemap, schema-org,
                           # schedules, notifications, reconciliation, ai/, pipeline/
  integrations/            # pagespeed, search-console, dataforseo, whatsapp, email
  mocks/                   # assessment fixtures + USE_MOCKS switch
  queue/                   # BullMQ connection, queue, job ids
  report/                  # HTML template, Puppeteer render, page numbers, storage
  worker/                  # BullMQ worker entrypoint
  tests/                   # vitest suites + fixtures
```

## Local setup

### 1. Prerequisites

- Node.js 20+ (18 works, 20 is recommended)
- PostgreSQL 14+ — local Docker or a Supabase/Neon URL
- Redis 6+ — local Docker, or an Upstash `rediss://` URL
- Chrome/Chromium for PDF rendering (Puppeteer drives an installed browser; no download is bundled)

Local services with Docker:

```bash
docker run -d --name edgelink-pg -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=edgelink postgres:16-alpine
docker run -d --name edgelink-redis -p 6379:6379 redis:7-alpine
```

### 2. Configure

```bash
cp .env.example .env
# set AUTH_SECRET and CRON_SECRET (openssl rand -base64 32)
```

### 3. Install, migrate, seed

```bash
npm install
npx prisma db push        # creates the schema
npm run db:seed           # demo users, clients, websites, one monthly schedule
```

### 4. Run

Two processes — the web app and the audit worker:

```bash
npm run dev               # http://localhost:3000
npm run worker            # terminal B
```

Without the worker, audits stay `QUEUED`; the UI says so explicitly.

### Demo accounts (seeded, local only — change before any real deployment)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@edgelink.test` | `EdgelinkAdmin!2026` |
| Client (Northstar Dental) | `client@northstar.test` | `EdgelinkClient!2026` |

## 3–5 minute demo script

1. `/` — landing page. Point out the signal observatory and report preview; note that every figure comes from a real audit.
2. Sign in as admin → `/app`. Overview shows score trend, open audits and recent activity from the database.
3. **Clients → Northstar Dental Group → Primary practice site** — business type/city feed the local keyword and schema checks.
4. **Run audit** → the audit page streams `crawling → checks → AI → report → notifications`, then shows the score, breakdown, findings and recommendations.
5. Open **Reports** → download the PDF. Show the mock-data disclosure and AI provenance line.
6. Back on the audit page, show the notification trail (WhatsApp mock + email) and the stage log.
7. **Schedules** — set day/hour; show the computed next run. (`curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/schedules` triggers the same path.)
8. Sign in as the client user → `/client`: only that client's audits and reports; a foreign audit URL returns 403.
9. Optional failure path: audit an unreachable host, watch the error, press **Retry**.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string (pooled URL is fine at runtime) |
| `AUTH_SECRET` | yes | Signs the session JWT; 32+ random chars |
| `CRON_SECRET` | yes | Bearer token for `POST /api/cron/schedules` |
| `APP_URL` | yes | Absolute origin used in notifications/report links |
| `REDIS_URL` | yes | Redis/Upstash URL for BullMQ |
| `USE_MOCKS` | yes | `true` = assessment fixtures for PageSpeed/GSC/DataForSEO/WhatsApp |
| `AI_USE_MOCKS` | yes | `true` = deterministic AI fixture (never spends tokens) |
| `ANTHROPIC_API_KEY` | when AI is live | Claude API key |
| `ANTHROPIC_MODEL` | no | Default `claude-sonnet-4-6`; use a model your key can access |
| `PAGESPEED_API_KEY` | when mocks are off | Live PageSpeed Insights |
| `REPORT_STORAGE` | no | `local` (default, dev/single host) or `supabase` (durable object storage) |
| `REPORT_DIR` | no | Directory used by the `local` adapter |
| `SUPABASE_URL` | when `REPORT_STORAGE=supabase` | Supabase project URL (server-only) |
| `SUPABASE_SERVICE_ROLE_KEY` | when `REPORT_STORAGE=supabase` | Storage service-role key; never exposed to the browser |
| `SUPABASE_REPORT_BUCKET` | no | Private bucket name, default `reports` |
| `PUPPETEER_EXECUTABLE_PATH` | no | Explicit Chrome path; autodetected when empty |
| `EMAIL_TRANSPORT`, `SMTP_*`, `EMAIL_FROM` | no | `mock` (default) or `smtp` delivery |
| `TWILIO_*` | when mocks are off | Real WhatsApp sending |
| `WORKER_CONCURRENCY`, `AUDIT_TIMEOUT_MS` | no | Worker throughput and per-audit ceiling |

Secrets live only in `.env` (git-ignored). Nothing is exposed to the browser.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run worker` | BullMQ worker (long-lived) |
| `npm test` | Vitest unit + integration suite |
| `npm run test:e2e` | Runs the whole pipeline headlessly (DB + worker inline) and writes a PDF |
| `npm run typecheck` / `npm run lint` | TypeScript / ESLint |
| `npx tsx scripts/verify-system.ts` | Dedupe, schedule claim and cron-auth checks against the running stack |
| `npm run db:push` / `db:seed` / `db:studio` | Prisma schema, seed, studio |
| `npx tsx scripts/inspect-audits.ts` | Print recent audits with stage events |
| `npx tsx scripts/prune-demo-audits.ts [--apply]` | Trim duplicate audits left by repeated test runs |
| `npx tsx scripts/clean-queue.ts [all\|failed\|completed]` | Clear terminal BullMQ jobs after testing |

## Testing

```bash
npm test          # 99 tests, 9 files
npm run typecheck
npm run lint
npm run test:e2e  # real crawl + queue + worker + PDF, needs Postgres and Redis
```

The suite covers URL normalisation and SSRF rejection (private IPs, IPv4-mapped IPv6, metadata hosts, redirect hops), signal extraction, all 26 checks, mock adapter determinism, AI JSON validation/repair, schedule date maths, authorization helpers, report rendering/escaping/storage-key safety/page stamping, and both report-storage adapters (local path safety, Supabase bucket URL and server-side auth header). Results for the current tree are recorded in [COMPLETION-REPORT.md](COMPLETION-REPORT.md).

## Reports (Puppeteer)

The worker needs a Chromium binary:

- macOS/Windows: install Chrome; the worker autodetects the standard path, or set `PUPPETEER_EXECUTABLE_PATH`.
- Debian/Ubuntu worker host: `apt-get install -y chromium` (the Docker `worker` target already does this and points `PUPPETEER_EXECUTABLE_PATH` at it).
- If no browser is found the audit fails with an explicit message; it never writes a placeholder PDF.

PDFs are written and read through one boundary, `src/report/storage.ts`:

- `local` (default) writes under `REPORT_DIR`. Valid for development and single-host Docker deployments where web and worker share a volume.
- `supabase` uploads to a **private** Supabase Storage bucket over the REST API (no extra SDK) using `SUPABASE_SERVICE_ROLE_KEY`. This is the supported Vercel architecture: the worker writes the PDF, the Vercel web app streams it through the authorized `/api/reports/:id/download` route. Internal object keys are never exposed to clients.

On Vercel the filesystem is ephemeral, so `REPORT_STORAGE=local` must not be used there.

## Deployment

### Web app → Vercel

Target architecture: **Vercel (Next.js) + Supabase/Neon Postgres + Upstash Redis + Supabase Storage + a persistent worker host + cron-job.org**. The BullMQ worker is never deployed as a Vercel function.

1. Import the repository; the included `vercel.json` pins framework Next.js, `npm ci`, `npm run build`, region `iad1`. `postinstall` runs `prisma generate`, so Prisma Client is generated during install.
2. Environment variables (Production + Preview): `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `CRON_SECRET`, `APP_URL` (the final Vercel URL), `REDIS_URL` (Upstash `rediss://`), `USE_MOCKS`, `AI_USE_MOCKS`, `REPORT_STORAGE=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_REPORT_BUCKET`. Add `ANTHROPIC_API_KEY` only when `AI_USE_MOCKS=false`.
3. Create the private storage bucket (same name as `SUPABASE_REPORT_BUCKET`). Do not make it public: downloads are proxied by the authorized route.
4. Apply the schema once from your machine against the production database: `npx prisma db push` (or `prisma migrate deploy` if you adopt migrations). Builds never mutate the database.
5. Deploy. Then check `GET /api/health` → `status: "ok"` with `checks.storage: "supabase"`.
6. API routes are dynamic and use the Node.js runtime; `/api/audits` and `/api/cron/schedules` declare `maxDuration = 60`. They enqueue work and return promptly — crawling, PDF generation and notifications stay in the worker.

### Worker → an always-on host

Any of Railway, Render, Fly.io, a small VPS, or Docker:

```bash
docker build --target worker -t edgelink-worker .
docker run --env-file .env edgelink-worker     # runs `npm run worker`
```

It needs `DATABASE_URL`, `REDIS_URL`, `REPORT_STORAGE=supabase` + `SUPABASE_*` (or a persistent local volume), `USE_MOCKS`/`AI_USE_MOCKS`, and Chromium. It does not need `AUTH_SECRET`, and it must not be exposed publicly. SIGTERM/SIGINT close the BullMQ worker and Redis connection gracefully; startup runs a stuck-audit reconciliation sweep. Queue health is visible at `GET /api/health` and in Admin → Settings.

`docker compose up --build` runs the whole stack (Postgres, Redis, migrate, web, worker) locally in production shape. The Docker targets could not be built in the earlier sandbox (no route to Docker Hub); see [COMPLETION-REPORT.md](COMPLETION-REPORT.md) → Verification.

### Monthly schedule → cron-job.org

- URL: `POST https://<your-domain>/api/cron/schedules`
- Header: `Authorization: Bearer <CRON_SECRET>` (the `?secret=` query form is also accepted for providers that cannot set headers)
- Schedule: hourly is sufficient and safe (monthly schedules are day+hour UTC; day is clamped to 1–28).
- The endpoint scans due schedules, claims each with a conditional update on `nextRunAt` (duplicate/overlapping triggers cannot double-create audits), enqueues the audit, advances `nextRunAt`, and also reconciles stuck audits. It returns counts as JSON, normally in well under a second; crawling and PDF work happen in the worker.
- Unauthenticated or invalid secrets return `401`. Missed runs are recovered on the next run because due schedules are selected by `nextRunAt <= now` (not by an exact-hour match).

## Security notes

- Passwords hashed with bcrypt; sessions are HttpOnly, SameSite=Lax, signed JWTs with expiry.
- Every API route re-checks the session and role server-side; client users are scoped to their own `clientId`; foreign resources return 403/404 rather than leaking existence.
- Audit URLs are validated before every request *and on every redirect hop*: http(s) only, no credentials, no localhost/metadata hosts, no private, loopback, link-local, CGNAT or reserved addresses (including IPv4-mapped IPv6), DNS answers checked, 15s timeout, 2MB cap.
- Login is rate-limited in-process; cron is bearer-protected; report downloads are authorized and served with `no-store`.
- HTML in reports is escaped; storage keys are sanitised and traversal-checked.

## Known limitations

- **Mocks are the default.** PageSpeed, GSC, DataForSEO and WhatsApp return the assessment fixtures unless `USE_MOCKS=false` and credentials exist. Fixtures are labelled as mocks in the UI and PDF.
- **AI defaults to the deterministic fixture** (`AI_USE_MOCKS=true`). Live Claude needs a funded key and a model id your account can access — set `ANTHROPIC_MODEL` accordingly. The configured `claude-sonnet-4-6` may not be enabled on every account.
- **Single-page crawl.** The crawler audits the entry URL (plus robots/sitemap); it does not recursively crawl an entire site yet.
- **Local report storage.** No S3/R2 adapter yet; the Vercel filesystem is ephemeral (see Reports).
- **Login rate limiting is per-instance** memory, not a shared store.
- **No email verification / password reset flow.** Users are created by an admin.
- The seeded demo uses public websites (ada.org, example.com) as audit targets for fictional clients; inbound SEO metrics remain mocked fixtures.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Audits stay `QUEUED` | Worker not running, or web/worker point at different Redis URLs |
| `Could not resolve …` | Target domain is unreachable/typo — the error is persisted and retryable |
| PDF stage fails with "No Chrome/Chromium binary" | Install Chromium or set `PUPPETEER_EXECUTABLE_PATH` |
| Cron returns 401 | Missing/incorrect `CRON_SECRET` bearer header |
| `prisma` errors on start | `npx prisma generate` (also run by `npm run build`), `DATABASE_URL` reachable |
| Login fails after seeding | Re-run `npm run db:seed`; credentials are the table above |

## Assessment mapping

| Requirement | Where |
| --- | --- |
| Next.js 14 App Router + Tailwind + shadcn/ui | `src/app`, `src/components/ui` |
| BullMQ + Upstash Redis worker | `src/queue`, `src/worker`, `src/server/pipeline` |
| Fetch + Cheerio crawler | `src/server/crawl.ts`, `src/lib/urls.ts` |
| Claude JSON analysis | `src/server/ai/*`, `src/mocks/ai.mock.js` |
| Prisma + PostgreSQL | `prisma/schema.prisma` |
| Puppeteer PDF | `src/report/render.ts`, `template.ts`, `page-numbers.ts` |
| Mocked PSI / GSC / DataForSEO / Twilio | `src/mocks/*`, `src/integrations/*` |
| `USE_MOCKS` switch | `src/mocks/index.js` |
| Admin + client dashboards | `src/app/app/*`, `src/app/client/*` |
| Manual + monthly scheduled audits | `src/server/audits.ts`, `schedules.ts`, `/api/cron/schedules` |
| Persistence, progress, reports, notifications | `src/server/pipeline/run-audit.ts`, `src/server/notifications.ts` |
| Vercel + persistent worker + cron-job.org | this README, `Dockerfile`, `docker-compose.yml` |
