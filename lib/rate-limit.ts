// In-memory token bucket rate limiter.
// NOTE: For production, replace with Upstash Redis for distributed rate limiting.

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

const MAX_TOKENS = 10;
const REFILL_INTERVAL_MS = 60_000; // 1 minute

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  const refills = Math.floor(elapsed / REFILL_INTERVAL_MS);
  if (refills > 0) {
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + refills * MAX_TOKENS);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    return { allowed: false, remaining: 0 };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: bucket.tokens };
}
