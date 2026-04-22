import { sql } from './client';
import type { Referral } from '@/types/database';

/**
 * Public / referral / share helpers preserved from the former community-queries.ts.
 * These are intentionally independent of the community submission workflow, which
 * was removed in Phase 0.
 */

export interface PublicWordData {
  word_id: string;
  word_text: string;
  romanization: string | null;
  meaning_en: string;
  part_of_speech: string;
  language_name: string;
  language_code: string;
  // Best mnemonic for this word (highest upvotes), regardless of community status.
  mnemonic_id: string | null;
  keyword_text: string | null;
  scene_description: string | null;
  image_url: string | null;
  upvote_count: number | null;
}

/**
 * Returns the word + its top mnemonic (by upvote_count) for the public share page.
 * Post-community: ranks by upvote_count directly instead of filtering on approved
 * community submissions.
 */
export async function getPublicWordData(wordId: string): Promise<PublicWordData | null> {
  const rows = await sql`
    SELECT
      w.id AS word_id,
      w.text AS word_text,
      w.romanization,
      w.meaning_en,
      w.part_of_speech,
      l.name AS language_name,
      l.code AS language_code,
      best.id AS mnemonic_id,
      best.keyword_text,
      best.scene_description,
      best.image_url,
      best.upvote_count
    FROM words w
    JOIN languages l ON l.id = w.language_id
    LEFT JOIN LATERAL (
      SELECT m.id, m.keyword_text, m.scene_description, m.image_url, m.upvote_count
      FROM mnemonics m
      WHERE m.word_id = w.id
      ORDER BY m.upvote_count DESC NULLS LAST, m.created_at DESC
      LIMIT 1
    ) best ON true
    WHERE w.id = ${wordId}
  `;
  return (rows[0] as PublicWordData) ?? null;
}

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

/** Simple util — used by share / OG image routes. */
export async function getMnemonicWordId(mnemonicId: string): Promise<string | null> {
  const rows = await sql`
    SELECT word_id FROM mnemonics WHERE id = ${mnemonicId}
  `;
  return (rows[0] as { word_id: string } | undefined)?.word_id ?? null;
}

// --- Share image data (used by /api/share/[mnemonicId]/image) ---

export interface MnemonicShareData {
  mnemonic_id: string;
  keyword_text: string;
  scene_description: string;
  image_url: string | null;
  word_text: string;
  romanization: string | null;
  meaning_en: string;
  language_name: string;
  language_code: string;
}

export async function getMnemonicForShare(mnemonicId: string): Promise<MnemonicShareData | null> {
  const rows = await sql`
    SELECT
      m.id AS mnemonic_id,
      m.keyword_text,
      m.scene_description,
      m.image_url,
      w.text AS word_text,
      w.romanization,
      w.meaning_en,
      l.name AS language_name,
      l.code AS language_code
    FROM mnemonics m
    JOIN words w ON w.id = m.word_id
    JOIN languages l ON l.id = w.language_id
    WHERE m.id = ${mnemonicId}
  `;
  return (rows[0] as MnemonicShareData) ?? null;
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
