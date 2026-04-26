import { sql } from './client';
import type { Mnemonic, AppFeedback } from '@/types/database';

// --- Content Overview ---

export interface AdminContentOverview {
  total_paths: number;
  total_scenes: number;
  total_words: number;
  total_mnemonics: number;
  total_users: number;
}

export async function getAdminContentOverview(): Promise<AdminContentOverview> {
  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM paths) AS total_paths,
      (SELECT COUNT(*)::int FROM scenes) AS total_scenes,
      (SELECT COUNT(*)::int FROM words) AS total_words,
      (SELECT COUNT(*)::int FROM mnemonics WHERE user_id IS NULL) AS total_mnemonics,
      (SELECT COUNT(*)::int FROM users) AS total_users
  `;
  return rows[0] as AdminContentOverview;
}

// --- Path Health ---

export interface AdminPathHealth {
  id: string;
  title: string;
  type: string;
  language_name: string;
  scene_count: number;
  word_count: number;
  scenes_without_dialogues: number;
  words_without_mnemonics: number;
}

export async function getAdminPathHealth(): Promise<AdminPathHealth[]> {
  const rows = await sql`
    SELECT
      p.id, p.title, p.type,
      l.name AS language_name,
      (SELECT COUNT(*)::int FROM scenes s WHERE s.path_id = p.id) AS scene_count,
      (SELECT COUNT(DISTINCT sw.word_id)::int FROM scenes s JOIN scene_words sw ON sw.scene_id = s.id WHERE s.path_id = p.id) AS word_count,
      (SELECT COUNT(*)::int FROM scenes s WHERE s.path_id = p.id AND s.scene_type = 'dialogue' AND NOT EXISTS (SELECT 1 FROM scene_dialogues sd WHERE sd.scene_id = s.id)) AS scenes_without_dialogues,
      (SELECT COUNT(DISTINCT sw.word_id)::int FROM scenes s JOIN scene_words sw ON sw.scene_id = s.id WHERE s.path_id = p.id AND NOT EXISTS (SELECT 1 FROM mnemonics m WHERE m.word_id = sw.word_id AND m.user_id IS NULL)) AS words_without_mnemonics
    FROM paths p
    JOIN languages l ON l.id = p.language_id
    ORDER BY p.title
  `;
  return rows as AdminPathHealth[];
}

// --- User Metrics ---

export interface AdminUserMetrics {
  total_users: number;
  active_7d: number;
  active_30d: number;
  paths_started: number;
  paths_completed: number;
}

export async function getAdminUserMetrics(): Promise<AdminUserMetrics> {
  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM users) AS total_users,
      (SELECT COUNT(DISTINCT user_id)::int FROM user_words WHERE updated_at > NOW() - INTERVAL '7 days') AS active_7d,
      (SELECT COUNT(DISTINCT user_id)::int FROM user_words WHERE updated_at > NOW() - INTERVAL '30 days') AS active_30d,
      (SELECT COUNT(*)::int FROM user_paths) AS paths_started,
      (SELECT COUNT(*)::int FROM user_paths WHERE status = 'completed') AS paths_completed
  `;
  return rows[0] as AdminUserMetrics;
}

// --- Path Engagement ---

export interface AdminPathEngagement {
  path_id: string;
  path_title: string;
  enrolled: number;
  completed: number;
  avg_progress: number;
}

export async function getAdminPathEngagement(): Promise<AdminPathEngagement[]> {
  const rows = await sql`
    SELECT
      p.id AS path_id,
      p.title AS path_title,
      COUNT(DISTINCT up.user_id)::int AS enrolled,
      COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.user_id END)::int AS completed,
      COALESCE(AVG(
        CASE WHEN (SELECT COUNT(*) FROM scenes s WHERE s.path_id = p.id) > 0
        THEN (
          SELECT COUNT(*)::float * 100 / (SELECT COUNT(*) FROM scenes s2 WHERE s2.path_id = p.id)
          FROM user_scene_progress usp
          JOIN scenes s ON s.id = usp.scene_id
          WHERE s.path_id = p.id AND usp.user_id = up.user_id AND usp.completed_at IS NOT NULL
        )
        ELSE 0 END
      ), 0)::int AS avg_progress
    FROM paths p
    JOIN user_paths up ON up.path_id = p.id
    GROUP BY p.id, p.title
    ORDER BY enrolled DESC
  `;
  return rows as AdminPathEngagement[];
}

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
  bridge_sentence: string | null;
  image_url: string | null;
  thumbs_up_count: number;
  thumbs_down_count: number;
  word_text: string;
  meaning_en: string;
  language_name: string;
}>> {
  const rows = await sql`
    SELECT
      m.id, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url,
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
    bridge_sentence: string | null;
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
  bridge_sentence: string | null;
  image_url: string | null;
  thumbs_up_count: number;
  thumbs_down_count: number;
  word_text: string;
  meaning_en: string;
  language_name: string;
}>> {
  const rows = await sql`
    SELECT
      m.id, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url,
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
    bridge_sentence: string | null;
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

// --- Image Review Queries ---

export async function getUnreviewedMnemonicImages(
  limit: number,
  offset: number
): Promise<Array<{
  id: string;
  keyword_text: string;
  bridge_sentence: string | null;
  image_url: string;
  word_text: string;
  meaning_en: string;
  language_name: string;
}>> {
  const rows = await sql`
    SELECT
      m.id, m.keyword_text, m.bridge_sentence, m.image_url,
      w.text AS word_text, w.meaning_en,
      l.name AS language_name
    FROM mnemonics m
    JOIN words w ON w.id = m.word_id
    JOIN languages l ON l.id = w.language_id
    WHERE m.image_reviewed = false AND m.image_url IS NOT NULL
    ORDER BY m.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows as Array<{
    id: string;
    keyword_text: string;
    bridge_sentence: string | null;
    image_url: string;
    word_text: string;
    meaning_en: string;
    language_name: string;
  }>;
}

export async function markImageReviewed(
  mnemonicId: string,
  approved: boolean
): Promise<void> {
  if (approved) {
    await sql`
      UPDATE mnemonics SET image_reviewed = true WHERE id = ${mnemonicId}
    `;
  } else {
    await sql`
      UPDATE mnemonics SET image_reviewed = true, image_url = NULL WHERE id = ${mnemonicId}
    `;
  }
}

// --- App Feedback ---

export interface AppFeedbackWithUser extends AppFeedback {
  user_email: string;
}

export async function getAppFeedbackStats(): Promise<{
  total: number;
  new_count: number;
  reviewed_count: number;
  actioned_count: number;
  dismissed_count: number;
}> {
  const rows = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(CASE WHEN status = 'new' THEN 1 END)::int AS new_count,
      COUNT(CASE WHEN status = 'reviewed' THEN 1 END)::int AS reviewed_count,
      COUNT(CASE WHEN status = 'actioned' THEN 1 END)::int AS actioned_count,
      COUNT(CASE WHEN status = 'dismissed' THEN 1 END)::int AS dismissed_count
    FROM app_feedback
  `;
  return rows[0] as {
    total: number;
    new_count: number;
    reviewed_count: number;
    actioned_count: number;
    dismissed_count: number;
  };
}

export async function getAppFeedbackList(
  limit: number,
  offset: number,
  statusFilter?: string
): Promise<AppFeedbackWithUser[]> {
  if (statusFilter && statusFilter !== 'all') {
    const rows = await sql`
      SELECT af.*, u.email AS user_email
      FROM app_feedback af
      JOIN users u ON u.id = af.user_id
      WHERE af.status = ${statusFilter}
      ORDER BY af.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return rows as AppFeedbackWithUser[];
  }

  const rows = await sql`
    SELECT af.*, u.email AS user_email
    FROM app_feedback af
    JOIN users u ON u.id = af.user_id
    ORDER BY af.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows as AppFeedbackWithUser[];
}

export async function updateAppFeedbackStatus(
  id: string,
  status: string,
  adminNotes?: string
): Promise<AppFeedback | null> {
  const rows = await sql`
    UPDATE app_feedback
    SET status = ${status}, admin_notes = COALESCE(${adminNotes ?? null}, admin_notes)
    WHERE id = ${id}
    RETURNING *
  `;
  return (rows[0] as AppFeedback) ?? null;
}

// --- Image Coverage Stats ---

export interface ImageCoverageStats {
  mnemonics: { total: number; withImage: number; missing: number; coveragePercent: number };
  phrases: { total: number; withImage: number; missing: number; coveragePercent: number };
  phraseAudio: { total: number; withAudio: number; missing: number; coveragePercent: number };
  scenes: { total: number; withAnchorImage: number; missingAnchor: number; coveragePercent: number };
  orphanWords: { total: number; withMnemonic: number; missing: number; coveragePercent: number };
}

export async function getImageCoverageStats(): Promise<ImageCoverageStats> {
  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM mnemonics WHERE user_id IS NULL) AS mn_total,
      (SELECT COUNT(*)::int FROM mnemonics WHERE user_id IS NULL AND image_url IS NOT NULL) AS mn_with_image,
      (SELECT COUNT(*)::int FROM scene_phrases) AS ph_total,
      (SELECT COUNT(*)::int FROM scene_phrases WHERE composite_image_url IS NOT NULL) AS ph_with_image,
      (SELECT COUNT(*)::int FROM scene_phrases WHERE audio_url IS NOT NULL) AS ph_with_audio,
      (SELECT COUNT(*)::int FROM scenes) AS sc_total,
      (SELECT COUNT(*)::int FROM scenes WHERE anchor_image_url IS NOT NULL) AS sc_with_anchor,
      (SELECT COUNT(DISTINCT w.id)::int FROM words w JOIN scene_words sw ON sw.word_id = w.id) AS ow_total,
      (SELECT COUNT(DISTINCT w.id)::int FROM words w JOIN scene_words sw ON sw.word_id = w.id WHERE EXISTS (SELECT 1 FROM mnemonics m WHERE m.word_id = w.id AND m.user_id IS NULL)) AS ow_with_mn
  `;
  const r = rows[0] as {
    mn_total: number; mn_with_image: number;
    ph_total: number; ph_with_image: number; ph_with_audio: number;
    sc_total: number; sc_with_anchor: number;
    ow_total: number; ow_with_mn: number;
  };
  return {
    mnemonics: {
      total: r.mn_total,
      withImage: r.mn_with_image,
      missing: r.mn_total - r.mn_with_image,
      coveragePercent: r.mn_total > 0 ? Math.round((r.mn_with_image / r.mn_total) * 100) : 0,
    },
    phrases: {
      total: r.ph_total,
      withImage: r.ph_with_image,
      missing: r.ph_total - r.ph_with_image,
      coveragePercent: r.ph_total > 0 ? Math.round((r.ph_with_image / r.ph_total) * 100) : 0,
    },
    phraseAudio: {
      total: r.ph_total,
      withAudio: r.ph_with_audio,
      missing: r.ph_total - r.ph_with_audio,
      coveragePercent: r.ph_total > 0 ? Math.round((r.ph_with_audio / r.ph_total) * 100) : 0,
    },
    scenes: {
      total: r.sc_total,
      withAnchorImage: r.sc_with_anchor,
      missingAnchor: r.sc_total - r.sc_with_anchor,
      coveragePercent: r.sc_total > 0 ? Math.round((r.sc_with_anchor / r.sc_total) * 100) : 0,
    },
    orphanWords: {
      total: r.ow_total,
      withMnemonic: r.ow_with_mn,
      missing: r.ow_total - r.ow_with_mn,
      coveragePercent: r.ow_total > 0 ? Math.round((r.ow_with_mn / r.ow_total) * 100) : 0,
    },
  };
}

// --- Missing Images Lists ---

export interface MissingMnemonicImage {
  id: string;
  word_id: string;
  keyword_text: string;
  bridge_sentence: string | null;
  scene_description: string;
  word_text: string;
  meaning_en: string;
  scene_title: string | null;
  scene_id: string | null;
  path_title: string | null;
  path_id: string | null;
}

export async function getMissingMnemonicImages(): Promise<MissingMnemonicImage[]> {
  const rows = await sql`
    SELECT m.id, m.word_id, m.keyword_text, m.bridge_sentence, m.scene_description,
      w.text AS word_text, w.meaning_en,
      s.title AS scene_title, s.id AS scene_id,
      p.title AS path_title, p.id AS path_id
    FROM mnemonics m
    JOIN words w ON w.id = m.word_id
    LEFT JOIN scene_words sw ON sw.word_id = w.id
    LEFT JOIN scenes s ON s.id = sw.scene_id
    LEFT JOIN paths p ON p.id = s.path_id
    WHERE m.user_id IS NULL AND m.image_url IS NULL
    ORDER BY p.title, s.sort_order, w.text
  `;
  return rows as MissingMnemonicImage[];
}

export interface MissingPhraseImage {
  id: string;
  text_target: string;
  text_en: string;
  phrase_bridge_sentence: string | null;
  scene_title: string;
  scene_id: string;
  path_title: string;
  path_id: string;
}

export async function getMissingPhraseImages(): Promise<MissingPhraseImage[]> {
  const rows = await sql`
    SELECT sp.id, sp.text_target, sp.text_en, sp.phrase_bridge_sentence,
      s.title AS scene_title, s.id AS scene_id,
      p.title AS path_title, p.id AS path_id
    FROM scene_phrases sp
    JOIN scenes s ON s.id = sp.scene_id
    JOIN paths p ON p.id = s.path_id
    WHERE sp.composite_image_url IS NULL
    ORDER BY p.title, s.sort_order
  `;
  return rows as MissingPhraseImage[];
}

export interface MissingSceneAnchor {
  id: string;
  title: string;
  description: string | null;
  path_title: string;
  path_id: string;
}

export async function getMissingSceneAnchors(): Promise<MissingSceneAnchor[]> {
  const rows = await sql`
    SELECT s.id, s.title, s.description,
      p.title AS path_title, p.id AS path_id
    FROM scenes s
    JOIN paths p ON p.id = s.path_id
    WHERE s.anchor_image_url IS NULL
    ORDER BY p.title, s.sort_order
  `;
  return rows as MissingSceneAnchor[];
}

// Scene words that have no canonical mnemonic row at all — the common
// reason UI shows "Visual coming soon" isn't a null image_url on an
// existing row, it's that the row itself doesn't exist.
export interface OrphanWord {
  word_id: string;
  word_text: string;
  meaning_en: string;
  language_name: string;
  scene_title: string;
  scene_id: string;
  path_title: string;
  path_id: string;
}

export async function getOrphanWords(): Promise<OrphanWord[]> {
  const rows = await sql`
    SELECT w.id AS word_id, w.text AS word_text, w.meaning_en,
      l.name AS language_name,
      s.title AS scene_title, s.id AS scene_id, s.sort_order AS scene_sort_order,
      p.title AS path_title, p.id AS path_id
    FROM words w
    JOIN scene_words sw ON sw.word_id = w.id
    JOIN scenes s ON s.id = sw.scene_id
    JOIN paths p ON p.id = s.path_id
    JOIN languages l ON l.id = w.language_id
    WHERE NOT EXISTS (SELECT 1 FROM mnemonics m WHERE m.word_id = w.id AND m.user_id IS NULL)
    ORDER BY p.title, s.sort_order, w.text
  `;
  return rows as OrphanWord[];
}
