import { sql } from './client';
import type { Referral } from '@/types/database';

/**
 * Referral helpers preserved from the former community-queries.ts.
 * These are intentionally independent of the community submission workflow, which
 * was removed in Phase 0.
 */

/**
 * Attributes an existing clicked-but-not-signed-up referral to a new user on signup.
 * Called from the signup flow — unrelated to community submissions.
 */
export async function attributeReferralSignup(
  referrerId: string,
  newUserId: string,
): Promise<Referral | null> {
  const rows = await sql`
    UPDATE referrals
    SET referred_user_id = ${newUserId}, status = 'signed_up', signup_at = NOW()
    WHERE id = (
      SELECT id FROM referrals
      WHERE referrer_id = ${referrerId} AND referred_user_id IS NULL AND status = 'clicked'
      ORDER BY click_at DESC LIMIT 1
    )
    RETURNING *
  `;
  return (rows[0] as Referral) ?? null;
}

// --- Referral click tracking (referrals table, unrelated to community) ---

export async function recordReferralClick(
  referrerId: string,
  clickIp: string | null,
): Promise<Referral> {
  const rows = await sql`
    INSERT INTO referrals (referrer_id, click_ip)
    VALUES (${referrerId}, ${clickIp})
    RETURNING *
  `;
  return rows[0] as Referral;
}
