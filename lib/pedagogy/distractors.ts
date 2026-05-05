import { sql } from '@/lib/db/client';

/**
 * Pedagogy v2 distractor generation.
 *
 * The legacy `getDistractorsForWord` pulls *random* meanings from the entire
 * language pool — distractors are easy to eliminate on sight (a noun showing
 * up next to a verb tells you the verb is the answer). This module replaces
 * that with a multi-tier strategy that produces meaningfully harder choices.
 *
 * Tiers (recognition direction; English-meaning distractors):
 *   1. Same POS + frequency rank within ±200 (60% of slots when available)
 *   2. Other words from the same scene (semantic-field cohesion, 30%)
 *   3. Frequency-bucket fallback (10%, also catches edge cases)
 *
 * Production direction returns foreign-language strings — same POS, similar
 * length (±2 chars), preferring same starting letter for visual confusability.
 */

export interface DistractorRequest {
  wordId: string;
  languageId: string;
  sceneId?: string | null;
  correctMeaning: string;
  correctTarget?: string;
  partOfSpeech: string;
  frequencyRank?: number | null;
  direction: 'recognition' | 'production';
  count?: number;
}

const FREQ_WINDOW = 200;
const FREQ_TOP_PICKS = 12;

const cache = new Map<string, string[]>();

function cacheKey(req: DistractorRequest): string {
  return [
    req.direction,
    req.wordId,
    req.languageId,
    req.sceneId ?? '',
    req.count ?? 3,
  ].join(':');
}

interface RecognitionRow { meaning_en: string; rank_distance: number }

async function recognitionTier1(
  languageId: string,
  partOfSpeech: string,
  wordId: string,
  correctMeaning: string,
  frequencyRank: number,
  limit: number,
): Promise<string[]> {
  const rows = await sql`
    SELECT meaning_en,
      ABS(frequency_rank - ${frequencyRank}) AS rank_distance
    FROM words
    WHERE language_id = ${languageId}
      AND part_of_speech = ${partOfSpeech}
      AND id <> ${wordId}
      AND meaning_en <> ${correctMeaning}
      AND ABS(frequency_rank - ${frequencyRank}) <= ${FREQ_WINDOW}
    ORDER BY rank_distance
    LIMIT ${FREQ_TOP_PICKS}
  ` as RecognitionRow[];
  if (rows.length === 0) return [];
  const shuffled = [...rows].sort(() => Math.random() - 0.5);
  return uniq(shuffled.map((r) => r.meaning_en)).slice(0, limit);
}

async function recognitionTier2(
  sceneId: string,
  wordId: string,
  correctMeaning: string,
  limit: number,
): Promise<string[]> {
  const rows = await sql`
    SELECT w.meaning_en
    FROM scene_words sw
    JOIN words w ON w.id = sw.word_id
    WHERE sw.scene_id = ${sceneId}
      AND w.id <> ${wordId}
      AND w.meaning_en <> ${correctMeaning}
    GROUP BY w.meaning_en
  ` as { meaning_en: string }[];
  if (rows.length === 0) return [];
  const shuffled = [...rows].sort(() => Math.random() - 0.5);
  return uniq(shuffled.map((r) => r.meaning_en)).slice(0, limit);
}

async function recognitionFallback(
  languageId: string,
  wordId: string,
  correctMeaning: string,
  limit: number,
): Promise<string[]> {
  const rows = await sql`
    SELECT meaning_en
    FROM words
    WHERE language_id = ${languageId}
      AND id <> ${wordId}
      AND meaning_en <> ${correctMeaning}
    GROUP BY meaning_en
    ORDER BY RANDOM()
    LIMIT ${limit}
  ` as { meaning_en: string }[];
  return rows.map((r) => r.meaning_en);
}

interface ProductionRow { text: string; len_distance: number; same_start: number }

async function productionTier1(
  languageId: string,
  partOfSpeech: string,
  wordId: string,
  correctTarget: string,
  limit: number,
): Promise<string[]> {
  const targetLen = correctTarget.length;
  const startCh = correctTarget.charAt(0).toLowerCase();
  const rows = await sql`
    SELECT text,
      ABS(LENGTH(text) - ${targetLen}) AS len_distance,
      CASE WHEN LOWER(LEFT(text, 1)) = ${startCh} THEN 1 ELSE 0 END AS same_start
    FROM words
    WHERE language_id = ${languageId}
      AND part_of_speech = ${partOfSpeech}
      AND id <> ${wordId}
      AND text <> ${correctTarget}
      AND ABS(LENGTH(text) - ${targetLen}) <= 2
    ORDER BY same_start DESC, len_distance ASC
    LIMIT ${FREQ_TOP_PICKS}
  ` as ProductionRow[];
  if (rows.length === 0) return [];
  const shuffled = [...rows].sort(() => Math.random() - 0.5);
  return uniq(shuffled.map((r) => r.text)).slice(0, limit);
}

async function productionFallback(
  languageId: string,
  wordId: string,
  correctTarget: string,
  limit: number,
): Promise<string[]> {
  const rows = await sql`
    SELECT text
    FROM words
    WHERE language_id = ${languageId}
      AND id <> ${wordId}
      AND text <> ${correctTarget}
    GROUP BY text
    ORDER BY RANDOM()
    LIMIT ${limit}
  ` as { text: string }[];
  return rows.map((r) => r.text);
}

function uniq(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export async function generateDistractors(req: DistractorRequest): Promise<string[]> {
  const count = req.count ?? 3;
  const key = cacheKey(req);
  const cached = cache.get(key);
  if (cached) return cached.slice(0, count);

  const result = req.direction === 'recognition'
    ? await generateRecognitionDistractors(req, count)
    : await generateProductionDistractors(req, count);

  cache.set(key, result);
  return result;
}

async function generateRecognitionDistractors(req: DistractorRequest, count: number): Promise<string[]> {
  const tier1Target = Math.max(1, Math.ceil(count * 0.6));
  const tier2Target = Math.max(1, Math.ceil(count * 0.4));

  const out: string[] = [];
  const seen = new Set<string>([req.correctMeaning.toLowerCase()]);

  if (typeof req.frequencyRank === 'number') {
    const tier1 = await recognitionTier1(
      req.languageId,
      req.partOfSpeech,
      req.wordId,
      req.correctMeaning,
      req.frequencyRank,
      tier1Target,
    );
    for (const m of tier1) if (push(m, seen, out, count)) break;
  }

  if (out.length < count && req.sceneId) {
    const tier2 = await recognitionTier2(req.sceneId, req.wordId, req.correctMeaning, tier2Target);
    for (const m of tier2) if (push(m, seen, out, count)) break;
  }

  if (out.length < count) {
    const fallback = await recognitionFallback(
      req.languageId,
      req.wordId,
      req.correctMeaning,
      count - out.length,
    );
    for (const m of fallback) if (push(m, seen, out, count)) break;
  }

  return out.slice(0, count);
}

async function generateProductionDistractors(req: DistractorRequest, count: number): Promise<string[]> {
  if (!req.correctTarget) {
    return generateRecognitionDistractors(req, count);
  }
  const seen = new Set<string>([req.correctTarget.toLowerCase()]);
  const out: string[] = [];

  const tier1 = await productionTier1(
    req.languageId,
    req.partOfSpeech,
    req.wordId,
    req.correctTarget,
    count,
  );
  for (const m of tier1) if (push(m, seen, out, count)) break;

  if (out.length < count) {
    const fallback = await productionFallback(
      req.languageId,
      req.wordId,
      req.correctTarget,
      count - out.length,
    );
    for (const m of fallback) if (push(m, seen, out, count)) break;
  }

  return out.slice(0, count);
}

function push(item: string, seen: Set<string>, out: string[], cap: number): boolean {
  const key = item.toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  out.push(item);
  return out.length >= cap;
}
