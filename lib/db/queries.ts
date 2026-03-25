import { sql } from './client';
import type { Word, Mnemonic, Path, Scene, Language, UserPath, TutorSession, TutorMessage, Subscription, Purchase, DailyUsage, MnemonicFeedback } from '@/types/database';

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
      sw.sort_order,
      m.id AS mnemonic_id, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url,
      uw.status AS user_word_status
    FROM scene_words sw
    JOIN words w ON w.id = sw.word_id
    LEFT JOIN user_words uw ON uw.word_id = w.id AND uw.user_id = ${userId}
    LEFT JOIN mnemonics m ON m.id = uw.current_mnemonic_id
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
  sort_order: number;
  path_id: string;
  language_name: string;
  language_id: string;
  language_code: string;
} | null> {
  const rows = await sql`
    SELECT s.id AS scene_id, s.title AS scene_title, s.description AS scene_description,
      s.scene_type, s.scene_context, s.sort_order,
      s.path_id, l.name AS language_name, l.id AS language_id, l.code AS language_code
    FROM scenes s
    JOIN paths p ON p.id = s.path_id
    JOIN languages l ON l.id = p.language_id
    WHERE s.id = ${sceneId}
  `;
  return (rows[0] as { scene_id: string; scene_title: string; scene_description: string | null; scene_type: 'legacy' | 'dialogue'; scene_context: string | null; sort_order: number; path_id: string; language_name: string; language_id: string; language_code: string }) ?? null;
}

export async function getNextSceneInPath(
  pathId: string,
  currentSortOrder: number
): Promise<{ id: string; title: string } | null> {
  const rows = await sql`
    SELECT id, title FROM scenes
    WHERE path_id = ${pathId} AND sort_order > ${currentSortOrder}
    ORDER BY sort_order
    LIMIT 1
  `;
  return (rows[0] as { id: string; title: string }) ?? null;
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
    SELECT s.id, s.sort_order, s.title, s.description, s.scene_type,
      COUNT(DISTINCT sw.word_id)::int AS total_words,
      COUNT(DISTINCT CASE WHEN uw.status IN ('reviewing', 'mastered') THEN sw.word_id END)::int AS mastered_words,
      usp.current_phase,
      COALESCE(usp.completed_at IS NOT NULL, false) AS scene_completed
    FROM scenes s
    LEFT JOIN scene_words sw ON sw.scene_id = s.id
    LEFT JOIN user_words uw ON uw.word_id = sw.word_id AND uw.user_id = ${userId}
    LEFT JOIN user_scene_progress usp ON usp.scene_id = s.id AND usp.user_id = ${userId}
    WHERE s.path_id = ${pathId}
    GROUP BY s.id, s.sort_order, s.title, s.description, s.scene_type, usp.current_phase, usp.completed_at
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
    LEFT JOIN mnemonics m ON m.id = uw.current_mnemonic_id
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
  type: 'premade' | 'custom' | 'travel';
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
}): Promise<Scene> {
  const rows = await sql`
    INSERT INTO scenes (path_id, title, description, sort_order)
    VALUES (${data.pathId}, ${data.title}, ${data.description}, ${data.sortOrder})
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
}

export async function getUserVocabWithMnemonics(
  userId: string,
  languageId: string
): Promise<VocabWithMnemonic[]> {
  const rows = await sql`
    SELECT w.id AS word_id, w.text, w.romanization, w.meaning_en,
      w.pronunciation_audio_url, m.keyword_text, m.scene_description, m.bridge_sentence
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    LEFT JOIN mnemonics m ON m.id = uw.current_mnemonic_id
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
      m.id AS mnemonic_id, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url,
      uw.id AS user_word_id, uw.status, uw.ease_factor, uw.interval_days,
      uw.times_reviewed, uw.times_correct, uw.direction
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    LEFT JOIN mnemonics m ON m.id = uw.current_mnemonic_id
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
      m.id AS mnemonic_id, m.keyword_text, m.scene_description, m.bridge_sentence, m.image_url,
      uw.id AS user_word_id, uw.status, uw.ease_factor, uw.interval_days,
      uw.times_reviewed, uw.times_correct, uw.direction
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    LEFT JOIN mnemonics m ON m.id = uw.current_mnemonic_id
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

export async function getOrCreateUserWord(
  userId: string,
  wordId: string,
  mnemonicId: string | null
): Promise<{ id: string; ease_factor: number; interval_days: number; times_reviewed: number; times_correct: number; status: string; direction: string }> {
  const rows = await sql`
    INSERT INTO user_words (user_id, word_id, current_mnemonic_id, status)
    VALUES (${userId}, ${wordId}, ${mnemonicId}, 'learning')
    ON CONFLICT (user_id, word_id)
    DO UPDATE SET current_mnemonic_id = COALESCE(user_words.current_mnemonic_id, ${mnemonicId})
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
