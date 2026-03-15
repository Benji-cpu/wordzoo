import { sql } from './client';
import type { CommunityMnemonic, ShareEvent, Referral } from '@/types/database';
import type { CommunityMnemonicCard, PublicWordData } from '@/types/community';

const PAGE_SIZE = 20;

// --- Community Mnemonics ---

export async function getCommunityMnemonicsForWord(
  wordId: string,
  userId: string,
  sort: 'top' | 'new' = 'top',
  limit: number = PAGE_SIZE,
  offset: number = 0
): Promise<CommunityMnemonicCard[]> {
  if (sort === 'top') {
    const rows = await sql`
      SELECT
        cm.id,
        m.id AS mnemonic_id,
        m.keyword_text,
        m.scene_description,
        m.image_url,
        m.upvote_count,
        m.word_id,
        cm.submitted_at,
        u.name AS author_name,
        u.image AS author_image,
        cm.submitted_by AS author_id,
        CASE WHEN mv.id IS NOT NULL THEN true ELSE false END AS has_voted
      FROM community_mnemonics cm
      JOIN mnemonics m ON m.id = cm.mnemonic_id
      JOIN users u ON u.id = cm.submitted_by
      LEFT JOIN mnemonic_votes mv ON mv.mnemonic_id = m.id AND mv.user_id = ${userId}
      WHERE m.word_id = ${wordId} AND cm.status = 'approved'
      ORDER BY m.upvote_count DESC, cm.submitted_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return rows as CommunityMnemonicCard[];
  } else {
    const rows = await sql`
      SELECT
        cm.id,
        m.id AS mnemonic_id,
        m.keyword_text,
        m.scene_description,
        m.image_url,
        m.upvote_count,
        m.word_id,
        cm.submitted_at,
        u.name AS author_name,
        u.image AS author_image,
        cm.submitted_by AS author_id,
        CASE WHEN mv.id IS NOT NULL THEN true ELSE false END AS has_voted
      FROM community_mnemonics cm
      JOIN mnemonics m ON m.id = cm.mnemonic_id
      JOIN users u ON u.id = cm.submitted_by
      LEFT JOIN mnemonic_votes mv ON mv.mnemonic_id = m.id AND mv.user_id = ${userId}
      WHERE m.word_id = ${wordId} AND cm.status = 'approved'
      ORDER BY cm.submitted_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return rows as CommunityMnemonicCard[];
  }
}

export async function getCommunityCountForWord(wordId: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM community_mnemonics cm
    JOIN mnemonics m ON m.id = cm.mnemonic_id
    WHERE m.word_id = ${wordId} AND cm.status = 'approved'
  `;
  return (rows[0] as { count: number }).count;
}

export async function submitToCommunity(
  mnemonicId: string,
  userId: string,
  status: 'pending' | 'approved' = 'pending'
): Promise<CommunityMnemonic> {
  const rows = await sql`
    INSERT INTO community_mnemonics (mnemonic_id, submitted_by, status)
    VALUES (${mnemonicId}, ${userId}, ${status})
    RETURNING *
  `;
  return rows[0] as CommunityMnemonic;
}

export async function getCommunitySubmission(mnemonicId: string): Promise<CommunityMnemonic | null> {
  const rows = await sql`
    SELECT * FROM community_mnemonics WHERE mnemonic_id = ${mnemonicId}
  `;
  return (rows[0] as CommunityMnemonic) ?? null;
}

// --- Votes ---

export async function toggleVote(
  userId: string,
  mnemonicId: string
): Promise<{ voted: boolean; newCount: number }> {
  // Check if vote exists
  const existing = await sql`
    SELECT id FROM mnemonic_votes
    WHERE user_id = ${userId} AND mnemonic_id = ${mnemonicId}
  `;

  if (existing.length > 0) {
    // Remove vote
    await sql`
      DELETE FROM mnemonic_votes
      WHERE user_id = ${userId} AND mnemonic_id = ${mnemonicId}
    `;
    await sql`
      UPDATE mnemonics SET upvote_count = GREATEST(upvote_count - 1, 0)
      WHERE id = ${mnemonicId}
    `;
  } else {
    // Add vote
    await sql`
      INSERT INTO mnemonic_votes (user_id, mnemonic_id)
      VALUES (${userId}, ${mnemonicId})
    `;
    await sql`
      UPDATE mnemonics SET upvote_count = upvote_count + 1
      WHERE id = ${mnemonicId}
    `;
  }

  const countRows = await sql`
    SELECT upvote_count FROM mnemonics WHERE id = ${mnemonicId}
  `;
  const newCount = (countRows[0] as { upvote_count: number }).upvote_count;

  return { voted: existing.length === 0, newCount };
}

// --- Flags ---

export async function flagMnemonic(
  userId: string,
  mnemonicId: string,
  reason: string,
  detail?: string
): Promise<void> {
  await sql`
    INSERT INTO mnemonic_flags (user_id, mnemonic_id, reason, detail)
    VALUES (${userId}, ${mnemonicId}, ${reason}, ${detail ?? null})
    ON CONFLICT (user_id, mnemonic_id) DO NOTHING
  `;

  // Auto-flag if >= 3 unresolved flags
  const countRows = await sql`
    SELECT COUNT(*)::int AS count FROM mnemonic_flags
    WHERE mnemonic_id = ${mnemonicId} AND resolved = false
  `;
  const flagCount = (countRows[0] as { count: number }).count;

  if (flagCount >= 3) {
    await sql`
      UPDATE community_mnemonics SET status = 'flagged', reviewed_at = NOW()
      WHERE mnemonic_id = ${mnemonicId}
    `;
  }
}

// --- Adopt ---

export async function adoptCommunityMnemonic(
  userId: string,
  wordId: string,
  mnemonicId: string
): Promise<void> {
  await sql`
    INSERT INTO user_words (user_id, word_id, current_mnemonic_id)
    VALUES (${userId}, ${wordId}, ${mnemonicId})
    ON CONFLICT (user_id, word_id)
    DO UPDATE SET current_mnemonic_id = ${mnemonicId}, updated_at = NOW()
  `;
}

// --- Share Events ---

export async function recordShareEvent(data: {
  userId: string | null;
  mnemonicId: string;
  wordId: string;
  platform?: string;
  format?: 'square' | 'story';
}): Promise<ShareEvent> {
  const rows = await sql`
    INSERT INTO share_events (user_id, mnemonic_id, word_id, platform, format)
    VALUES (${data.userId}, ${data.mnemonicId}, ${data.wordId}, ${data.platform ?? null}, ${data.format ?? 'square'})
    RETURNING *
  `;
  return rows[0] as ShareEvent;
}

// --- Referrals ---

export async function recordReferralClick(
  referrerId: string,
  clickIp: string | null
): Promise<Referral> {
  const rows = await sql`
    INSERT INTO referrals (referrer_id, click_ip)
    VALUES (${referrerId}, ${clickIp})
    RETURNING *
  `;
  return rows[0] as Referral;
}

// --- Public Word Data ---

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
      JOIN community_mnemonics cm ON cm.mnemonic_id = m.id
      WHERE m.word_id = w.id AND cm.status = 'approved'
      ORDER BY m.upvote_count DESC
      LIMIT 1
    ) best ON true
    WHERE w.id = ${wordId}
  `;
  return (rows[0] as PublicWordData) ?? null;
}

// --- Share image data ---

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

// --- Ownership check ---

export async function getMnemonicOwner(mnemonicId: string): Promise<string | null> {
  const rows = await sql`
    SELECT user_id FROM mnemonics WHERE id = ${mnemonicId}
  `;
  return (rows[0] as { user_id: string | null } | undefined)?.user_id ?? null;
}

export async function isMnemonicApproved(mnemonicId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM community_mnemonics
    WHERE mnemonic_id = ${mnemonicId} AND status = 'approved'
  `;
  return rows.length > 0;
}

export interface UserMnemonicData {
  mnemonic_id: string;
  keyword_text: string;
  scene_description: string;
  image_url: string | null;
  already_submitted: boolean;
}

export async function getUserMnemonicForWord(
  wordId: string,
  userId: string
): Promise<UserMnemonicData | null> {
  const rows = await sql`
    SELECT
      m.id AS mnemonic_id,
      m.keyword_text,
      m.scene_description,
      m.image_url,
      CASE WHEN cm.id IS NOT NULL THEN true ELSE false END AS already_submitted
    FROM mnemonics m
    LEFT JOIN community_mnemonics cm ON cm.mnemonic_id = m.id
    WHERE m.word_id = ${wordId} AND m.user_id = ${userId}
    ORDER BY m.created_at DESC
    LIMIT 1
  `;
  return (rows[0] as UserMnemonicData) ?? null;
}

export async function attributeReferralSignup(
  referrerId: string,
  newUserId: string
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

export async function getMnemonicWordId(mnemonicId: string): Promise<string | null> {
  const rows = await sql`
    SELECT word_id FROM mnemonics WHERE id = ${mnemonicId}
  `;
  return (rows[0] as { word_id: string } | undefined)?.word_id ?? null;
}
