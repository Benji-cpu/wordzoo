# WordZoo

Language learning with keyword mnemonics, spaced repetition, a tutor and Stripe billing. Ben's own tool first.

- **Live at:** https://wordzoo.vercel.app (Vercel project `wordzoo`). No lead chat.
- **Repo:** `Benji-cpu/wordzoo`, branch `main`. A push to `main` deploys. The git link has dropped before, so confirm with `npx vercel ls wordzoo --prod`.
- **Stack:** Next.js 16, React 19, Neon Postgres with raw SQL through `lib/db/client.ts` (no ORM), NextAuth v5 beta (Google, database sessions), Gemini 2.5 Flash, Stability AI, Stripe. Zod is imported from `'zod/v4'`.

## Commands

- `npm run dev` (port 8000), `npm run build`, `npm run lint`, `npm test` (Vitest), `npm run test:e2e` (needs the dev server on 8000; it uses the installed Chrome).
- New database changes: add the DDL to the bottom of `lib/db/schema.ts` and write an idempotent `lib/db/apply-<name>.ts`, run with `npx tsx`. `npm run db:migrate` cannot run against the existing database.
- Content: `npm run db:seed-expanded` (add `--lang=pt` or `--lang=es`), then `npm run db:seed-audio -- --mode=all --lang=<lang>`.
- Test login: `/api/auth/test-login`. Off in production and on any Vercel deploy.

## How it works

- Fixed content (Daily Dose, conversation answers, mnemonics) is written into the repo ahead of time. Gemini runs only where a learner is waiting: the tutor, the after-session evaluation and certification.
- Every Gemini call goes through `lib/ai/gemini.ts`, which owns the model chain and the failure handling.
- Every route that calls Gemini, makes an image, makes speech or writes to Blob claims budget first with `guardSpend` (`lib/spend-guard.ts`). An unmetered route once filled and suspended the Blob store.
- `verifySceneAccess` is the paywall check. It is called in both the page and the API route.
- Tests cover `lib/srs/`, `lib/pedagogy/` and access control.
- Admins are the addresses in `ADMIN_EMAILS` (both of Ben's Gmail addresses). Admins bypass spend limits.
- The text-to-speech key belongs to Google Cloud project `473497770902`, account `mystechcards@gmail.com`.
- Vercel crons: `reset-usage`, `check-subscriptions`, `daily-reminders`, and the prepare step of the paused nightly routine.

## Older notes

`docs/claude-md-2026-11-10.md` is this file as it was before 10 Nov 2026 (pedagogy, pacing, env vars, the routine pipeline). Look a fact up there; its rules no longer apply.
