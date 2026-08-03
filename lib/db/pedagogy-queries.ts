/**
 * Measurement layer — the first code in this repo that READS pedagogy_events.
 *
 * Until now the table had exactly one INSERT (the telemetry route) and one
 * DELETE (GDPR erasure), and times_correct / times_reviewed were written on
 * every user_words row and never divided by each other. So the question
 * "does WordZoo actually teach?" was unanswerable, and every pedagogy
 * decision was being made blind.
 *
 * Two independent sources, deliberately kept apart:
 *   - pedagogy_events  — per-attempt, cue-level, sparse (only fires where a
 *                        component calls fireTelemetry, so coverage depends on
 *                        which pedagogy v2 slices are live).
 *   - user_words       — per-item lifetime totals, dense, always populated.
 *
 * When the two disagree, user_words is the trustworthy one; the event stream
 * only covers surfaces that were switched on. getEventVolume() exists so the
 * admin page can show that coverage honestly instead of rendering a confident
 * chart over three rows.
 */

import { sql } from './client';

/**
 * Events whose NAME encodes the cue. drill_* is the exception — it carries the
 * cue in payload->>'cueType', because one drill block rotates through several.
 */
const CUE_FROM_EVENT = `
  CASE
    WHEN event LIKE 'drill_%'        THEN COALESCE(NULLIF(payload->>'cueType', ''), 'drill')
    WHEN event LIKE 'phrase_drill_%' THEN 'phrase_' || COALESCE(NULLIF(payload->>'cueType', ''), 'drill')
    WHEN event LIKE 'phrase_%'       THEN regexp_replace(event, '_(correct|wrong|attempt)$', '')
    ELSE regexp_replace(event, '_(correct|wrong|attempt)$', '')
  END`;

/**
 * Attempt counters arrive as jsonb text under two different keys depending on
 * the emitter (drills use `tries`, cloze/production use `attempts`), and a
 * malformed payload must not abort the whole aggregate — hence the regex guard
 * before the cast rather than a bare ::int.
 */
const FIRST_TRY_EXPR = `
  CASE
    WHEN COALESCE(payload->>'tries', payload->>'attempts') ~ '^[0-9]+$'
      THEN COALESCE(payload->>'tries', payload->>'attempts')::int = 1
    ELSE NULL
  END`;

export interface CueAccuracyRow {
  cue_type: string;
  attempts: number;
  correct: number;
  first_try: number;
  accuracy_pct: number;
}

/** Per-cue accuracy over the event stream. Sparse — see getEventVolume(). */
export async function getCueAccuracy(days = 30): Promise<CueAccuracyRow[]> {
  const rows = await sql`
    SELECT
      ${sql.unsafe(CUE_FROM_EVENT)} AS cue_type,
      COUNT(*)::int AS attempts,
      COUNT(*) FILTER (WHERE event LIKE '%_correct')::int AS correct,
      COUNT(*) FILTER (WHERE event LIKE '%_correct' AND ${sql.unsafe(FIRST_TRY_EXPR)})::int AS first_try,
      ROUND(
        100.0 * COUNT(*) FILTER (WHERE event LIKE '%_correct') / NULLIF(COUNT(*), 0)
      , 1)::float AS accuracy_pct
    FROM pedagogy_events
    WHERE created_at > NOW() - (${days} || ' days')::interval
      AND (event LIKE '%_correct' OR event LIKE '%_wrong')
    GROUP BY 1
    ORDER BY attempts DESC
  `;
  return rows as CueAccuracyRow[];
}

export interface DailyAccuracyRow {
  day: string;
  attempts: number;
  correct: number;
  accuracy_pct: number;
}

export async function getDailyAccuracy(days = 30): Promise<DailyAccuracyRow[]> {
  const rows = await sql`
    SELECT
      to_char(created_at, 'YYYY-MM-DD') AS day,
      COUNT(*)::int AS attempts,
      COUNT(*) FILTER (WHERE event LIKE '%_correct')::int AS correct,
      ROUND(
        100.0 * COUNT(*) FILTER (WHERE event LIKE '%_correct') / NULLIF(COUNT(*), 0)
      , 1)::float AS accuracy_pct
    FROM pedagogy_events
    WHERE created_at > NOW() - (${days} || ' days')::interval
      AND (event LIKE '%_correct' OR event LIKE '%_wrong')
    GROUP BY 1
    ORDER BY 1 DESC
  `;
  return rows as DailyAccuracyRow[];
}

export interface CheckpointStats {
  started: number;
  passed: number;
  failed: number;
  pass_rate_pct: number;
  avg_remediation_loops: number;
}

export async function getCheckpointStats(days = 30): Promise<CheckpointStats> {
  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE event LIKE '%checkpoint_started')::int AS started,
      COUNT(*) FILTER (WHERE event LIKE '%checkpoint_passed')::int  AS passed,
      COUNT(*) FILTER (WHERE event LIKE '%checkpoint_failed')::int  AS failed,
      ROUND(
        100.0 * COUNT(*) FILTER (WHERE event LIKE '%checkpoint_passed')
        / NULLIF(COUNT(*) FILTER (WHERE event LIKE '%checkpoint_passed'
                                     OR event LIKE '%checkpoint_failed'), 0)
      , 1)::float AS pass_rate_pct,
      COALESCE(ROUND(AVG(
        CASE WHEN payload->>'remediationLoops' ~ '^[0-9]+$'
             THEN (payload->>'remediationLoops')::numeric END
      ), 2), 0)::float AS avg_remediation_loops
    FROM pedagogy_events
    WHERE created_at > NOW() - (${days} || ' days')::interval
      AND event LIKE '%checkpoint_%'
  `;
  return (rows[0] as CheckpointStats) ?? {
    started: 0, passed: 0, failed: 0, pass_rate_pct: 0, avg_remediation_loops: 0,
  };
}

export interface WordAccuracyBucketRow {
  bucket: string;
  word_count: number;
}

/**
 * Distribution of per-item lifetime accuracy. Restricted to items with at least
 * 3 reviews — below that the ratio is noise (one miss on a 2-review word reads
 * as 50%).
 */
export async function getWordAccuracyDistribution(): Promise<WordAccuracyBucketRow[]> {
  const rows = await sql`
    WITH acc AS (
      SELECT times_correct::numeric / NULLIF(times_reviewed, 0) AS ratio
      FROM user_words
      WHERE times_reviewed >= 3
    )
    SELECT bucket, COUNT(*)::int AS word_count
    FROM (
      SELECT CASE
        WHEN ratio >= 0.90 THEN '90-100%'
        WHEN ratio >= 0.75 THEN '75-89%'
        WHEN ratio >= 0.50 THEN '50-74%'
        ELSE '0-49%'
      END AS bucket
      FROM acc WHERE ratio IS NOT NULL
    ) b
    GROUP BY bucket
    ORDER BY bucket DESC
  `;
  return rows as WordAccuracyBucketRow[];
}

export interface WeakWordRow {
  word_id: string;
  text: string;
  meaning_en: string;
  language_code: string;
  times_reviewed: number;
  times_correct: number;
  accuracy_pct: number;
  learners: number;
}

/**
 * Aggregated ACROSS users on purpose: a word that one learner fails is a
 * learner problem, but a word that everyone fails is a content problem — a bad
 * mnemonic, a misleading gloss, a distractor that's actually correct.
 */
export async function getWeakestWords(limit = 25): Promise<WeakWordRow[]> {
  const rows = await sql`
    SELECT
      w.id AS word_id, w.text, w.meaning_en, l.code AS language_code,
      SUM(uw.times_reviewed)::int AS times_reviewed,
      SUM(uw.times_correct)::int  AS times_correct,
      ROUND(100.0 * SUM(uw.times_correct) / NULLIF(SUM(uw.times_reviewed), 0), 1)::float AS accuracy_pct,
      COUNT(DISTINCT uw.user_id)::int AS learners
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    JOIN languages l ON l.id = w.language_id
    GROUP BY w.id, w.text, w.meaning_en, l.code
    HAVING SUM(uw.times_reviewed) >= 3
    ORDER BY accuracy_pct ASC, times_reviewed DESC
    LIMIT ${limit}
  `;
  return rows as WeakWordRow[];
}

export interface RetentionBucketRow {
  interval_bucket: string;
  reviews: number;
  correct: number;
  retention_pct: number;
}

/**
 * The number that decides whether any of this works: of the reviews that came
 * due after N days, what fraction were remembered?
 *
 * Requires the `srs_review_recorded` event emitted from lib/srs/engine.ts —
 * times_correct/times_reviewed are lifetime cumulative and cannot be bucketed
 * by the interval the review actually happened at.
 */
export async function getRetentionCurve(days = 90): Promise<RetentionBucketRow[]> {
  const rows = await sql`
    WITH r AS (
      SELECT
        CASE WHEN payload->>'priorIntervalDays' ~ '^[0-9]+$'
             THEN (payload->>'priorIntervalDays')::int END AS prior_interval,
        payload->>'rating' AS rating
      FROM pedagogy_events
      WHERE event = 'srs_review_recorded'
        AND created_at > NOW() - (${days} || ' days')::interval
    )
    SELECT
      CASE
        WHEN prior_interval <= 1  THEN '1d'
        WHEN prior_interval <= 3  THEN '2-3d'
        WHEN prior_interval <= 7  THEN '4-7d'
        WHEN prior_interval <= 14 THEN '8-14d'
        WHEN prior_interval <= 30 THEN '15-30d'
        ELSE '31d+'
      END AS interval_bucket,
      COUNT(*)::int AS reviews,
      COUNT(*) FILTER (WHERE rating <> 'forgot')::int AS correct,
      ROUND(100.0 * COUNT(*) FILTER (WHERE rating <> 'forgot') / NULLIF(COUNT(*), 0), 1)::float AS retention_pct
    FROM r
    WHERE prior_interval IS NOT NULL
    GROUP BY 1
    ORDER BY MIN(prior_interval)
  `;
  return rows as RetentionBucketRow[];
}

export interface OverdueBucketRow {
  bucket: string;
  words: number;
  phrases: number;
}

/**
 * How far behind the review queue has fallen. This is the number that has only
 * ever climbed (145 -> 149 between Jun and Aug 2026) because `forgot` carried
 * no ease penalty, so lapsed items kept re-inflating their intervals.
 */
export async function getOverdueQueue(): Promise<OverdueBucketRow[]> {
  const rows = await sql`
    WITH b AS (
      SELECT 'due now' AS bucket, 0 AS ord,
             EXTRACT(EPOCH FROM (NOW() - next_review_at)) / 86400 AS late, 'word' AS kind
      FROM user_words WHERE status <> 'new' AND next_review_at <= NOW()
      UNION ALL
      SELECT 'due now', 0,
             EXTRACT(EPOCH FROM (NOW() - next_review_at)) / 86400, 'phrase'
      FROM user_phrases WHERE status <> 'new' AND next_review_at <= NOW()
    )
    SELECT
      CASE
        WHEN late < 1  THEN 'due now'
        WHEN late < 3  THEN '1-2d late'
        WHEN late < 8  THEN '3-7d late'
        ELSE '8d+ late'
      END AS bucket,
      COUNT(*) FILTER (WHERE kind = 'word')::int   AS words,
      COUNT(*) FILTER (WHERE kind = 'phrase')::int AS phrases
    FROM b
    GROUP BY 1
    ORDER BY MIN(late)
  `;
  return rows as OverdueBucketRow[];
}

export interface LeechRow {
  word_id: string;
  text: string;
  meaning_en: string;
  language_code: string;
  times_reviewed: number;
  times_correct: number;
  accuracy_pct: number;
  interval_days: number;
  ease_factor: number;
  learners: number;
}

/**
 * Items the scheduler is now capping as leeches — many reviews, poor lifetime
 * accuracy. Must stay in sync with LEECH_MIN_REVIEWS / LEECH_ACCURACY in
 * lib/srs/engine.ts.
 *
 * Deliberately surfaced rather than suspended. Burying a hard word is how a
 * learner ends up with a queue they can't clear and no idea why; and a leech
 * that recurs across learners is a content bug — a bad mnemonic or a
 * misleading gloss — which is the actionable version.
 */
export async function getLeechWords(limit = 20): Promise<LeechRow[]> {
  const rows = await sql`
    SELECT
      w.id AS word_id, w.text, w.meaning_en, l.code AS language_code,
      MAX(uw.times_reviewed)::int AS times_reviewed,
      MAX(uw.times_correct)::int AS times_correct,
      ROUND(100.0 * SUM(uw.times_correct) / NULLIF(SUM(uw.times_reviewed), 0), 1)::float AS accuracy_pct,
      MAX(uw.interval_days)::int AS interval_days,
      ROUND(AVG(uw.ease_factor)::numeric, 2)::float AS ease_factor,
      COUNT(DISTINCT uw.user_id)::int AS learners
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    JOIN languages l ON l.id = w.language_id
    WHERE uw.times_reviewed >= 8
      AND uw.times_correct::numeric / NULLIF(uw.times_reviewed, 0) < 0.5
    GROUP BY w.id, w.text, w.meaning_en, l.code
    ORDER BY accuracy_pct ASC, times_reviewed DESC
    LIMIT ${limit}
  `;
  return rows as LeechRow[];
}

export interface EventVolumeRow {
  event: string;
  n: number;
  last_seen: string | null;
}

/**
 * The honesty widget. Renders which declared events actually fire, so a page
 * full of zeroes reads as "this surface isn't switched on" rather than
 * "the learners are perfect".
 */
export async function getEventVolume(days = 30): Promise<EventVolumeRow[]> {
  const rows = await sql`
    SELECT event, COUNT(*)::int AS n, MAX(created_at)::text AS last_seen
    FROM pedagogy_events
    WHERE created_at > NOW() - (${days} || ' days')::interval
    GROUP BY event
    ORDER BY n DESC
  `;
  return rows as EventVolumeRow[];
}

export interface LearnerTotals {
  learners: number;
  words_tracked: number;
  words_reviewed: number;
  mean_accuracy_pct: number;
  overdue_words: number;
  overdue_phrases: number;
}

export async function getLearnerTotals(): Promise<LearnerTotals> {
  const rows = await sql`
    SELECT
      (SELECT COUNT(DISTINCT user_id)::int FROM user_words) AS learners,
      (SELECT COUNT(*)::int FROM user_words) AS words_tracked,
      (SELECT COUNT(*)::int FROM user_words WHERE times_reviewed > 0) AS words_reviewed,
      (SELECT COALESCE(ROUND(AVG(times_correct::numeric / NULLIF(times_reviewed, 0)) * 100, 1), 0)::float
         FROM user_words WHERE times_reviewed >= 3) AS mean_accuracy_pct,
      (SELECT COUNT(*)::int FROM user_words   WHERE status <> 'new' AND next_review_at <= NOW()) AS overdue_words,
      (SELECT COUNT(*)::int FROM user_phrases WHERE status <> 'new' AND next_review_at <= NOW()) AS overdue_phrases
  `;
  return rows[0] as LearnerTotals;
}

/**
 * pedagogy_events has no natural bound — the telemetry route has no rate limit
 * and every drill answer writes a row. Pruned from /api/cron/reset-usage, the
 * same job that already prunes spend_events.
 */
export async function prunePedagogyEvents(retentionDays = 90): Promise<void> {
  await sql`
    DELETE FROM pedagogy_events
    WHERE created_at < NOW() - (${retentionDays} || ' days')::interval
  `;
}
