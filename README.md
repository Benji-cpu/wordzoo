This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Operations

### Vercel cron jobs (`vercel.json`)

| Path | Schedule (UTC) | Bali (UTC+8) | Purpose |
|------|----------------|--------------|---------|
| `/api/cron/reset-usage` | `0 0 * * *` | 08:00 | Reset daily free-tier quotas |
| `/api/cron/generate-info-byte` | `0 1 * * *` | 09:00 | Generate daily info byte content |
| `/api/cron/check-subscriptions` | `0 3 * * *` | 11:00 | Reconcile Stripe subscription state |

All Vercel crons require the `Authorization: Bearer ${CRON_SECRET}` header. Vercel injects this automatically.

### Daily feedback triage agent

`.claude/agents/daily-feedback-triage.md` defines a Claude Code remote agent scheduled at **18:00 UTC (02:00 Bali)** that:

1. Reads `app_feedback` (last 7 days, status=new) and `mnemonic_feedback` from prod Postgres
2. Tags items by sender (`admin`/`power_user`/`student`) and category
3. Auto-actions safe items: regenerate up to 5 worst mnemonics/day, dismiss obvious noise
4. Opens **one PR/day** with a `feedback-log/YYYY-MM-DD.md` summary for everything that needs human review

The agent runs on Anthropic infrastructure, not locally — your machine can be off. You review the PR on GitHub like any other.

To disable: delete the trigger via the `schedule` skill, or rename `.claude/agents/daily-feedback-triage.md`.
