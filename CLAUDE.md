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

`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `GOOGLE_GEMINI_API_KEY`, `GOOGLE_CLOUD_TTS_API_KEY`, `STABILITY_AI_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`

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
