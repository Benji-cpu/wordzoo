import { sql } from './client';
import type { Mnemonic } from '@/types/database';

// --- Aggregate Feedback Stats ---

export async function getFeedbackStats(): Promise<{
  total_feedback: number;
  total_thumbs_up: number;
  total_thumbs_down: number;
}> {
  const rows = await sql`
    SELECT
      COUNT(*)::int AS total_feedback,
      COUNT(CASE WHEN rating = 'thumbs_up' THEN 1 END)::int AS total_thumbs_up,
      COUNT(CASE WHEN rating = 'thumbs_down' THEN 1 END)::int AS total_thumbs_down
    FROM mnemonic_feedback
  `;
  return (rows[0] as { total_feedback: number; total_thumbs_up: number; total_thumbs_down: number })
    ?? { total_feedback: 0, total_thumbs_up: 0, total_thumbs_down: 0 };
}

// --- Worst Mnemonics (highest negative percentage) ---

export async function getWorstMnemonics(
  limit: number,
  offset: number
): Promise<Array<{
  id: string;
  keyword_text: string;
  scene_description: string;
  image_url: string | null;
  thumbs_up_count: number;
  thumbs_down_count: number;
  word_text: string;
  meaning_en: string;
  language_name: string;
}>> {
  const rows = await sql`
    SELECT
      m.id, m.keyword_text, m.scene_description, m.image_url,
      m.thumbs_up_count, m.thumbs_down_count,
      w.text AS word_text, w.meaning_en,
      l.name AS language_name
    FROM mnemonics m
    JOIN words w ON w.id = m.word_id
    JOIN languages l ON l.id = w.language_id
    WHERE (m.thumbs_up_count + m.thumbs_down_count) > 0
    ORDER BY (m.thumbs_down_count::float / (m.thumbs_up_count + m.thumbs_down_count) * 100) DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows as Array<{
    id: string;
    keyword_text: string;
    scene_description: string;
    image_url: string | null;
    thumbs_up_count: number;
    thumbs_down_count: number;
    word_text: string;
    meaning_en: string;
    language_name: string;
  }>;
}

// --- Best Mnemonics (highest positive percentage) ---

export async function getBestMnemonics(
  limit: number,
  offset: number
): Promise<Array<{
  id: string;
  keyword_text: string;
  scene_description: string;
  image_url: string | null;
  thumbs_up_count: number;
  thumbs_down_count: number;
  word_text: string;
  meaning_en: string;
  language_name: string;
}>> {
  const rows = await sql`
    SELECT
      m.id, m.keyword_text, m.scene_description, m.image_url,
      m.thumbs_up_count, m.thumbs_down_count,
      w.text AS word_text, w.meaning_en,
      l.name AS language_name
    FROM mnemonics m
    JOIN words w ON w.id = m.word_id
    JOIN languages l ON l.id = w.language_id
    WHERE (m.thumbs_up_count + m.thumbs_down_count) > 0
    ORDER BY (m.thumbs_up_count::float / (m.thumbs_up_count + m.thumbs_down_count) * 100) DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows as Array<{
    id: string;
    keyword_text: string;
    scene_description: string;
    image_url: string | null;
    thumbs_up_count: number;
    thumbs_down_count: number;
    word_text: string;
    meaning_en: string;
    language_name: string;
  }>;
}

// --- Feedback with Comments ---

export async function getFeedbackWithComments(
  limit: number,
  offset: number
): Promise<Array<{
  id: string;
  rating: string;
  comment: string;
  created_at: Date;
  user_email: string;
  word_text: string;
  meaning_en: string;
  mnemonic_id: string;
}>> {
  const rows = await sql`
    SELECT
      mf.id, mf.rating, mf.comment, mf.created_at,
      u.email AS user_email,
      w.text AS word_text, w.meaning_en,
      mf.mnemonic_id
    FROM mnemonic_feedback mf
    JOIN users u ON u.id = mf.user_id
    JOIN mnemonics m ON m.id = mf.mnemonic_id
    JOIN words w ON w.id = m.word_id
    WHERE mf.comment IS NOT NULL
    ORDER BY mf.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows as Array<{
    id: string;
    rating: string;
    comment: string;
    created_at: Date;
    user_email: string;
    word_text: string;
    meaning_en: string;
    mnemonic_id: string;
  }>;
}

// --- Negative Comments for a Specific Mnemonic ---

export async function getNegativeCommentsForMnemonic(
  mnemonicId: string
): Promise<string[]> {
  const rows = await sql`
    SELECT comment FROM mnemonic_feedback
    WHERE mnemonic_id = ${mnemonicId}
      AND rating = 'thumbs_down'
      AND comment IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 10
  `;
  return rows.map((r) => (r as { comment: string }).comment);
}

// --- Get Mnemonic by ID ---

export async function getMnemonicById(
  mnemonicId: string
): Promise<Mnemonic | null> {
  const rows = await sql`
    SELECT * FROM mnemonics WHERE id = ${mnemonicId}
  `;
  return (rows[0] as Mnemonic) ?? null;
}
