import { sql } from '@/lib/db/client';

/** Days of Premium granted per signed-up referral. */
export const REFERRAL_REWARD_DAYS = 7;
/** Lifetime cap on rewarded referrals per referrer. */
export const MAX_REWARDED_REFERRALS = 10;

export interface ReferralStats {
  clicks: number;
  signups: number;
  rewardedCount: number;
  rewardedDays: number;
  bonusUntil: string | null;
}

/**
 * Grant the referrer +7 days of Premium for a signed-up referral.
 * Idempotent per referral (rewarded_at gate) and capped per referrer.
 */
export async function grantReferralReward(
  referralId: string,
  referrerId: string
): Promise<{ granted: boolean; reason?: string }> {
  const rewardedRows = await sql`
    SELECT COUNT(*)::int AS count FROM referrals
    WHERE referrer_id = ${referrerId} AND rewarded_at IS NOT NULL
  `;
  if ((rewardedRows[0]?.count ?? 0) >= MAX_REWARDED_REFERRALS) {
    return { granted: false, reason: 'cap_reached' };
  }

  // Claim the reward atomically — second invocation finds rewarded_at set.
  const claimed = await sql`
    UPDATE referrals SET rewarded_at = NOW()
    WHERE id = ${referralId} AND status = 'signed_up' AND rewarded_at IS NULL
    RETURNING id
  `;
  if (claimed.length === 0) {
    return { granted: false, reason: 'already_rewarded' };
  }

  // Extend from the current bonus end if it's still in the future,
  // otherwise from now — stacked referrals accumulate.
  await sql`
    UPDATE users
    SET bonus_premium_until =
      GREATEST(COALESCE(bonus_premium_until, NOW()), NOW()) + make_interval(days => ${REFERRAL_REWARD_DAYS})
    WHERE id = ${referrerId}
  `;

  return { granted: true };
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const [row] = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM referrals WHERE referrer_id = ${userId}) AS clicks,
      (SELECT COUNT(*)::int FROM referrals WHERE referrer_id = ${userId} AND status = 'signed_up') AS signups,
      (SELECT COUNT(*)::int FROM referrals WHERE referrer_id = ${userId} AND rewarded_at IS NOT NULL) AS rewarded_count,
      (SELECT bonus_premium_until FROM users WHERE id = ${userId}) AS bonus_until
  `;
  const rewardedCount = (row?.rewarded_count as number) ?? 0;
  return {
    clicks: (row?.clicks as number) ?? 0,
    signups: (row?.signups as number) ?? 0,
    rewardedCount,
    rewardedDays: rewardedCount * REFERRAL_REWARD_DAYS,
    bonusUntil: row?.bonus_until ? new Date(row.bonus_until as string).toISOString() : null,
  };
}

export function getInviteUrl(userId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:8000';
  return `${base}/invite/${userId}`;
}

/** True when the user currently has referral-bonus Premium. */
export function hasActiveBonus(bonusUntil: string | Date | null | undefined): boolean {
  if (!bonusUntil) return false;
  return new Date(bonusUntil) > new Date();
}
