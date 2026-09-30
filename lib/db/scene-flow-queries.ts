import { sql } from './client';
import type { SrsWrite } from './queries';
import type {
  SceneDialogue,
  ScenePhrase,
  PhraseWord,
  PhraseWordMnemonic,
  ScenePhraseWithMnemonics,
  UserSceneProgress,
  SceneFlowPhase,
} from '@/types/database';

// --- Scene Flow Data Queries ---

export interface SceneFlowData {
  dialogues: SceneDialogue[];
  phrases: ScenePhraseWithMnemonics[];
}

export async function getPhraseWordsWithMnemonics(
  phraseIds: string[],
  userId: string | null
): Promise<(PhraseWordMnemonic & { phrase_id: string })[]> {
  if (phraseIds.length === 0) return [];
  const rows = await sql`
    SELECT pw.phrase_id, w.id AS word_id, w.text AS word_text,
           w.meaning_en AS word_en, w.part_of_speech, pw.position,
           m.keyword_text, m.bridge_sentence, m.image_url
    FROM phrase_words pw
    JOIN words w ON w.id = pw.word_id
    LEFT JOIN LATERAL (
      SELECT keyword_text, bridge_sentence, image_url
      FROM mnemonics WHERE word_id = w.id
        AND (user_id IS NULL OR user_id = ${userId})
      ORDER BY CASE WHEN user_id = ${userId} THEN 0 ELSE 1 END,
               upvote_count DESC, created_at DESC LIMIT 1
    ) m ON true
    WHERE pw.phrase_id = ANY(${phraseIds})
    ORDER BY pw.phrase_id, pw.position
  `;
  return rows as (PhraseWordMnemonic & { phrase_id: string })[];
}

export async function getSceneFlowData(sceneId: string, userId: string | null = null): Promise<SceneFlowData> {
  const [dialogues, phrases] = await Promise.all([
    getSceneDialogues(sceneId),
    getScenePhrases(sceneId),
  ]);

  const phraseIds = phrases.map((p) => p.id);
  const phraseWordRows = await getPhraseWordsWithMnemonics(phraseIds, userId);

  const phraseWordMap = new Map<string, PhraseWordMnemonic[]>();
  for (const pw of phraseWordRows) {
    if (!phraseWordMap.has(pw.phrase_id)) phraseWordMap.set(pw.phrase_id, []);
    phraseWordMap.get(pw.phrase_id)!.push({
      word_id: pw.word_id,
      word_text: pw.word_text,
      word_en: pw.word_en,
      part_of_speech: pw.part_of_speech,
      position: pw.position,
      keyword_text: pw.keyword_text,
      bridge_sentence: pw.bridge_sentence,
      image_url: pw.image_url,
    });
  }

  const phrasesWithMnemonics: ScenePhraseWithMnemonics[] = phrases.map((p) => ({
    ...p,
    words: phraseWordMap.get(p.id) ?? [],
  }));

  return { dialogues, phrases: phrasesWithMnemonics };
}

export async function getSceneDialogues(sceneId: string): Promise<SceneDialogue[]> {
  const rows = await sql`
    SELECT * FROM scene_dialogues
    WHERE scene_id = ${sceneId}
    ORDER BY sort_order
  `;
  return rows as SceneDialogue[];
}

export async function getScenePhrases(sceneId: string): Promise<ScenePhrase[]> {
  const rows = await sql`
    SELECT * FROM scene_phrases
    WHERE scene_id = ${sceneId}
    ORDER BY sort_order
  `;
  return rows as ScenePhrase[];
}

export async function getPhraseWords(phraseIds: string[]): Promise<PhraseWord[]> {
  if (phraseIds.length === 0) return [];
  const rows = await sql`
    SELECT * FROM phrase_words
    WHERE phrase_id = ANY(${phraseIds})
    ORDER BY position
  `;
  return rows as PhraseWord[];
}

// --- User Scene Progress ---

export async function getOrCreateSceneProgress(
  userId: string,
  sceneId: string
): Promise<UserSceneProgress> {
  const rows = await sql`
    INSERT INTO user_scene_progress (user_id, scene_id)
    VALUES (${userId}, ${sceneId})
    ON CONFLICT (user_id, scene_id) DO UPDATE SET updated_at = NOW()
    RETURNING *
  `;
  return rows[0] as UserSceneProgress;
}

export async function updateSceneProgress(
  userId: string,
  sceneId: string,
  updates: {
    currentPhase?: SceneFlowPhase;
    phaseIndex?: number;
    phaseCompleted?: 'dialogue' | 'phrases' | 'vocabulary' | 'conversation';
    completedAt?: Date;
    /** Pedagogy v2 sub-state. `null` clears the column (legacy mode);
     * `undefined` leaves it untouched. */
    phaseStep?: 'intro' | 'drill' | 'converse' | 'checkpoint' | null;
    phaseBatch?: number;
  }
): Promise<void> {
  // For phase_step we need a 3-way switch: leave-alone / clear / set.
  // Encode the intent as ('leave' | 'clear' | 'set') with a payload string.
  const stepIntent =
    updates.phaseStep === undefined ? 'leave'
    : updates.phaseStep === null ? 'clear'
    : 'set';
  const stepValue = updates.phaseStep ?? '';

  await sql`
    UPDATE user_scene_progress SET
      current_phase = COALESCE(${updates.currentPhase ?? null}, current_phase),
      phase_index = COALESCE(${updates.phaseIndex ?? null}, phase_index),
      phase_step = CASE
        WHEN ${stepIntent} = 'clear' THEN NULL
        WHEN ${stepIntent} = 'set' THEN ${stepValue}
        ELSE phase_step
      END,
      phase_batch = COALESCE(${updates.phaseBatch ?? null}, phase_batch),
      dialogue_completed = CASE WHEN ${updates.phaseCompleted ?? ''} = 'dialogue' THEN true ELSE dialogue_completed END,
      phrases_completed = CASE WHEN ${updates.phaseCompleted ?? ''} = 'phrases' THEN true ELSE phrases_completed END,
      vocabulary_completed = CASE WHEN ${updates.phaseCompleted ?? ''} = 'vocabulary' THEN true ELSE vocabulary_completed END,
      conversation_completed = CASE WHEN ${updates.phaseCompleted ?? ''} = 'conversation' THEN true ELSE conversation_completed END,
      completed_at = COALESCE(${updates.completedAt?.toISOString() ?? null}, completed_at),
      updated_at = NOW()
    WHERE user_id = ${userId} AND scene_id = ${sceneId}
  `;
}

// --- User Phrases ---

/** Mirrors UserWordSrsState in queries.ts, minus the mnemonic pointer. */
export interface UserPhraseSrsState {
  id: string;
  ease_factor: number;
  interval_days: number;
  learning_step: number;
  lapses: number;
  times_reviewed: number;
  times_correct: number;
  status: string;
  last_reviewed_at: Date | null;
  /** last_reviewed_at truncated to ms, ISO UTC: the compare-and-set token (see updateWordSRS). */
  last_reviewed_token: string | null;
  next_review_at: Date | null;
  /** users.trip_date as 'YYYY-MM-DD', or null. */
  trip_date: string | null;
}

export async function getOrCreateUserPhrase(
  userId: string,
  phraseId: string
): Promise<UserPhraseSrsState> {
  const rows = await sql`
    INSERT INTO user_phrases (user_id, phrase_id, status)
    VALUES (${userId}, ${phraseId}, 'learning')
    ON CONFLICT (user_id, phrase_id)
    DO UPDATE SET updated_at = NOW()
    RETURNING id, ease_factor, interval_days, learning_step, lapses,
              times_reviewed, times_correct, status,
              last_reviewed_at,
              to_char(date_trunc('milliseconds', last_reviewed_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS last_reviewed_token,
              next_review_at,
              (SELECT to_char(trip_date, 'YYYY-MM-DD') FROM users WHERE id = ${userId}) AS trip_date
  `;
  return rows[0] as UserPhraseSrsState;
}

/** Same contract as updateWordSRS (compare-and-set, atomic counters, no-advance writes counters only). */
export async function updatePhraseSRS(userPhraseId: string, data: SrsWrite): Promise<boolean> {
  const inc = data.countAttempt ? 1 : 0;
  const incCorrect = data.countAttempt && data.isCorrect ? 1 : 0;
  const last = data.lastReviewedAt.toISOString();
  if (!data.advance) {
    await sql`
      UPDATE user_phrases SET
        times_reviewed = times_reviewed + ${inc},
        times_correct = times_correct + ${incCorrect},
        direction = COALESCE(${data.direction ?? null}, direction),
        last_reviewed_at = ${last},
        updated_at = NOW()
      WHERE id = ${userPhraseId}
    `;
    return true;
  }
  const rows = await sql`
    UPDATE user_phrases SET
      ease_factor = ${data.easeFactor},
      interval_days = ${data.intervalDays},
      learning_step = ${data.learningStep},
      lapses = ${data.lapses},
      next_review_at = ${data.nextReviewAt.toISOString()},
      times_reviewed = times_reviewed + ${inc},
      times_correct = times_correct + ${incCorrect},
      status = ${data.status},
      direction = COALESCE(${data.direction ?? null}, direction),
      last_reviewed_at = ${last},
      updated_at = NOW()
    WHERE id = ${userPhraseId}
      AND date_trunc('milliseconds', last_reviewed_at) IS NOT DISTINCT FROM ${data.expectedLastReviewedAt}::timestamptz
    RETURNING id
  `;
  return rows.length > 0;
}

export interface DuePhraseForReview {
  phrase_id: string;
  text_target: string;
  text_en: string;
  literal_translation: string | null;
  audio_url: string | null;
  phrase_bridge_sentence: string | null;
  composite_image_url: string | null;
  composite_scene_description: string | null;
  user_phrase_id: string;
  status: string;
  ease_factor: number;
  interval_days: number;
  learning_step: number;
  /** ISO string (UTC), or null if never reviewed. */
  last_reviewed_at: string | null;
  times_reviewed: number;
  times_correct: number;
  /** Direction of the LAST review — the queue flips it to alternate. */
  direction: string;
}

/** Same order and options as getDueWordsForReview (see the note there). */
export async function getDuePhrasesForReview(
  userId: string,
  limit: number = 20,
  languageId?: string | null,
  opts?: { priorityScene?: string | null; matureOverdue?: boolean }
): Promise<DuePhraseForReview[]> {
  const priorityScene = opts?.priorityScene ?? null;
  const mature = opts?.matureOverdue ?? false;
  const rows = await sql`
    SELECT
      sp.id AS phrase_id, sp.text_target, sp.text_en,
      sp.literal_translation, sp.audio_url,
      sp.phrase_bridge_sentence, sp.composite_image_url, sp.composite_scene_description,
      up.id AS user_phrase_id, up.status, up.ease_factor,
      up.interval_days, up.learning_step,
      to_char(up.last_reviewed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS last_reviewed_at,
      up.times_reviewed, up.times_correct, up.direction
    FROM user_phrases up
    JOIN scene_phrases sp ON sp.id = up.phrase_id
    JOIN scenes s ON s.id = sp.scene_id
    JOIN paths p ON p.id = s.path_id
    CROSS JOIN LATERAL (
      SELECT (${priorityScene}::uuid IS NOT NULL AND sp.scene_id = ${priorityScene}::uuid) AS is_priority
    ) pri
    WHERE up.user_id = ${userId}
      AND up.next_review_at <= NOW()
      AND up.status != 'new'
      AND (${languageId ?? null}::uuid IS NULL OR p.language_id = ${languageId ?? null}::uuid)
      AND (NOT ${mature}::boolean OR up.interval_days >= 7)
    ORDER BY
      COALESCE(up.last_reviewed_at > NOW() - interval '10 minutes' AND NOT pri.is_priority, false) ASC,
      pri.is_priority DESC,
      (up.learning_step < 2 AND NOT ${mature}::boolean) DESC,
      CASE WHEN ${mature}::boolean THEN 0 ELSE up.interval_days END ASC,
      up.next_review_at ASC
    LIMIT ${limit}
  `;
  return rows as DuePhraseForReview[];
}

export async function getDuePhraseCount(
  userId: string,
  languageId?: string | null
): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM user_phrases up
    JOIN scene_phrases sp ON sp.id = up.phrase_id
    JOIN scenes s ON s.id = sp.scene_id
    JOIN paths p ON p.id = s.path_id
    WHERE up.user_id = ${userId}
      AND up.next_review_at <= NOW()
      AND up.status != 'new'
      AND (${languageId ?? null}::uuid IS NULL OR p.language_id = ${languageId ?? null}::uuid)
  `;
  return (rows[0] as { count: number })?.count ?? 0;
}

// --- Tutor Guided Conversation ---

export async function insertGuidedConversationSession(
  userId: string,
  languageId: string,
  sceneId: string,
  scenario?: string
): Promise<{ id: string }> {
  const rows = await sql`
    INSERT INTO tutor_sessions (user_id, language_id, mode, scene_id, scenario)
    VALUES (${userId}, ${languageId}, 'guided_conversation', ${sceneId}, ${scenario ?? null})
    RETURNING id
  `;
  return rows[0] as { id: string };
}
