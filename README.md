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

WordZoo runs three Vercel Crons (project-specific, sub-daily) and one GitHub Actions nightly job (cross-project standardised digest). All cron routes require `Authorization: Bearer ${CRON_SECRET}`.

| Job | Backend | Schedule (UTC) | Bali (WITA) | Endpoint |
|-----|---------|----------------|-------------|----------|
| `reset-usage` | Vercel Cron | `0 0 * * *` | 08:00 | `/api/cron/reset-usage` |
| `generate-info-byte` | Vercel Cron | `0 1 * * *` | 09:00 | `/api/cron/generate-info-byte` |
| `check-subscriptions` | Vercel Cron | `0 3 * * *` | 11:00 | `/api/cron/check-subscriptions` |
| `nightly-routine` | GitHub Actions | `32 19 * * *` | 03:32 | `/api/cron/nightly-routine` |

The nightly routine returns a JSON digest of feedback counts, new feedback in the last 24h, stuck mnemonics missing audio (>72h old), and overdue SRS reviews. The GitHub Actions workflow at `.github/workflows/nightly-routine.yml` calls the endpoint with `CRON_SECRET` and dumps the JSON into the workflow step summary. Resend isn't wired up yet — once it is, the workflow can append `?digest=true` to email the summary to `ADMIN_EMAIL`.

To run the nightly digest manually: GitHub → Actions → `nightly-routine` → "Run workflow".
