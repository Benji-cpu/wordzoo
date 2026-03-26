import { sql } from './client';
import type {
  SceneDialogue,
  ScenePhrase,
  PhraseWord,
  PhraseWordMnemonic,
  ScenePhraseWithMnemonics,
  ScenePatternExercise,
  UserSceneProgress,
  SceneFlowPhase,
} from '@/types/database';

// --- Scene Flow Data Queries ---

export interface SceneFlowData {
  dialogues: SceneDialogue[];
  phrases: ScenePhraseWithMnemonics[];
  patternExercises: ScenePatternExercise[];
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
               upvote_count DESC LIMIT 1
    ) m ON true
    WHERE pw.phrase_id = ANY(${phraseIds})
    ORDER BY pw.phrase_id, pw.position
  `;
  return rows as (PhraseWordMnemonic & { phrase_id: string })[];
}

export async function getSceneFlowData(sceneId: string, userId: string | null = null): Promise<SceneFlowData> {
  const [dialogues, phrases, patternExercises] = await Promise.all([
    getSceneDialogues(sceneId),
    getScenePhrases(sceneId),
    getScenePatternExercises(sceneId),
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

  return { dialogues, phrases: phrasesWithMnemonics, patternExercises };
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

export async function getScenePatternExercises(sceneId: string): Promise<ScenePatternExercise[]> {
  const rows = await sql`
    SELECT * FROM scene_pattern_exercises
    WHERE scene_id = ${sceneId}
    ORDER BY sort_order
  `;
  return rows as ScenePatternExercise[];
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
    phaseCompleted?: 'dialogue' | 'phrases' | 'vocabulary' | 'patterns' | 'conversation';
    completedAt?: Date;
  }
): Promise<void> {
  // Use a single comprehensive UPDATE that conditionally applies each field
  await sql`
    UPDATE user_scene_progress SET
      current_phase = COALESCE(${updates.currentPhase ?? null}, current_phase),
      phase_index = COALESCE(${updates.phaseIndex ?? null}, phase_index),
      dialogue_completed = CASE WHEN ${updates.phaseCompleted ?? ''} = 'dialogue' THEN true ELSE dialogue_completed END,
      phrases_completed = CASE WHEN ${updates.phaseCompleted ?? ''} = 'phrases' THEN true ELSE phrases_completed END,
      vocabulary_completed = CASE WHEN ${updates.phaseCompleted ?? ''} = 'vocabulary' THEN true ELSE vocabulary_completed END,
      patterns_completed = CASE WHEN ${updates.phaseCompleted ?? ''} = 'patterns' THEN true ELSE patterns_completed END,
      conversation_completed = CASE WHEN ${updates.phaseCompleted ?? ''} = 'conversation' THEN true ELSE conversation_completed END,
      completed_at = COALESCE(${updates.completedAt?.toISOString() ?? null}, completed_at),
      updated_at = NOW()
    WHERE user_id = ${userId} AND scene_id = ${sceneId}
  `;
}

// --- User Phrases ---

export async function getOrCreateUserPhrase(
  userId: string,
  phraseId: string
): Promise<{ id: string; ease_factor: number; interval_days: number; times_reviewed: number; times_correct: number; status: string }> {
  const rows = await sql`
    INSERT INTO user_phrases (user_id, phrase_id, status)
    VALUES (${userId}, ${phraseId}, 'learning')
    ON CONFLICT (user_id, phrase_id)
    DO UPDATE SET updated_at = NOW()
    RETURNING id, ease_factor, interval_days, times_reviewed, times_correct, status
  `;
  return rows[0] as { id: string; ease_factor: number; interval_days: number; times_reviewed: number; times_correct: number; status: string };
}

export async function updatePhraseSRS(
  userPhraseId: string,
  data: {
    easeFactor: number;
    intervalDays: number;
    nextReviewAt: Date;
    timesReviewed: number;
    timesCorrect: number;
    status: string;
    lastReviewedAt: Date;
  }
): Promise<void> {
  await sql`
    UPDATE user_phrases SET
      ease_factor = ${data.easeFactor},
      interval_days = ${data.intervalDays},
      next_review_at = ${data.nextReviewAt.toISOString()},
      times_reviewed = ${data.timesReviewed},
      times_correct = ${data.timesCorrect},
      status = ${data.status},
      last_reviewed_at = ${data.lastReviewedAt.toISOString()},
      updated_at = NOW()
    WHERE id = ${userPhraseId}
  `;
}

export interface DuePhraseForReview {
  phrase_id: string;
  text_target: string;
  text_en: string;
  literal_translation: string | null;
  audio_url: string | null;
  user_phrase_id: string;
  status: string;
  ease_factor: number;
  interval_days: number;
  times_reviewed: number;
  times_correct: number;
}

export async function getDuePhrasesForReview(
  userId: string,
  limit: number = 20
): Promise<DuePhraseForReview[]> {
  const rows = await sql`
    SELECT
      sp.id AS phrase_id, sp.text_target, sp.text_en,
      sp.literal_translation, sp.audio_url,
      up.id AS user_phrase_id, up.status, up.ease_factor,
      up.interval_days, up.times_reviewed, up.times_correct
    FROM user_phrases up
    JOIN scene_phrases sp ON sp.id = up.phrase_id
    WHERE up.user_id = ${userId}
      AND up.next_review_at <= NOW()
      AND up.status != 'new'
    ORDER BY up.next_review_at ASC
    LIMIT ${limit}
  `;
  return rows as DuePhraseForReview[];
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
