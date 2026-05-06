# WordZoo

Language learning SaaS with AI-generated keyword mnemonics, spaced repetition, a tutor, and Stripe billing. Built with Next.js 16, React 19, Neon Postgres, and Tailwind CSS v4.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Database**: Neon Postgres (serverless) via raw SQL (`@neondatabase/serverless`)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Auth**: NextAuth v5 beta (Google OAuth, database sessions, `@auth/neon-adapter`)
- **AI**: Google Gemini 2.0 Flash (`@google/genai`)
- **Images**: Stability AI
- **Payments**: Stripe (subscriptions + one-time purchases)
- **Offline**: IndexedDB with sync queue

## Commands

- `npm run dev` — starts on **port 8000** (not 3000)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run db:migrate` — run migrations (`lib/db/migrate.ts`)
- `npm run db:seed` — seed base data
- `npm run db:seed-mnemonics` — seed AI-generated mnemonics
- `npm run db:seed-audio` — generate TTS audio (`--mode=words|narrations|dialogues|phrases|all`, `--only=word1,word2`, `--force`)
- `npm run db:seed-expanded` — seed expanded Indonesian content (Units 1-5, 19 scenes, ~231 words)
- No automated test framework is configured. Do not create test files, test scripts, or test dependencies. Playwright MCP is for interactive browser testing during development via Claude Code, not for automated test suites.

## Deployment

- **Platform**: Vercel
- **Project**: `wordzoo`
- **Production URL**: https://wordzoo.vercel.app
- **Shipping mode**: direct-to-production for everything — interactive sessions AND scheduled routines. Commit on `main`, push, Vercel auto-deploys. No PRs. See master `Code/CLAUDE.md` "Shipping Standard."

## Cron Jobs

Mixed scheduling: project-specific sub-daily jobs run via Vercel Cron (`vercel.json`); the cross-project nightly routine runs via a **Claude Code remote agent** (registered through claude.ai) so it can do real work — read feedback, cluster, commit a triage report and any low-risk fix directly to `main` — instead of just dumping a JSON digest. All HTTP cron routes verify `Authorization: Bearer ${CRON_SECRET}` and return 401 without it.

| Job | Backend | Schedule (UTC) | Endpoint / file |
|-----|---------|----------------|-----------------|
| `reset-usage` | Vercel Cron | `0 0 * * *` | `/api/cron/reset-usage` |
| `generate-info-byte` | Vercel Cron | `0 1 * * *` | `/api/cron/generate-info-byte` |
| `check-subscriptions` | Vercel Cron | `0 3 * * *` | `/api/cron/check-subscriptions` |
| `nightly-routine` | Claude Code remote agent | `32 19 * * *` (≈03:32 Bali) | `.claude/agents/nightly-routine.md` |

The remote agent fetches the digest via `/api/cron/nightly-routine` and the pending feedback list via `/api/admin/feedback/pending`, then commits `feedback-log/YYYY-MM-DD.md` directly to `main` containing a triage report (priority/standard/noise buckets + clustering) and an optional single-file low-risk fix in the same commit (Vercel auto-deploys on push). Trigger registered in claude.ai (https://claude.ai/code/scheduled).

## Trigger Maintenance

Two scheduling backbones, two ownership models — keep them straight:

**(a) Claude Code remote trigger** (the nightly-routine agent). Managed from this CLI via the `schedule` skill + `RemoteTrigger` tool — `list`, `get`, `update`, `run` all work in-session (no curl, no OAuth juggling). Cannot delete from CLI; for deletion go to https://claude.ai/code/scheduled. Current trigger: `trig_01Dnx4XZjFoduw1SEfio9vPy` (cron `32 19 * * *`). The trigger prompt MUST stay a thin shim that points at `.claude/agents/nightly-routine.md` and supplies only secrets — every behaviour change belongs in the agent file, not the prompt. After editing the agent file, re-read the trigger prompt and update it if the two have drifted.

**(b) Vercel Cron jobs** (`reset-usage`, `generate-info-byte`, `check-subscriptions`). Managed in `vercel.json` and deployed on push to `main`. No CLI surface — schedule changes ship via a normal commit. Health is verifiable from anywhere with `curl -o /dev/null -w "%{http_code}" https://wordzoo.vercel.app/api/cron/<name>` — a deployed, middleware-protected route returns 401 without auth, which is the green signal.

Failure playbook for the Claude trigger (in run logs / committed report):

- **401 from `/api/cron/*` or `/api/admin/feedback/pending`** — `CRON_SECRET` in the trigger prompt no longer matches Vercel. Pull the current value from Vercel envs, then `RemoteTrigger update` the prompt.
- **403 "Host not in allowlist" against `wordzoo.vercel.app`** — sandbox egress block. Agent should follow its stub-commit-on-failure recipe; long-term fix is to add a custom domain (other projects use this pattern with `theubudian.life` / `theprogramme.fit`).
- **5xx from the digest endpoint** — Neon or app crash. Agent commits a partial report; investigate via `/api/cron/nightly-routine` directly with the bearer token, then check Vercel runtime logs.
- **Sandbox can't push to GitHub** — git identity wasn't configured (the trigger prompt sets `user.name` / `user.email` before commit; if the prompt was recently rewritten, verify those `git config` lines are still present).

## Feedback Module

- `app_feedback` table — status enum: `'new' | 'reviewed' | 'actioned' | 'dismissed'` (close to the cross-project standard `new | reviewed | resolved | dismissed`; "actioned" diverges — see MEMORY.md)
- API: `POST /api/feedback` (auth required, screenshot via `/api/feedback/screenshot`)
- Admin: `/api/admin/app-feedback/*` routes plus admin UI for triage

## Architecture

- **Route groups**: `(app)/` (authed pages), `(auth)/` (login/signup), `try/` (public demo)
- **API routes**: `app/api/` — REST handlers, all protected by middleware except `/api/auth/*`, `/api/share/*`, `/api/billing/webhook`, `/api/cron/*`
- **Service layer**: `lib/services/` — business logic (billing, tutor, mnemonic, path, community, sync, etc.)
- **DB layer**: `lib/db/queries.ts` + `lib/db/community-queries.ts` — raw SQL via `@neondatabase/serverless`
- **AI layer**: `lib/ai/` — Gemini client (`gemini.ts`), prompt templates (`prompts.ts`, `tutor-prompts.ts`, `path-prompts.ts`)
- **Offline**: `lib/offline/` — IndexedDB storage, sync queue, cache management
- **SRS engine**: `lib/srs/` — spaced repetition scheduling

## Code Conventions

- **API responses**: Always `NextResponse.json<ApiResponse<T>>({ data, error })` — never bare objects
- **Validation**: Zod schemas in `types/api.ts`. Import Zod as `import { z } from 'zod/v4'` (NOT `'zod'`)
- **Database**: Raw SQL with tagged template literals (`sql\`...\``). No ORM. UUID primary keys.
- **Route handlers**: Validate with Zod → delegate to service layer → return `ApiResponse`
- **Imports**: Use `@/` path alias for all project imports

## Auth

Google OAuth via NextAuth v5 beta (`next-auth@5.0.0-beta.30`) with Neon adapter. Session strategy is `database` (not JWT). Auth config is in `lib/auth.ts`. Middleware (`middleware.ts`) protects API routes only — page protection uses `auth()` server-side.

## Test Login (E2E)

All projects require `/api/auth/test-login` for Playwright testing:
- Returns 404 in production (`NODE_ENV === 'production'`)
- Creates a dev-only session via NextAuth
- Enables E2E browser testing without real OAuth flows

## AI Integration

Gemini 2.0 Flash via `@google/genai` SDK (NOT `@google-ai/generativelanguage`). Client in `lib/ai/gemini.ts`. Prompt templates in `lib/ai/prompts.ts`, `tutor-prompts.ts`, `path-prompts.ts`.

## Billing

Stripe handles subscriptions (monthly/yearly) and one-time travel pack purchases. Free tier has daily limits: 5 words, 3 tutor messages, 300s hands-free, 2 mnemonic regenerations. Premium-only: custom paths, offline downloads, community submissions. Usage resets daily via `/api/cron/reset-usage`. Logic in `lib/services/billing-service.ts`.

## Gotchas

- **Zod v4**: Must import from `'zod/v4'`, not `'zod'` — the package uses the v4 subpath export
- **Port 8000**: Dev server and `AUTH_URL`/`NEXTAUTH_URL` use port 8000
- **No ORM**: All DB access is raw SQL via `sql` tagged templates from `lib/db/client.ts`
- **NextAuth v5 beta**: Uses `auth()` not `getServerSession()`. Middleware wraps `auth()` callback pattern. Adapter is `@auth/neon-adapter`.
- **No tests**: No test runner or test files exist. Don't add test scripts or dependencies.

## Environment Variables

`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `GOOGLE_GEMINI_API_KEY`, `GOOGLE_CLOUD_TTS_API_KEY`, `STABILITY_AI_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET` (also set as GitHub repo secret), `ADMIN_EMAILS`

**Optional (future):** `RESEND_API_KEY`, `ADMIN_EMAIL` — required if/when the nightly digest is wired up to email the summary.

**`ADMIN_EMAILS`** is comma-separated and gates `/admin/*` pages and `/api/admin/*` routes via `app/(app)/admin/layout.tsx`. If unset, admin pages refuse all users. Must include both `b.hemsonstruthers@gmail.com` and `profbenjo@gmail.com` (Benji's two power-user accounts).

## Post-Change Verification

After ANY code or database change, verify the core user flow with Playwright MCP before declaring done:
1. Navigate to `localhost:8000/api/auth/test-login` to authenticate
2. Verify dashboard loads at `/` with "Continue Learning" card
3. Click through to a learn page — verify it loads without 404
4. Navigate to `/paths` — verify path cards are clickable
5. Navigate to `/review` — verify it loads

Never rely solely on code reading or database queries — always verify visually with Playwright.

## MCP Servers

All MCP servers are configured in `~/.claude.json` under the WordZoo project-scoped config (not committed). Superpowers is a Claude Code plugin (configured in `.claude/settings.json`), not an MCP server.

- **Playwright** — stdio, browser automation, accessibility snapshots, screenshots
- **Neon** — HTTP, database schema inspection, SQL queries, branch management
- **Stripe** — HTTP/OAuth, product/price management, subscription inspection, doc search
- **Vercel** — HTTP/OAuth, deployment status, logs, env var management
