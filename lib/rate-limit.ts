/**
 * The in-memory token bucket that used to live here has been removed.
 *
 * It was a module-scope Map, so on Vercel every concurrent lambda got its own
 * copy — the effective ceiling scaled with the caller's concurrency, which is
 * the opposite of a rate limit. It also never evicted entries and reset its
 * refill clock on every hit, discarding partial elapsed time.
 *
 * Durable, DB-backed limiting now lives in `lib/spend-guard.ts`. Use
 * `guardSpend` / `guardAnonymousSpend` there.
 *
 * `clientIp` is re-exported from spend-guard so existing imports of this path
 * keep working.
 */

export { clientIp } from '@/lib/spend-ledger';
