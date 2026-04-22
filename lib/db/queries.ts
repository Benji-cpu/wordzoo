import { sql } from './client';
import type { Word, Mnemonic, Path, Scene, SceneDialogue, Language, UserPath, TutorSession, TutorMessage, Subscription, Purchase, DailyUsage, MnemonicFeedback, LearnerProfile, TutorWordReview, TutorNudge, StudioSession, StudioIntakeData, StudioMessage, StudioPathPreview, AffixExercise, WordFamily, InfoByte } from '@/types/database';

export interface WordWithLanguage extends Word {
  language_code: string;
  language_name: string;
}

export async function getWordById(wordId: string): Promise<WordWithLanguage | null> {
  const rows = await sql`
    SELECT w.*, l.code AS language_code, l.name AS language_name
    FROM words w
    JOIN languages l ON l.id = w.language_id
    WHERE w.id = ${wordId}
  `;
  return (rows[0] as WordWithLanguage) ?? null;
}

export async function insertMnemonic(data: {
  wordId: string;
  userId: string | null;
  keywordText: string;
  sceneDescription: string;
  bridgeSentence: string | null;
  imageUrl: string | null;
  isCustom: boolean;
}): Promise<Mnemonic> {
  const rows = await sql`
    INSERT INTO mnemonics (word_id, user_id, keyword_text, scene_description, bridge_sentence, image_url, is_custom)
    VALUES (${data.wordId}, ${data.userId}, ${data.keywordText}, ${data.sceneDescription}, ${data.bridgeSentence}, ${data.imageUrl}, ${data.isCustom})
    RETURNING *
  `;
  return rows[0] as Mnemonic;
}

export async function getMnemonicsByWordId(
  wordId: string,
  userId?: string
): Promise<Mnemonic[]> {
  if (userId) {
    const rows = await sql`
      SELECT * FROM mnemonics
      WHERE word_id = ${wordId} AND (user_id = ${userId} OR user_id IS NULL)
      ORDER BY created_at DESC
    `;
    return rows as Mnemonic[];
  }
  const rows = await sql`
    SELECT * FROM mnemonics
    WHERE word_id = ${wordId}
    ORDER BY created_at DESC
  `;
  return rows as Mnemonic[];
}

export async function getExistingKeywords(
  wordId: string,
  userId: string
): Promise<string[]> {
  const rows = await sql`
    SELECT keyword_text FROM mnemonics
    WHERE word_id = ${wordId} AND (user_id = ${userId} OR user_id IS NULL)
  `;
  return rows.map((r) => (r as { keyword_text: string }).keyword_text);
}

// --- Path & Scene Queries ---

export async function getLanguageById(languageId: string): Promise<Language | null> {
  const rows = await sql`
    SELECT * FROM languages WHERE id = ${languageId}
  `;
  return (rows[0] as Language) ?? null;
}

export async function getPathsByLanguage(
  languageId: string,
  userId: string
): Promise<Path[]> {
  const rows = await sql`
    SELECT * FROM paths
    WHERE language_id = ${languageId}
      AND (type = 'premade' OR user_id = ${userId})
    ORDER BY type, created_at
  `;
  return rows as Path[];
}

export async function getPathById(pathId: string): Promise<Path | null> {
  const rows = await sql`
    SELECT * FROM paths WHERE id = ${pathId}
  `;
  return (rows[0] as Path) ?? null;
}

export async function getScenesByPathId(pathId: string): Promise<Scene[]> {
  const rows = await sql`
    SELECT * FROM scenes
    WHERE path_id = ${pathId}
    ORDER BY sort_order
  `;
  return rows as Scene[];
}

export async function getFirstSceneIdForPath(pathId: string): Promise<string | null> {
  const rows = await sql`
    SELECT id FROM scenes
    WHERE path_id = ${pathId}
    ORDER BY sort_order
    LIMIT 1
  `;
  return (rows[0] as { id: string })?.id ?? null;
}

export async function getSceneById(sceneId: string): Promise<Scene | null> {
  const rows = await sql`
    SELECT * FROM scenes WHERE id = ${sceneId}
  `;
  return (rows[0] as Scene) ?? null;
}

export interface SceneWordWithDetails {
  word_id: string;
  text: string;
  romanization: string | null;
  pronunciation_audio_url: string | null;
  meaning_en: string;
  part_of_speech: string;
  frequency_rank: number;
  informal_text: string | null;
  register: 'formal' | 'informal' | 'neutral';
  sort_order: number;
  mnemonic_id: string | null;
  keyword_text: string | null;
  scene_description: string | null;
  bridge_sentence: string | null;
  image_url: string | null;
  user_word_status: string | null;
}

export async function getSceneWordsWithDetails(
  sceneId: string,
  userId: string
): Promise<SceneWordWithDetails[]> {
  const rows = await sql`
    SELECT
      w.id AS word_id, w.text, w.romanization, w.pronunciation_audio_url,
      w.meaning_en, w.part_of_speech, w.frequency_rank,
      w.informal_text, w.register,
      sw.sort_order,
      m.id AS mnemonic_id, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url,
      uw.status AS user_word_status
    FROM scene_words sw
    JOIN words w ON w.id = sw.word_id
    LEFT JOIN user_words uw ON uw.word_id = w.id AND uw.user_id = ${userId}
    LEFT JOIN LATERAL (
      SELECT id, keyword_text, scene_description, bridge_sentence, image_url
      FROM mnemonics
      WHERE word_id = w.id
        AND (user_id IS NULL OR user_id = ${userId})
      ORDER BY
        CASE WHEN id = uw.current_mnemonic_id THEN 0 WHEN user_id = ${userId} THEN 1 ELSE 2 END,
        upvote_count DESC
      LIMIT 1
    ) m ON true
    WHERE sw.scene_id = ${sceneId}
    ORDER BY sw.sort_order
  `;
  return rows as SceneWordWithDetails[];
}

export async function getSceneWordsForLearning(
  sceneId: string,
  userId: string | null
): Promise<SceneWordWithDetails[]> {
  const rows = await sql`
    SELECT
      w.id AS word_id, w.text, w.romanization, w.pronunciation_audio_url,
      w.meaning_en, w.part_of_speech, w.frequency_rank,
      w.informal_text, w.register,
      sw.sort_order,
      m.id AS mnemonic_id, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url,
      uw.status AS user_word_status
    FROM scene_words sw
    JOIN words w ON w.id = sw.word_id
    LEFT JOIN user_words uw ON uw.word_id = w.id AND uw.user_id = ${userId}
    LEFT JOIN LATERAL (
      SELECT id, keyword_text, scene_description, bridge_sentence, image_url
      FROM mnemonics
      WHERE word_id = w.id
        AND (user_id IS NULL OR user_id = ${userId})
      ORDER BY
        CASE WHEN user_id = ${userId} THEN 0 ELSE 1 END,
        upvote_count DESC
      LIMIT 1
    ) m ON true
    WHERE sw.scene_id = ${sceneId}
    ORDER BY sw.sort_order
  `;
  return rows as SceneWordWithDetails[];
}

export async function getSceneWithLanguage(sceneId: string): Promise<{
  scene_id: string;
  scene_title: string;
  scene_description: string | null;
  scene_type: 'legacy' | 'dialogue';
  scene_context: string | null;
  anchor_image_url: string | null;
  sort_order: number;
  path_id: string;
  language_name: string;
  language_id: string;
  language_code: string;
} | null> {
  const rows = await sql`
    SELECT s.id AS scene_id, s.title AS scene_title, s.description AS scene_description,
      s.scene_type, s.scene_context, s.anchor_image_url, s.sort_order,
      s.path_id, l.name AS language_name, l.id AS language_id, l.code AS language_code
    FROM scenes s
    JOIN paths p ON p.id = s.path_id
    JOIN languages l ON l.id = p.language_id
    WHERE s.id = ${sceneId}
  `;
  return (rows[0] as { scene_id: string; scene_title: string; scene_description: string | null; scene_type: 'legacy' | 'dialogue'; scene_context: string | null; anchor_image_url: string | null; sort_order: number; path_id: string; language_name: string; language_id: string; language_code: string }) ?? null;
}

export async function getNextSceneInPath(
  pathId: string,
  currentSortOrder: number
): Promise<{ id: string; title: string; description: string | null } | null> {
  const rows = await sql`
    SELECT id, title, description FROM scenes
    WHERE path_id = ${pathId} AND sort_order > ${currentSortOrder}
    ORDER BY sort_order
    LIMIT 1
  `;
  return (rows[0] as { id: string; title: string; description: string | null }) ?? null;
}

export async function getDistractorsForWord(
  wordId: string,
  languageId: string,
  correctMeaning: string,
  count: number = 3
): Promise<string[]> {
  const rows = await sql`
    SELECT meaning_en FROM words
    WHERE language_id = ${languageId}
      AND id != ${wordId}
      AND meaning_en != ${correctMeaning}
    GROUP BY meaning_en
    ORDER BY RANDOM()
    LIMIT ${count}
  `;
  return rows.map((r) => (r as { meaning_en: string }).meaning_en);
}

export interface SceneMasteryRow {
  id: string;
  sort_order: number;
  title: string;
  description: string | null;
  scene_type: 'legacy' | 'dialogue';
  anchor_image_url: string | null;
  total_words: number;
  mastered_words: number;
  current_phase: string | null;
  scene_completed: boolean;
}

export async function getSceneMasteryForPath(
  userId: string,
  pathId: string
): Promise<SceneMasteryRow[]> {
  const rows = await sql`
    SELECT s.id, s.sort_order, s.title, s.description, s.scene_type, s.anchor_image_url,
      COUNT(DISTINCT sw.word_id)::int AS total_words,
      COUNT(DISTINCT CASE WHEN uw.status IN ('reviewing', 'mastered') THEN sw.word_id END)::int AS mastered_words,
      usp.current_phase,
      COALESCE(usp.completed_at IS NOT NULL, false) AS scene_completed
    FROM scenes s
    LEFT JOIN scene_words sw ON sw.scene_id = s.id
    LEFT JOIN user_words uw ON uw.word_id = sw.word_id AND uw.user_id = ${userId}
    LEFT JOIN user_scene_progress usp ON usp.scene_id = s.id AND usp.user_id = ${userId}
    WHERE s.path_id = ${pathId}
    GROUP BY s.id, s.sort_order, s.title, s.description, s.scene_type, s.anchor_image_url, usp.current_phase, usp.completed_at
    ORDER BY s.sort_order
  `;
  return rows as SceneMasteryRow[];
}

export async function getUserActivePath(
  userId: string
): Promise<(UserPath & { path_title: string; path_language_id: string; path_type: string }) | null> {
  const rows = await sql`
    SELECT up.*, p.title AS path_title, p.language_id AS path_language_id, p.type AS path_type
    FROM user_paths up
    JOIN paths p ON p.id = up.path_id
    WHERE up.user_id = ${userId} AND up.status = 'active'
    ORDER BY up.started_at DESC
    LIMIT 1
  `;
  return (rows[0] as (UserPath & { path_title: string; path_language_id: string; path_type: string })) ?? null;
}

export async function upsertUserPath(
  userId: string,
  pathId: string,
  status: 'active' | 'completed' | 'abandoned'
): Promise<UserPath> {
  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  const rows = await sql`
    INSERT INTO user_paths (user_id, path_id, status, completed_at)
    VALUES (${userId}, ${pathId}, ${status}, ${completedAt})
    ON CONFLICT (user_id, path_id)
    DO UPDATE SET status = ${status}, completed_at = ${completedAt}
    RETURNING *
  `;
  return rows[0] as UserPath;
}

export interface OverdueWordRow {
  word_id: string;
  text: string;
  romanization: string | null;
  pronunciation_audio_url: string | null;
  meaning_en: string;
  part_of_speech: string;
  mnemonic_id: string | null;
  keyword_text: string | null;
  scene_description: string | null;
  bridge_sentence: string | null;
  image_url: string | null;
  user_word_status: string;
  next_review_at: Date;
}

export async function getOverdueWordsForPreviousScenes(
  userId: string,
  pathId: string,
  currentSortOrder: number,
  limit: number
): Promise<OverdueWordRow[]> {
  const rows = await sql`
    SELECT DISTINCT ON (uw.word_id)
      uw.word_id, w.text, w.romanization, w.pronunciation_audio_url,
      w.meaning_en, w.part_of_speech,
      m.id AS mnemonic_id, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url,
      uw.status AS user_word_status, uw.next_review_at
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    JOIN scene_words sw ON sw.word_id = uw.word_id
    JOIN scenes s ON s.id = sw.scene_id
    LEFT JOIN LATERAL (
      SELECT id, keyword_text, scene_description, bridge_sentence, image_url
      FROM mnemonics
      WHERE word_id = w.id
        AND (user_id IS NULL OR user_id = ${userId})
      ORDER BY
        CASE WHEN id = uw.current_mnemonic_id THEN 0 WHEN user_id = ${userId} THEN 1 ELSE 2 END,
        upvote_count DESC
      LIMIT 1
    ) m ON true
    WHERE uw.user_id = ${userId} AND s.path_id = ${pathId}
      AND s.sort_order < ${currentSortOrder} AND uw.next_review_at <= NOW()
    ORDER BY uw.word_id, s.sort_order ASC, uw.next_review_at ASC
    LIMIT ${limit}
  `;
  return rows as OverdueWordRow[];
}

export interface PathWordStats {
  total_words: number;
  words_learned: number;
  words_mastered: number;
}

export async function getPathWordStats(
  userId: string,
  pathId: string
): Promise<PathWordStats> {
  const rows = await sql`
    SELECT
      COUNT(DISTINCT pw.word_id)::int AS total_words,
      COUNT(DISTINCT CASE WHEN uw.status IN ('learning', 'reviewing', 'mastered') THEN pw.word_id END)::int AS words_learned,
      COUNT(DISTINCT CASE WHEN uw.status = 'mastered' THEN pw.word_id END)::int AS words_mastered
    FROM path_words pw
    LEFT JOIN user_words uw ON uw.word_id = pw.word_id AND uw.user_id = ${userId}
    WHERE pw.path_id = ${pathId}
  `;
  return (rows[0] as PathWordStats) ?? { total_words: 0, words_learned: 0, words_mastered: 0 };
}

export async function insertPath(data: {
  languageId: string;
  userId: string | null;
  type: 'premade' | 'custom' | 'travel' | 'studio';
  title: string;
  description: string | null;
}): Promise<Path> {
  const rows = await sql`
    INSERT INTO paths (language_id, user_id, type, title, description)
    VALUES (${data.languageId}, ${data.userId}, ${data.type}, ${data.title}, ${data.description})
    RETURNING *
  `;
  return rows[0] as Path;
}

export async function insertScene(data: {
  pathId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  sceneType?: 'legacy' | 'dialogue';
  sceneContext?: string | null;
}): Promise<Scene> {
  const rows = await sql`
    INSERT INTO scenes (path_id, title, description, sort_order, scene_type, scene_context)
    VALUES (${data.pathId}, ${data.title}, ${data.description}, ${data.sortOrder}, ${data.sceneType ?? 'legacy'}, ${data.sceneContext ?? null})
    RETURNING *
  `;
  return rows[0] as Scene;
}

export async function insertSceneWord(
  sceneId: string,
  wordId: string,
  sortOrder: number
): Promise<void> {
  await sql`
    INSERT INTO scene_words (scene_id, word_id, sort_order)
    VALUES (${sceneId}, ${wordId}, ${sortOrder})
    ON CONFLICT (scene_id, word_id) DO NOTHING
  `;
}

export async function insertPathWord(
  pathId: string,
  wordId: string,
  sortOrder: number
): Promise<void> {
  await sql`
    INSERT INTO path_words (path_id, word_id, sort_order)
    VALUES (${pathId}, ${wordId}, ${sortOrder})
    ON CONFLICT (path_id, word_id) DO NOTHING
  `;
}

export async function insertWord(data: {
  languageId: string;
  text: string;
  romanization: string | null;
  meaningEn: string;
  partOfSpeech: string;
}): Promise<Word> {
  const rows = await sql`
    INSERT INTO words (language_id, text, romanization, meaning_en, part_of_speech)
    VALUES (${data.languageId}, ${data.text}, ${data.romanization}, ${data.meaningEn}, ${data.partOfSpeech})
    RETURNING *
  `;
  return rows[0] as Word;
}

export async function findWordByTextAndLanguage(
  text: string,
  languageId: string
): Promise<Word | null> {
  const rows = await sql`
    SELECT * FROM words
    WHERE text = ${text} AND language_id = ${languageId}
    LIMIT 1
  `;
  return (rows[0] as Word) ?? null;
}

export async function getRandomPathWordsForQuiz(
  pathId: string,
  limit: number
): Promise<Word[]> {
  const rows = await sql`
    SELECT w.* FROM path_words pw
    JOIN words w ON w.id = pw.word_id
    WHERE pw.path_id = ${pathId}
    ORDER BY RANDOM()
    LIMIT ${limit}
  `;
  return rows as Word[];
}

export async function verifyPathAccess(pathId: string, userId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM paths
    WHERE id = ${pathId} AND (type = 'premade' OR user_id = ${userId})
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function verifySceneAccess(sceneId: string, userId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM scenes s
    JOIN paths p ON p.id = s.path_id
    WHERE s.id = ${sceneId} AND (p.type = 'premade' OR p.user_id = ${userId})
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function getSceneCountForPath(pathId: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM scenes WHERE path_id = ${pathId}
  `;
  return (rows[0] as { count: number }).count;
}

export async function getSceneNumberInPath(sceneId: string, pathId: string): Promise<{ sceneNumber: number; totalScenes: number }> {
  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM scenes WHERE path_id = ${pathId} AND sort_order <= s.sort_order) AS scene_number,
      (SELECT COUNT(*)::int FROM scenes WHERE path_id = ${pathId}) AS total_scenes
    FROM scenes s
    WHERE s.id = ${sceneId}
  `;
  if (!rows[0]) return { sceneNumber: 0, totalScenes: 0 };
  return rows[0] as { sceneNumber: number; totalScenes: number };
}

// --- Tutor Queries ---

export async function insertTutorSession(
  userId: string,
  languageId: string,
  mode: string,
  scenario?: string
): Promise<TutorSession> {
  const rows = await sql`
    INSERT INTO tutor_sessions (user_id, language_id, mode, scenario)
    VALUES (${userId}, ${languageId}, ${mode}, ${scenario ?? null})
    RETURNING *
  `;
  return rows[0] as TutorSession;
}

export async function getTutorSessionById(sessionId: string): Promise<TutorSession | null> {
  const rows = await sql`
    SELECT * FROM tutor_sessions WHERE id = ${sessionId}
  `;
  return (rows[0] as TutorSession) ?? null;
}

export interface LastTutorSessionRow {
  id: string;
  mode: string;
  scenario: string | null;
  started_at: Date;
  ended_at: Date;
}

export async function getActiveTutorSession(
  userId: string,
  languageId: string
): Promise<TutorSession | null> {
  const rows = await sql`
    SELECT * FROM tutor_sessions
    WHERE user_id = ${userId}
      AND language_id = ${languageId}
      AND ended_at IS NULL
    ORDER BY started_at DESC
    LIMIT 1
  `;
  return (rows[0] as TutorSession) ?? null;
}

export async function getLastTutorSession(
  userId: string,
  languageId: string
): Promise<LastTutorSessionRow | null> {
  const rows = await sql`
    SELECT id, mode, scenario, started_at, ended_at
    FROM tutor_sessions
    WHERE user_id = ${userId}
      AND language_id = ${languageId}
      AND ended_at IS NOT NULL
    ORDER BY ended_at DESC
    LIMIT 1
  `;
  return (rows[0] as LastTutorSessionRow) ?? null;
}

export async function getLastGuidedSessionForScene(
  userId: string,
  sceneId: string
): Promise<TutorSession | null> {
  const rows = await sql`
    SELECT * FROM tutor_sessions
    WHERE user_id = ${userId}
      AND scene_id = ${sceneId}
      AND mode = 'guided_conversation'
    ORDER BY started_at DESC
    LIMIT 1
  `;
  return (rows[0] as TutorSession) ?? null;
}

export async function updateTutorSession(
  sessionId: string,
  updates: { endedAt?: string; summary?: Record<string, unknown>; tokensUsed?: number }
): Promise<void> {
  if (updates.endedAt !== undefined) {
    await sql`UPDATE tutor_sessions SET ended_at = ${updates.endedAt} WHERE id = ${sessionId}`;
  }
  if (updates.summary !== undefined) {
    await sql`UPDATE tutor_sessions SET summary = ${JSON.stringify(updates.summary)} WHERE id = ${sessionId}`;
  }
  if (updates.tokensUsed !== undefined) {
    await sql`UPDATE tutor_sessions SET tokens_used = tokens_used + ${updates.tokensUsed} WHERE id = ${sessionId}`;
  }
}

export async function insertTutorMessage(
  sessionId: string,
  role: 'user' | 'model',
  content: string
): Promise<TutorMessage> {
  const rows = await sql`
    INSERT INTO tutor_messages (session_id, role, content)
    VALUES (${sessionId}, ${role}, ${content})
    RETURNING *
  `;
  return rows[0] as TutorMessage;
}

export async function getTutorMessages(
  sessionId: string,
  limit: number = 20
): Promise<TutorMessage[]> {
  const rows = await sql`
    SELECT * FROM tutor_messages
    WHERE session_id = ${sessionId}
    ORDER BY created_at ASC
    LIMIT ${limit}
  `;
  return rows as TutorMessage[];
}

export interface KnownWordRow {
  word_id: string;
  text: string;
  romanization: string | null;
  meaning_en: string;
}

export async function getUserKnownWords(
  userId: string,
  languageId: string,
  limit: number = 100
): Promise<KnownWordRow[]> {
  const rows = await sql`
    SELECT w.id AS word_id, w.text, w.romanization, w.meaning_en
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    WHERE uw.user_id = ${userId} AND w.language_id = ${languageId}
      AND uw.status IN ('learning', 'reviewing', 'mastered')
    ORDER BY uw.times_reviewed DESC
    LIMIT ${limit}
  `;
  return rows as KnownWordRow[];
}

export async function getUserDueWords(
  userId: string,
  languageId: string,
  limit: number = 20
): Promise<KnownWordRow[]> {
  const rows = await sql`
    SELECT w.id AS word_id, w.text, w.romanization, w.meaning_en
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    WHERE uw.user_id = ${userId} AND w.language_id = ${languageId}
      AND uw.next_review_at <= NOW()
    ORDER BY uw.next_review_at ASC
    LIMIT ${limit}
  `;
  return rows as KnownWordRow[];
}

export interface VocabWithMnemonic {
  word_id: string;
  text: string;
  romanization: string | null;
  meaning_en: string;
  pronunciation_audio_url: string | null;
  keyword_text: string | null;
  scene_description: string | null;
  bridge_sentence: string | null;
  image_url: string | null;
}

export async function getUserVocabWithMnemonics(
  userId: string,
  languageId: string
): Promise<VocabWithMnemonic[]> {
  const rows = await sql`
    SELECT w.id AS word_id, w.text, w.romanization, w.meaning_en,
      w.pronunciation_audio_url, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    LEFT JOIN LATERAL (
      SELECT keyword_text, scene_description, bridge_sentence, image_url
      FROM mnemonics
      WHERE word_id = w.id
        AND (user_id IS NULL OR user_id = ${userId})
      ORDER BY
        CASE WHEN id = uw.current_mnemonic_id THEN 0 WHEN user_id = ${userId} THEN 1 ELSE 2 END,
        upvote_count DESC
      LIMIT 1
    ) m ON true
    WHERE uw.user_id = ${userId} AND w.language_id = ${languageId}
      AND uw.status IN ('learning', 'reviewing', 'mastered')
    ORDER BY uw.times_reviewed DESC
  `;
  return rows as VocabWithMnemonic[];
}

// --- Billing Queries ---

export async function getUserById(userId: string): Promise<{ id: string; email: string; subscription_tier: string } | null> {
  const rows = await sql`
    SELECT id, email, subscription_tier FROM users WHERE id = ${userId}
  `;
  return (rows[0] as { id: string; email: string; subscription_tier: string }) ?? null;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  native_language: string;
  subscription_tier: string;
  preferences: Record<string, unknown>;
  created_at: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const rows = await sql`
    SELECT id, name, email, image, native_language, subscription_tier, preferences, created_at
    FROM users WHERE id = ${userId}
  `;
  return (rows[0] as UserProfile) ?? null;
}

export async function updateUserNativeLanguage(userId: string, nativeLanguage: string): Promise<void> {
  await sql`
    UPDATE users SET native_language = ${nativeLanguage}, updated_at = NOW() WHERE id = ${userId}
  `;
}

export async function updateUserPreferences(
  userId: string,
  preferences: Record<string, unknown>
): Promise<void> {
  await sql`
    UPDATE users
    SET preferences = preferences || ${JSON.stringify(preferences)}::jsonb,
        updated_at = NOW()
    WHERE id = ${userId}
  `;
}

export async function deleteUserCascade(userId: string): Promise<void> {
  // All related tables use ON DELETE CASCADE, so a single delete removes everything.
  await sql`DELETE FROM users WHERE id = ${userId}`;
}

export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  const rows = await sql`
    SELECT * FROM subscriptions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1
  `;
  return (rows[0] as Subscription) ?? null;
}

export async function getSubscriptionByStripeSubId(stripeSubId: string): Promise<Subscription | null> {
  const rows = await sql`
    SELECT * FROM subscriptions WHERE stripe_subscription_id = ${stripeSubId}
  `;
  return (rows[0] as Subscription) ?? null;
}

export async function upsertSubscription(data: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
}): Promise<Subscription> {
  const rows = await sql`
    INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end)
    VALUES (${data.userId}, ${data.stripeCustomerId}, ${data.stripeSubscriptionId}, ${data.plan}, ${data.status}, ${data.currentPeriodEnd})
    ON CONFLICT (stripe_subscription_id)
    DO UPDATE SET plan = ${data.plan}, status = ${data.status}, current_period_end = ${data.currentPeriodEnd}
    RETURNING *
  `;
  return rows[0] as Subscription;
}

export async function updateSubscriptionStatus(stripeSubId: string, status: string): Promise<void> {
  await sql`
    UPDATE subscriptions SET status = ${status} WHERE stripe_subscription_id = ${stripeSubId}
  `;
}

export async function updateUserSubscriptionTier(userId: string, tier: string): Promise<void> {
  await sql`
    UPDATE users SET subscription_tier = ${tier}, updated_at = NOW() WHERE id = ${userId}
  `;
}

export async function insertPurchase(data: {
  userId: string;
  packId: string;
  stripePaymentId: string;
}): Promise<Purchase> {
  const rows = await sql`
    INSERT INTO purchases (user_id, pack_id, stripe_payment_id)
    VALUES (${data.userId}, ${data.packId}, ${data.stripePaymentId})
    RETURNING *
  `;
  return rows[0] as Purchase;
}

export async function getUserPurchases(userId: string): Promise<Purchase[]> {
  const rows = await sql`
    SELECT * FROM purchases WHERE user_id = ${userId} ORDER BY purchased_at DESC
  `;
  return rows as Purchase[];
}

export async function hasPurchasedPack(userId: string, packId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM purchases WHERE user_id = ${userId} AND pack_id = ${packId} LIMIT 1
  `;
  return rows.length > 0;
}

// ---- Studio Path Purchases ----

export interface StudioPathPurchase {
  id: string;
  user_id: string;
  stripe_session_id: string;
  studio_session_id: string | null;
  stripe_payment_id: string | null;
  path_id: string | null;
  created_at: string;
  consumed_at: string | null;
}

export async function insertStudioPathPurchase(data: {
  userId: string;
  stripeSessionId: string;
  studioSessionId: string | null;
  stripePaymentId: string | null;
}): Promise<StudioPathPurchase> {
  const rows = await sql`
    INSERT INTO studio_path_purchases (user_id, stripe_session_id, studio_session_id, stripe_payment_id)
    VALUES (${data.userId}, ${data.stripeSessionId}, ${data.studioSessionId}, ${data.stripePaymentId})
    ON CONFLICT (stripe_session_id) DO NOTHING
    RETURNING *
  `;
  if (rows.length === 0) {
    const existing = await sql`
      SELECT * FROM studio_path_purchases WHERE stripe_session_id = ${data.stripeSessionId}
    `;
    return existing[0] as StudioPathPurchase;
  }
  return rows[0] as StudioPathPurchase;
}

export async function getStudioPathPurchaseBySessionId(
  stripeSessionId: string
): Promise<StudioPathPurchase | null> {
  const rows = await sql`
    SELECT * FROM studio_path_purchases WHERE stripe_session_id = ${stripeSessionId}
  `;
  return (rows[0] as StudioPathPurchase) ?? null;
}

export async function getUnconsumedStudioPathPurchase(
  userId: string,
  studioSessionId?: string
): Promise<StudioPathPurchase | null> {
  const rows = studioSessionId
    ? await sql`
        SELECT * FROM studio_path_purchases
        WHERE user_id = ${userId}
          AND consumed_at IS NULL
          AND (studio_session_id = ${studioSessionId} OR studio_session_id IS NULL)
        ORDER BY created_at DESC
        LIMIT 1
      `
    : await sql`
        SELECT * FROM studio_path_purchases
        WHERE user_id = ${userId} AND consumed_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1
      `;
  return (rows[0] as StudioPathPurchase) ?? null;
}

export async function consumeStudioPathPurchase(
  purchaseId: string,
  pathId: string
): Promise<void> {
  await sql`
    UPDATE studio_path_purchases
    SET path_id = ${pathId}, consumed_at = NOW()
    WHERE id = ${purchaseId} AND consumed_at IS NULL
  `;
}

export async function isWebhookEventProcessed(stripeEventId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM webhook_events WHERE stripe_event_id = ${stripeEventId} LIMIT 1
  `;
  return rows.length > 0;
}

export async function recordWebhookEvent(stripeEventId: string, eventType: string): Promise<boolean> {
  const rows = await sql`
    INSERT INTO webhook_events (stripe_event_id, event_type)
    VALUES (${stripeEventId}, ${eventType})
    ON CONFLICT (stripe_event_id) DO NOTHING
    RETURNING id
  `;
  return rows.length > 0;
}

export async function getDailyUsage(userId: string, date: string): Promise<DailyUsage | null> {
  const rows = await sql`
    SELECT * FROM daily_usage WHERE user_id = ${userId} AND date = ${date}
  `;
  return (rows[0] as DailyUsage) ?? null;
}

export async function incrementDailyUsageWordsLearned(userId: string, date: string, amount: number): Promise<void> {
  await sql`
    INSERT INTO daily_usage (user_id, date, words_learned)
    VALUES (${userId}, ${date}, ${amount})
    ON CONFLICT (user_id, date)
    DO UPDATE SET words_learned = daily_usage.words_learned + ${amount}
  `;
}

export async function incrementDailyUsageTutorMessages(userId: string, date: string, amount: number): Promise<void> {
  await sql`
    INSERT INTO daily_usage (user_id, date, tutor_messages)
    VALUES (${userId}, ${date}, ${amount})
    ON CONFLICT (user_id, date)
    DO UPDATE SET tutor_messages = daily_usage.tutor_messages + ${amount}
  `;
}

export async function incrementDailyUsageHandsFreeSeconds(userId: string, date: string, amount: number): Promise<void> {
  await sql`
    INSERT INTO daily_usage (user_id, date, hands_free_seconds)
    VALUES (${userId}, ${date}, ${amount})
    ON CONFLICT (user_id, date)
    DO UPDATE SET hands_free_seconds = daily_usage.hands_free_seconds + ${amount}
  `;
}

export async function incrementDailyUsageRegenerations(userId: string, date: string, amount: number): Promise<void> {
  await sql`
    INSERT INTO daily_usage (user_id, date, regenerations)
    VALUES (${userId}, ${date}, ${amount})
    ON CONFLICT (user_id, date)
    DO UPDATE SET regenerations = daily_usage.regenerations + ${amount}
  `;
}

export async function incrementDailyUsageScenesCompleted(userId: string, date: string, amount: number): Promise<void> {
  await sql`
    INSERT INTO daily_usage (user_id, date, scenes_completed)
    VALUES (${userId}, ${date}, ${amount})
    ON CONFLICT (user_id, date)
    DO UPDATE SET scenes_completed = daily_usage.scenes_completed + ${amount}
  `;
}

export async function getDailyLearningStats(userId: string, date: string): Promise<{ words_learned: number; scenes_completed: number }> {
  const rows = await sql`
    SELECT words_learned, scenes_completed FROM daily_usage
    WHERE user_id = ${userId} AND date = ${date}
  `;
  if (rows.length === 0) return { words_learned: 0, scenes_completed: 0 };
  const row = rows[0] as { words_learned: number; scenes_completed: number };
  return { words_learned: row.words_learned, scenes_completed: row.scenes_completed };
}

export async function insertStudioSession(data: {
  userId: string;
  languageId: string;
}): Promise<StudioSession> {
  const rows = await sql`
    INSERT INTO studio_sessions (user_id, language_id)
    VALUES (${data.userId}, ${data.languageId})
    RETURNING *
  `;
  return rows[0] as StudioSession;
}

export async function getStudioSessionById(id: string): Promise<StudioSession | null> {
  const rows = await sql`
    SELECT * FROM studio_sessions WHERE id = ${id}
  `;
  return (rows[0] as StudioSession) ?? null;
}

export async function updateStudioSession(
  id: string,
  data: {
    intakeData?: StudioIntakeData;
    messages?: StudioMessage[];
    pathPreview?: StudioPathPreview | null;
    status?: 'active' | 'completed' | 'abandoned';
    pathId?: string | null;
  }
): Promise<StudioSession> {
  const rows = await sql`
    UPDATE studio_sessions SET
      intake_data = COALESCE(${data.intakeData ? JSON.stringify(data.intakeData) : null}::jsonb, intake_data),
      messages = COALESCE(${data.messages ? JSON.stringify(data.messages) : null}::jsonb, messages),
      path_preview = COALESCE(${data.pathPreview !== undefined ? JSON.stringify(data.pathPreview) : null}::jsonb, path_preview),
      status = COALESCE(${data.status ?? null}, status),
      path_id = COALESCE(${data.pathId ?? null}, path_id),
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] as StudioSession;
}

export async function getActiveStudioSession(userId: string, languageId: string): Promise<StudioSession | null> {
  const rows = await sql`
    SELECT * FROM studio_sessions
    WHERE user_id = ${userId} AND language_id = ${languageId} AND status = 'active'
    ORDER BY created_at DESC LIMIT 1
  `;
  return (rows[0] as StudioSession) ?? null;
}

export async function insertSceneDialogue(data: {
  sceneId: string;
  speaker: string;
  textTarget: string;
  textEn: string;
  sortOrder: number;
}): Promise<SceneDialogue> {
  const rows = await sql`
    INSERT INTO scene_dialogues (scene_id, speaker, text_target, text_en, sort_order)
    VALUES (${data.sceneId}, ${data.speaker}, ${data.textTarget}, ${data.textEn}, ${data.sortOrder})
    RETURNING *
  `;
  return rows[0] as SceneDialogue;
}

export async function resetAllDailyUsage(): Promise<void> {
  await sql`
    DELETE FROM daily_usage WHERE date < CURRENT_DATE
  `;
}

export interface PremadePathRow {
  id: string;
  language_id: string;
  type: string;
  title: string;
  description: string | null;
  language_name: string;
  word_count: number;
}

export async function getAllPremadePaths(): Promise<PremadePathRow[]> {
  const rows = await sql`
    SELECT p.id, p.language_id, p.type, p.title, p.description,
      l.name AS language_name,
      COUNT(DISTINCT pw.word_id)::int AS word_count
    FROM paths p
    JOIN languages l ON l.id = p.language_id
    LEFT JOIN path_words pw ON pw.path_id = p.id
    WHERE p.type = 'premade'
    GROUP BY p.id, p.language_id, p.type, p.title, p.description, l.name
    ORDER BY p.created_at
  `;
  return rows as PremadePathRow[];
}

export async function getAllLanguages(): Promise<Language[]> {
  const rows = await sql`
    SELECT * FROM languages ORDER BY name
  `;
  return rows as Language[];
}

export async function getPremadePathByLanguageCode(languageCode: string): Promise<Path | null> {
  const rows = await sql`
    SELECT p.* FROM paths p
    JOIN languages l ON l.id = p.language_id
    WHERE l.code = ${languageCode} AND p.type = 'premade'
    LIMIT 1
  `;
  return (rows[0] as Path) ?? null;
}

export async function getExpiringSubscriptions(): Promise<Subscription[]> {
  const rows = await sql`
    SELECT * FROM subscriptions
    WHERE status = 'active' AND current_period_end < NOW()
  `;
  return rows as Subscription[];
}

// --- Mnemonic Feedback Queries ---

export async function upsertMnemonicFeedback(
  userId: string,
  mnemonicId: string,
  rating: 'thumbs_up' | 'thumbs_down',
  comment?: string
): Promise<MnemonicFeedback> {
  const rows = await sql`
    WITH old_feedback AS (
      SELECT rating FROM mnemonic_feedback
      WHERE user_id = ${userId} AND mnemonic_id = ${mnemonicId}
    ),
    upsert AS (
      INSERT INTO mnemonic_feedback (user_id, mnemonic_id, rating, comment)
      VALUES (${userId}, ${mnemonicId}, ${rating}, ${comment ?? null})
      ON CONFLICT (user_id, mnemonic_id)
      DO UPDATE SET rating = ${rating}, comment = ${comment ?? null}, updated_at = NOW()
      RETURNING *
    ),
    update_counters AS (
      UPDATE mnemonics SET
        thumbs_up_count = GREATEST(thumbs_up_count
          + CASE WHEN ${rating} = 'thumbs_up' AND (SELECT rating FROM old_feedback) IS DISTINCT FROM ${rating} THEN 1 ELSE 0 END
          - CASE WHEN (SELECT rating FROM old_feedback) = 'thumbs_up' AND (SELECT rating FROM old_feedback) IS DISTINCT FROM ${rating} THEN 1 ELSE 0 END, 0),
        thumbs_down_count = GREATEST(thumbs_down_count
          + CASE WHEN ${rating} = 'thumbs_down' AND (SELECT rating FROM old_feedback) IS DISTINCT FROM ${rating} THEN 1 ELSE 0 END
          - CASE WHEN (SELECT rating FROM old_feedback) = 'thumbs_down' AND (SELECT rating FROM old_feedback) IS DISTINCT FROM ${rating} THEN 1 ELSE 0 END, 0)
      WHERE id = ${mnemonicId}
        AND (SELECT rating FROM old_feedback) IS DISTINCT FROM ${rating}
    )
    SELECT * FROM upsert
  `;
  return rows[0] as MnemonicFeedback;
}

// --- SRS Review Queries ---

export interface DueWordForReview {
  word_id: string;
  text: string;
  romanization: string | null;
  pronunciation_audio_url: string | null;
  meaning_en: string;
  part_of_speech: string;
  language_id: string;
  frequency_rank: number;
  informal_text: string | null;
  register: 'formal' | 'informal' | 'neutral';
  mnemonic_id: string | null;
  keyword_text: string | null;
  scene_description: string | null;
  bridge_sentence: string | null;
  image_url: string | null;
  user_word_id: string;
  status: string;
  ease_factor: number;
  interval_days: number;
  times_reviewed: number;
  times_correct: number;
  direction: string;
}

export async function getDueWordsForReview(
  userId: string,
  limit: number = 20
): Promise<DueWordForReview[]> {
  const rows = await sql`
    SELECT
      w.id AS word_id, w.text, w.romanization, w.pronunciation_audio_url,
      w.meaning_en, w.part_of_speech, w.language_id, w.frequency_rank,
      w.informal_text, w.register,
      m.id AS mnemonic_id, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url,
      uw.id AS user_word_id, uw.status, uw.ease_factor, uw.interval_days,
      uw.times_reviewed, uw.times_correct, uw.direction
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    LEFT JOIN LATERAL (
      SELECT id, keyword_text, scene_description, bridge_sentence, image_url
      FROM mnemonics
      WHERE word_id = w.id
        AND (user_id IS NULL OR user_id = ${userId})
      ORDER BY
        CASE WHEN id = uw.current_mnemonic_id THEN 0 WHEN user_id = ${userId} THEN 1 ELSE 2 END,
        upvote_count DESC
      LIMIT 1
    ) m ON true
    WHERE uw.user_id = ${userId}
      AND uw.next_review_at <= NOW()
      AND uw.status != 'new'
    ORDER BY uw.next_review_at ASC
    LIMIT ${limit}
  `;
  return rows as DueWordForReview[];
}

export async function getAllLearnedWordsForPractice(
  userId: string,
  limit: number = 50
): Promise<DueWordForReview[]> {
  const rows = await sql`
    SELECT
      w.id AS word_id, w.text, w.romanization, w.pronunciation_audio_url,
      w.meaning_en, w.part_of_speech, w.language_id, w.frequency_rank,
      w.informal_text, w.register,
      m.id AS mnemonic_id, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url,
      uw.id AS user_word_id, uw.status, uw.ease_factor, uw.interval_days,
      uw.times_reviewed, uw.times_correct, uw.direction
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    LEFT JOIN LATERAL (
      SELECT id, keyword_text, scene_description, bridge_sentence, image_url
      FROM mnemonics
      WHERE word_id = w.id
        AND (user_id IS NULL OR user_id = ${userId})
      ORDER BY
        CASE WHEN id = uw.current_mnemonic_id THEN 0 WHEN user_id = ${userId} THEN 1 ELSE 2 END,
        upvote_count DESC
      LIMIT 1
    ) m ON true
    WHERE uw.user_id = ${userId}
      AND uw.status != 'new'
    ORDER BY uw.last_reviewed_at ASC NULLS FIRST
    LIMIT ${limit}
  `;
  return rows as DueWordForReview[];
}

export async function updateWordSRS(
  userWordId: string,
  data: {
    easeFactor: number;
    intervalDays: number;
    nextReviewAt: Date;
    timesReviewed: number;
    timesCorrect: number;
    status: string;
    direction: string;
    lastReviewedAt: Date;
  }
): Promise<void> {
  await sql`
    UPDATE user_words SET
      ease_factor = ${data.easeFactor},
      interval_days = ${data.intervalDays},
      next_review_at = ${data.nextReviewAt.toISOString()},
      times_reviewed = ${data.timesReviewed},
      times_correct = ${data.timesCorrect},
      status = ${data.status},
      direction = ${data.direction},
      last_reviewed_at = ${data.lastReviewedAt.toISOString()},
      updated_at = NOW()
    WHERE id = ${userWordId}
  `;
}

export async function getUserWord(
  userId: string,
  wordId: string
): Promise<{ times_reviewed: number } | null> {
  const rows = await sql`
    SELECT times_reviewed FROM user_words
    WHERE user_id = ${userId} AND word_id = ${wordId}
    LIMIT 1
  `;
  return (rows[0] as { times_reviewed: number }) ?? null;
}

export async function getOrCreateUserWord(
  userId: string,
  wordId: string,
  mnemonicId: string | null
): Promise<{ id: string; ease_factor: number; interval_days: number; times_reviewed: number; times_correct: number; status: string; direction: string }> {
  const rows = await sql`
    INSERT INTO user_words (user_id, word_id, current_mnemonic_id, status)
    VALUES (
      ${userId}, ${wordId},
      COALESCE(${mnemonicId}, (SELECT id FROM mnemonics WHERE word_id = ${wordId} AND user_id IS NULL ORDER BY upvote_count DESC LIMIT 1)),
      'learning'
    )
    ON CONFLICT (user_id, word_id)
    DO UPDATE SET current_mnemonic_id = COALESCE(user_words.current_mnemonic_id, EXCLUDED.current_mnemonic_id)
    RETURNING id, ease_factor, interval_days, times_reviewed, times_correct, status, direction
  `;
  return rows[0] as { id: string; ease_factor: number; interval_days: number; times_reviewed: number; times_correct: number; status: string; direction: string };
}

export async function getUserFeedbackForMnemonic(
  userId: string,
  mnemonicId: string
): Promise<MnemonicFeedback | null> {
  const rows = await sql`
    SELECT * FROM mnemonic_feedback
    WHERE user_id = ${userId} AND mnemonic_id = ${mnemonicId}
  `;
  return (rows[0] as MnemonicFeedback) ?? null;
}

// --- Streak Queries ---

export interface UserStreakData {
  current_streak: number;
  longest_streak: number;
}

export async function getUserStreak(userId: string): Promise<UserStreakData> {
  const rows = await sql`
    SELECT current_streak, longest_streak, last_active_date
    FROM user_streaks
    WHERE user_id = ${userId}
  `;
  if (!rows[0]) return { current_streak: 0, longest_streak: 0 };
  const row = rows[0] as { current_streak: number; longest_streak: number; last_active_date: string | null };
  if (!row.last_active_date) return { current_streak: 0, longest_streak: row.longest_streak };

  const lastActive = new Date(row.last_active_date);
  const today = new Date();
  // Compare dates in UTC to avoid timezone issues
  const lastActiveDay = Date.UTC(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysDiff = Math.floor((todayDay - lastActiveDay) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 1) {
    return { current_streak: row.current_streak, longest_streak: row.longest_streak };
  }
  // Streak has lapsed — return 0 without updating DB
  return { current_streak: 0, longest_streak: row.longest_streak };
}

export async function updateUserStreak(userId: string): Promise<void> {
  await sql`
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date, updated_at)
    VALUES (
      ${userId},
      1,
      1,
      CURRENT_DATE,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      current_streak = CASE
        WHEN user_streaks.last_active_date = CURRENT_DATE THEN user_streaks.current_streak
        WHEN user_streaks.last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN user_streaks.current_streak + 1
        ELSE 1
      END,
      longest_streak = GREATEST(
        user_streaks.longest_streak,
        CASE
          WHEN user_streaks.last_active_date = CURRENT_DATE THEN user_streaks.current_streak
          WHEN user_streaks.last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN user_streaks.current_streak + 1
          ELSE 1
        END
      ),
      last_active_date = CURRENT_DATE,
      updated_at = NOW()
  `;
}

// --- XP Queries ---

export interface UserXpData {
  xp_total: number;
}

export async function getUserXp(userId: string): Promise<UserXpData> {
  const rows = await sql`SELECT xp_total FROM users WHERE id = ${userId}`;
  if (!rows[0]) return { xp_total: 0 };
  return { xp_total: (rows[0] as { xp_total: number }).xp_total ?? 0 };
}

export async function addUserXp(
  userId: string,
  amount: number,
  reason: string
): Promise<UserXpData> {
  const safeAmount = Math.max(0, Math.min(10_000, Math.floor(amount)));
  if (safeAmount === 0) return getUserXp(userId);
  await sql`
    INSERT INTO user_xp_events (user_id, amount, reason)
    VALUES (${userId}, ${safeAmount}, ${reason})
  `;
  const rows = await sql`
    UPDATE users SET xp_total = xp_total + ${safeAmount}, updated_at = NOW()
    WHERE id = ${userId}
    RETURNING xp_total
  `;
  return { xp_total: (rows[0] as { xp_total: number }).xp_total ?? safeAmount };
}

// --- Gallery Queries ---

export interface GalleryWord {
  word_id: string;
  text: string;
  romanization: string | null;
  meaning_en: string;
  pronunciation_audio_url: string | null;
  language_name: string;
  path_title: string;
  mnemonic_id: string;
  keyword_text: string;
  scene_description: string;
  bridge_sentence: string | null;
  image_url: string | null;
  status: string;
}

export async function getLearnedWordsWithMnemonics(
  userId: string
): Promise<GalleryWord[]> {
  const rows = await sql`
    SELECT DISTINCT ON (w.id)
      w.id AS word_id, w.text, w.romanization, w.meaning_en, w.pronunciation_audio_url,
      l.name AS language_name,
      COALESCE(p.title, 'Unknown') AS path_title,
      m.id AS mnemonic_id, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url,
      uw.status
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    JOIN languages l ON l.id = w.language_id
    LEFT JOIN scene_words sw ON sw.word_id = w.id
    LEFT JOIN scenes s ON s.id = sw.scene_id
    LEFT JOIN paths p ON p.id = s.path_id
    LEFT JOIN LATERAL (
      SELECT id, keyword_text, scene_description, bridge_sentence, image_url
      FROM mnemonics
      WHERE word_id = w.id
        AND (user_id IS NULL OR user_id = ${userId})
      ORDER BY
        CASE WHEN id = uw.current_mnemonic_id THEN 0 WHEN user_id = ${userId} THEN 1 ELSE 2 END,
        upvote_count DESC
      LIMIT 1
    ) m ON true
    WHERE uw.user_id = ${userId}
      AND uw.status != 'new'
      AND m.id IS NOT NULL
    ORDER BY w.id, uw.last_reviewed_at DESC NULLS LAST
  `;
  return rows as GalleryWord[];
}

// --- Words by Status ---

export interface WordByStatus {
  word_id: string;
  text: string;
  romanization: string | null;
  meaning_en: string;
  status: 'learning' | 'reviewing' | 'mastered';
}

export async function getWordsByMasteryStatus(userId: string, pathId?: string): Promise<WordByStatus[]> {
  const rows = pathId
    ? await sql`
        SELECT w.id AS word_id, w.text, w.romanization, w.meaning_en, uw.status
        FROM user_words uw
        JOIN words w ON w.id = uw.word_id
        JOIN path_words pw ON pw.word_id = uw.word_id
        WHERE uw.user_id = ${userId} AND uw.status IN ('learning', 'reviewing', 'mastered') AND pw.path_id = ${pathId}
        ORDER BY CASE uw.status WHEN 'learning' THEN 1 WHEN 'reviewing' THEN 2 WHEN 'mastered' THEN 3 END, w.text
      `
    : await sql`
        SELECT w.id AS word_id, w.text, w.romanization, w.meaning_en, uw.status
        FROM user_words uw
        JOIN words w ON w.id = uw.word_id
        WHERE uw.user_id = ${userId} AND uw.status IN ('learning', 'reviewing', 'mastered')
        ORDER BY CASE uw.status WHEN 'learning' THEN 1 WHEN 'reviewing' THEN 2 WHEN 'mastered' THEN 3 END, w.text
      `;
  return rows as WordByStatus[];
}

// --- Mastery Distribution ---

export interface MasteryDistribution {
  new_count: number;
  learning_count: number;
  reviewing_count: number;
  mastered_count: number;
  total_count: number;
}

export async function getWordMasteryDistribution(userId: string, pathId?: string): Promise<MasteryDistribution> {
  const rows = pathId
    ? await sql`
        SELECT
          COUNT(*) FILTER (WHERE uw.status = 'new')::int AS new_count,
          COUNT(*) FILTER (WHERE uw.status = 'learning')::int AS learning_count,
          COUNT(*) FILTER (WHERE uw.status = 'reviewing')::int AS reviewing_count,
          COUNT(*) FILTER (WHERE uw.status = 'mastered')::int AS mastered_count,
          COUNT(*)::int AS total_count
        FROM user_words uw
        JOIN path_words pw ON pw.word_id = uw.word_id
        WHERE uw.user_id = ${userId} AND pw.path_id = ${pathId}
      `
    : await sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'new')::int AS new_count,
          COUNT(*) FILTER (WHERE status = 'learning')::int AS learning_count,
          COUNT(*) FILTER (WHERE status = 'reviewing')::int AS reviewing_count,
          COUNT(*) FILTER (WHERE status = 'mastered')::int AS mastered_count,
          COUNT(*)::int AS total_count
        FROM user_words
        WHERE user_id = ${userId}
      `;
  return (rows[0] as MasteryDistribution) ?? {
    new_count: 0, learning_count: 0, reviewing_count: 0, mastered_count: 0, total_count: 0,
  };
}

// --- Learner Profile Queries ---

export async function getOrCreateLearnerProfile(
  userId: string,
  languageId: string
): Promise<LearnerProfile> {
  await sql`
    INSERT INTO learner_profiles (user_id, language_id)
    VALUES (${userId}, ${languageId})
    ON CONFLICT (user_id, language_id) DO NOTHING
  `;
  const rows = await sql`
    SELECT * FROM learner_profiles
    WHERE user_id = ${userId} AND language_id = ${languageId}
  `;
  return rows[0] as LearnerProfile;
}

export async function updateLearnerProfile(
  userId: string,
  languageId: string,
  updates: {
    weaknessPatterns?: unknown[];
    topicsCovered?: unknown[];
    correctionHistory?: Record<string, unknown>;
    proficiencyEstimate?: string;
    sessionCountIncrement?: number;
    messagesIncrement?: number;
    minutesIncrement?: number;
    recentSessionSummaries?: unknown[];
  }
): Promise<void> {
  if (updates.weaknessPatterns !== undefined) {
    await sql`UPDATE learner_profiles SET weakness_patterns = ${JSON.stringify(updates.weaknessPatterns)}, updated_at = NOW()
      WHERE user_id = ${userId} AND language_id = ${languageId}`;
  }
  if (updates.topicsCovered !== undefined) {
    await sql`UPDATE learner_profiles SET topics_covered = ${JSON.stringify(updates.topicsCovered)}, updated_at = NOW()
      WHERE user_id = ${userId} AND language_id = ${languageId}`;
  }
  if (updates.correctionHistory !== undefined) {
    await sql`UPDATE learner_profiles SET correction_history = ${JSON.stringify(updates.correctionHistory)}, updated_at = NOW()
      WHERE user_id = ${userId} AND language_id = ${languageId}`;
  }
  if (updates.proficiencyEstimate !== undefined) {
    await sql`UPDATE learner_profiles SET proficiency_estimate = ${updates.proficiencyEstimate}, updated_at = NOW()
      WHERE user_id = ${userId} AND language_id = ${languageId}`;
  }
  if (updates.sessionCountIncrement) {
    await sql`UPDATE learner_profiles SET session_count = session_count + ${updates.sessionCountIncrement}, updated_at = NOW()
      WHERE user_id = ${userId} AND language_id = ${languageId}`;
  }
  if (updates.messagesIncrement) {
    await sql`UPDATE learner_profiles SET total_messages = total_messages + ${updates.messagesIncrement}, updated_at = NOW()
      WHERE user_id = ${userId} AND language_id = ${languageId}`;
  }
  if (updates.minutesIncrement) {
    await sql`UPDATE learner_profiles SET total_practice_minutes = total_practice_minutes + ${updates.minutesIncrement}, updated_at = NOW()
      WHERE user_id = ${userId} AND language_id = ${languageId}`;
  }
  if (updates.recentSessionSummaries !== undefined) {
    await sql`UPDATE learner_profiles SET recent_session_summaries = ${JSON.stringify(updates.recentSessionSummaries)}, updated_at = NOW()
      WHERE user_id = ${userId} AND language_id = ${languageId}`;
  }
}

export async function getWeakWords(
  userId: string,
  languageId: string,
  easeThreshold: number = 2.0
): Promise<KnownWordRow[]> {
  const rows = await sql`
    SELECT w.id AS word_id, w.text, w.romanization, w.meaning_en
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    WHERE uw.user_id = ${userId} AND w.language_id = ${languageId}
      AND uw.ease_factor < ${easeThreshold}
      AND uw.status IN ('learning', 'reviewing')
    ORDER BY uw.ease_factor ASC
    LIMIT 20
  `;
  return rows as KnownWordRow[];
}

export async function getWordsByTexts(
  texts: string[],
  languageId: string
): Promise<{ id: string; text: string; meaning_en: string }[]> {
  if (texts.length === 0) return [];
  const rows = await sql`
    SELECT id, text, meaning_en FROM words
    WHERE language_id = ${languageId} AND LOWER(text) = ANY(${texts.map(t => t.toLowerCase())})
  `;
  return rows as { id: string; text: string; meaning_en: string }[];
}

// --- Tutor Word Review Queries ---

export async function insertTutorWordReviews(
  reviews: { sessionId: string; userId: string; wordId: string; languageId: string; usageType: string; srsQuality: number | null }[]
): Promise<void> {
  if (reviews.length === 0) return;
  for (const r of reviews) {
    await sql`
      INSERT INTO tutor_word_reviews (session_id, user_id, word_id, language_id, usage_type, srs_quality)
      VALUES (${r.sessionId}, ${r.userId}, ${r.wordId}, ${r.languageId}, ${r.usageType}, ${r.srsQuality})
    `;
  }
}

// --- Tutor Nudge Queries ---

export async function getRecentNudges(
  userId: string,
  sinceDate: Date
): Promise<TutorNudge[]> {
  const rows = await sql`
    SELECT * FROM tutor_nudges
    WHERE user_id = ${userId} AND created_at >= ${sinceDate.toISOString()}
    ORDER BY created_at DESC
  `;
  return rows as TutorNudge[];
}

export async function insertNudge(
  userId: string,
  nudgeType: string,
  context: Record<string, unknown> | null
): Promise<TutorNudge> {
  const rows = await sql`
    INSERT INTO tutor_nudges (user_id, nudge_type, context)
    VALUES (${userId}, ${nudgeType}, ${context ? JSON.stringify(context) : null})
    RETURNING *
  `;
  return rows[0] as TutorNudge;
}

export async function updateNudge(
  nudgeId: string,
  updates: { shownAt?: string; dismissedAt?: string; acceptedAt?: string }
): Promise<void> {
  if (updates.shownAt) {
    await sql`UPDATE tutor_nudges SET shown_at = ${updates.shownAt} WHERE id = ${nudgeId}`;
  }
  if (updates.dismissedAt) {
    await sql`UPDATE tutor_nudges SET dismissed_at = ${updates.dismissedAt} WHERE id = ${nudgeId}`;
  }
  if (updates.acceptedAt) {
    await sql`UPDATE tutor_nudges SET accepted_at = ${updates.acceptedAt} WHERE id = ${nudgeId}`;
  }
}

// --- Tutor Session: learner_context ---

export async function updateTutorSessionLearnerContext(
  sessionId: string,
  learnerContext: Record<string, unknown>
): Promise<void> {
  await sql`UPDATE tutor_sessions SET learner_context = ${JSON.stringify(learnerContext)} WHERE id = ${sessionId}`;
}

// --- Affix Exercises ---

export async function getAffixExercisesForScene(sceneId: string): Promise<AffixExercise[]> {
  const rows = await sql`
    SELECT * FROM affix_exercises
    WHERE scene_id = ${sceneId}
    ORDER BY sort_order
  `;
  return rows as AffixExercise[];
}

export interface WordFamilyWithDerived extends WordFamily {
  derived_text: string;
  derived_meaning_en: string;
}

export async function getWordFamilies(wordId: string): Promise<WordFamilyWithDerived[]> {
  const rows = await sql`
    SELECT wf.*, w.text AS derived_text, w.meaning_en AS derived_meaning_en
    FROM word_families wf
    JOIN words w ON w.id = wf.derived_word_id
    WHERE wf.root_word_id = ${wordId}
  `;
  return rows as WordFamilyWithDerived[];
}

export async function getUserEncounteredAffixes(userId: string): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT ae.target_affix
    FROM affix_exercises ae
    JOIN user_scene_progress usp ON usp.scene_id = ae.scene_id
    WHERE usp.user_id = ${userId} AND usp.affixes_completed = true
  `;
  return (rows as { target_affix: string }[]).map((r) => r.target_affix);
}

// --- Info Byte Queries ---

export async function getTodayInfoByte(languageId: string): Promise<InfoByte | null> {
  const rows = await sql`
    SELECT * FROM info_bytes
    WHERE language_id = ${languageId} AND publish_date = CURRENT_DATE
  `;
  return (rows[0] as InfoByte) ?? null;
}

export interface RecentInfoByteRow {
  category: string;
  topic_summary: string;
  publish_date: string;
}

export async function getRecentInfoBytes(languageId: string, days: number = 14): Promise<RecentInfoByteRow[]> {
  const rows = await sql`
    SELECT category, topic_summary, publish_date
    FROM info_bytes
    WHERE language_id = ${languageId}
      AND publish_date >= CURRENT_DATE - ${days}::int
    ORDER BY publish_date DESC
  `;
  return rows as RecentInfoByteRow[];
}

export async function insertInfoByte(data: {
  languageId: string;
  publishDate: string;
  category: string;
  topicSummary: string;
  easyTarget: string;
  easyEnglish: string;
  mediumTarget: string;
  mediumEnglish: string;
  hardTarget: string;
  hardEnglish: string;
  sourceTopic: string | null;
  tokensUsed: number;
}): Promise<InfoByte | null> {
  const rows = await sql`
    INSERT INTO info_bytes (
      language_id, publish_date, category, topic_summary,
      easy_target, easy_english, medium_target, medium_english,
      hard_target, hard_english, source_topic, tokens_used
    ) VALUES (
      ${data.languageId}, ${data.publishDate}, ${data.category}, ${data.topicSummary},
      ${data.easyTarget}, ${data.easyEnglish}, ${data.mediumTarget}, ${data.mediumEnglish},
      ${data.hardTarget}, ${data.hardEnglish}, ${data.sourceTopic}, ${data.tokensUsed}
    )
    ON CONFLICT (publish_date, language_id) DO NOTHING
    RETURNING *
  `;
  return (rows[0] as InfoByte) ?? null;
}
