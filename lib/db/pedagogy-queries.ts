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
import { realUserOnly, activeLanguageId, maskEmail } from './real-users';

// Every aggregate below counts real learners only (no @wordzoo.dev fixtures); see real-users.ts.

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

/**
 * "Overdue" = an introduced item due now, of a real learner, in the language of their
 * ACTIVE path (the same scope the /review page uses). Items in languages they walked
 * away from are not a backlog: they inflated the digest's 8d+ bucket to 186 words.
 * Expects aliases uw+w (words) / uph+p (phrases).
 */
const DUE_WORD_SCOPE = `
  uw.status <> 'new' AND uw.next_review_at <= NOW()
  AND w.language_id = ${activeLanguageId('uw.user_id')}
  AND ${realUserOnly('uw.user_id')}`;
const DUE_PHRASE_SCOPE = `
  uph.status <> 'new' AND uph.next_review_at <= NOW()
  AND p.language_id = ${activeLanguageId('uph.user_id')}
  AND ${realUserOnly('uph.user_id')}`;

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
      AND ${sql.unsafe(realUserOnly('pedagogy_events.user_id'))}
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
      AND ${sql.unsafe(realUserOnly('pedagogy_events.user_id'))}
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
      AND ${sql.unsafe(realUserOnly('pedagogy_events.user_id'))}
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
        AND ${sql.unsafe(realUserOnly('user_words.user_id'))}
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
    WHERE ${sql.unsafe(realUserOnly('uw.user_id'))}
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
  // Only genuine due reviews: source 'review'. Scene, tutor and practice
  // answers are working memory and would flatter every bucket. An answer whose
  // item was still in the learning phase (priorLearningStep < 2) is bucketed
  // '<1d (learning)' whatever interval it carried — a relearning 6-day item
  // that lapsed is not a 6-day retention sample. A review that didn't advance
  // (not due, or inside the 15 s learning floor) is a re-ask, not a sample.
  const rows = await sql`
    WITH r AS (
      SELECT
        CASE WHEN payload->>'priorIntervalDays' ~ '^[0-9]+$'
             THEN (payload->>'priorIntervalDays')::int END AS prior_interval,
        CASE WHEN payload->>'priorLearningStep' ~ '^[0-9]+$'
             THEN (payload->>'priorLearningStep')::int END AS prior_step,
        payload->>'rating' AS rating
      FROM pedagogy_events
      WHERE event = 'srs_review_recorded'
        AND payload->>'source' = 'review'
        AND payload->>'reason' IS DISTINCT FROM 'practice_no_advance'
        AND created_at > NOW() - (${days} || ' days')::interval
        AND ${sql.unsafe(realUserOnly('pedagogy_events.user_id'))}
    ),
    b AS (
      SELECT *, COALESCE(prior_step < 2, prior_interval = 0) AS is_learning FROM r
      WHERE prior_interval IS NOT NULL
    )
    SELECT
      CASE
        -- Learning-step answers are minutes apart, not days. Bucketing them as
        -- '1d' would dilute the first real retention number with working-memory hits.
        WHEN is_learning          THEN '<1d (learning)'
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
    FROM b
    GROUP BY 1
    ORDER BY MIN(CASE WHEN is_learning THEN -1 ELSE prior_interval END)
  `;
  return rows as RetentionBucketRow[];
}

export interface WeekRecall {
  /** Reviews of an item the learner hadn't answered for 7+ days. */
  reviews: number;
  remembered: number;
}

/**
 * The one number WordZoo is for: of the words and phrases a learner met again
 * after a week or more away, how many were still there?
 *
 * One learner's own reviews, not the population curve above — the admin curve
 * mixes in every test account. Keyed on `daysAway` (added to the event
 * 2026-09-27), not priorIntervalDays, so a returning learner's first sitting
 * counts. Rolling 90 days, because that is how long pedagogy_events is kept.
 */
export async function getWeekRecall(userId: string): Promise<WeekRecall> {
  const rows = await sql`
    SELECT
      COUNT(*)::int AS reviews,
      COUNT(*) FILTER (WHERE payload->>'rating' <> 'forgot')::int AS remembered
    FROM pedagogy_events
    WHERE event = 'srs_review_recorded'
      AND user_id = ${userId}
      AND payload->>'daysAway' ~ '^[0-9]+$'
      AND (payload->>'daysAway')::int >= 7
  `;
  const r = rows[0] as WeekRecall | undefined;
  return { reviews: r?.reviews ?? 0, remembered: r?.remembered ?? 0 };
}

export interface ConsolidationRow {
  exposure: number;
  words: number;
  phrases: number;
  reached_pct: number;
}

/**
 * How far items actually get. Cumulative "reached at least N exposures", which
 * is the shape that shows the drop-off; the exactly-N histogram reads oddly
 * because a word sitting at 5 reviews is absent from the "3" column.
 *
 * The first measurement of this was stark: 59 -> 38 -> 18 -> 9 words reaching
 * exposures 1-4, i.e. ~85% never reached a fourth. Most of that turned out to
 * be the in-scene inflation bug scheduling items past the horizon rather than
 * learners quitting, so this is the number that should visibly improve now.
 */
export async function getConsolidationFunnel(): Promise<ConsolidationRow[]> {
  const rows = await sql`
    WITH items AS (
      SELECT times_reviewed AS n, 'word' AS kind FROM user_words
      WHERE ${sql.unsafe(realUserOnly('user_words.user_id'))}
      UNION ALL
      SELECT times_reviewed, 'phrase' FROM user_phrases
      WHERE ${sql.unsafe(realUserOnly('user_phrases.user_id'))}
    ),
    steps AS (SELECT generate_series(1, 6) AS exposure)
    SELECT
      s.exposure::int AS exposure,
      COUNT(*) FILTER (WHERE i.kind = 'word'   AND i.n >= s.exposure)::int AS words,
      COUNT(*) FILTER (WHERE i.kind = 'phrase' AND i.n >= s.exposure)::int AS phrases,
      ROUND(100.0 * COUNT(*) FILTER (WHERE i.n >= s.exposure)
            / NULLIF(COUNT(*), 0), 1)::float AS reached_pct
    FROM steps s CROSS JOIN items i
    GROUP BY s.exposure
    ORDER BY s.exposure
  `;
  return rows as ConsolidationRow[];
}

export interface ScheduleHealth {
  max_interval_days: number;
  p95_interval_days: number;
  items_over_365d: number;
  items_over_4x_age: number;
  mean_ease: number;
  items_at_min_ease: number;
  leeches: number;
}

/**
 * Whether the scheduler is producing sane numbers at all.
 *
 * This exists because nothing was watching. Every in-scene drill tap used to
 * multiply interval_days, and it ran unnoticed until a word was scheduled
 * 9,300 days out and a phrase 145,313 days out (398 years).
 *
 * `items_over_4x_age` is the honesty check: an item predicted far beyond the
 * time the learner has even owned it cannot have earned that from its review
 * history. It should sit at 0. If it starts climbing, something is compounding
 * again.
 */
export async function getScheduleHealth(): Promise<ScheduleHealth> {
  const rows = await sql`
    WITH i AS (
      SELECT interval_days, ease_factor, lapses,
             GREATEST(1, (NOW()::date - created_at::date)) AS age_days
      FROM user_words
      WHERE ${sql.unsafe(realUserOnly('user_words.user_id'))}
      UNION ALL
      SELECT interval_days, ease_factor, lapses,
             GREATEST(1, (NOW()::date - created_at::date))
      FROM user_phrases
      WHERE ${sql.unsafe(realUserOnly('user_phrases.user_id'))}
    )
    SELECT
      COALESCE(MAX(interval_days), 0)::int AS max_interval_days,
      COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY interval_days), 0)::int AS p95_interval_days,
      COUNT(*) FILTER (WHERE interval_days > 365)::int          AS items_over_365d,
      COUNT(*) FILTER (WHERE interval_days > 4 * age_days)::int AS items_over_4x_age,
      COALESCE(ROUND(AVG(ease_factor)::numeric, 3), 0)::float   AS mean_ease,
      COUNT(*) FILTER (WHERE ease_factor <= 1.31)::int          AS items_at_min_ease,
      COUNT(*) FILTER (WHERE lapses >= 6)::int                  AS leeches
    FROM i
  `;
  return rows[0] as ScheduleHealth;
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
             EXTRACT(EPOCH FROM (NOW() - uw.next_review_at)) / 86400 AS late, 'word' AS kind
      FROM user_words uw JOIN words w ON w.id = uw.word_id
      WHERE ${sql.unsafe(DUE_WORD_SCOPE)}
      UNION ALL
      SELECT 'due now', 0,
             EXTRACT(EPOCH FROM (NOW() - uph.next_review_at)) / 86400, 'phrase'
      FROM user_phrases uph
      JOIN scene_phrases sp ON sp.id = uph.phrase_id
      JOIN scenes s ON s.id = sp.scene_id
      JOIN paths p ON p.id = s.path_id
      WHERE ${sql.unsafe(DUE_PHRASE_SCOPE)}
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
  /** Failures after graduating. The leech criterion — see LEECH_LAPSES. */
  lapses: number;
  accuracy_pct: number;
  interval_days: number;
  ease_factor: number;
  learners: number;
}

/**
 * Items the scheduler is now capping as leeches — items forgotten repeatedly
 * *after* graduating. Must stay in sync with LEECH_LAPSES in lib/srs/engine.ts.
 *
 * This used to key off lifetime accuracy (>=8 reviews at <50%), which in
 * practice never fired: the highest times_reviewed in the whole database is 10,
 * on a single word. `lapses` counts the thing that actually matters — failing a
 * word you had already learned — so the threshold is reachable.
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
      MAX(uw.lapses)::int AS lapses,
      ROUND(100.0 * SUM(uw.times_correct) / NULLIF(SUM(uw.times_reviewed), 0), 1)::float AS accuracy_pct,
      MAX(uw.interval_days)::int AS interval_days,
      ROUND(AVG(uw.ease_factor)::numeric, 2)::float AS ease_factor,
      COUNT(DISTINCT uw.user_id)::int AS learners
    FROM user_words uw
    JOIN words w ON w.id = uw.word_id
    JOIN languages l ON l.id = w.language_id
    WHERE uw.lapses >= 6
      AND ${sql.unsafe(realUserOnly('uw.user_id'))}
    GROUP BY w.id, w.text, w.meaning_en, l.code
    ORDER BY lapses DESC, accuracy_pct ASC
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
      AND ${sql.unsafe(realUserOnly('pedagogy_events.user_id'))}
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
      (SELECT COUNT(DISTINCT user_id)::int FROM user_words
         WHERE ${sql.unsafe(realUserOnly('user_words.user_id'))}) AS learners,
      (SELECT COUNT(*)::int FROM user_words
         WHERE ${sql.unsafe(realUserOnly('user_words.user_id'))}) AS words_tracked,
      (SELECT COUNT(*)::int FROM user_words WHERE times_reviewed > 0
         AND ${sql.unsafe(realUserOnly('user_words.user_id'))}) AS words_reviewed,
      (SELECT COALESCE(ROUND(AVG(times_correct::numeric / NULLIF(times_reviewed, 0)) * 100, 1), 0)::float
         FROM user_words WHERE times_reviewed >= 3
           AND ${sql.unsafe(realUserOnly('user_words.user_id'))}) AS mean_accuracy_pct,
      (SELECT COUNT(*)::int FROM user_words uw JOIN words w ON w.id = uw.word_id
         WHERE ${sql.unsafe(DUE_WORD_SCOPE)}) AS overdue_words,
      (SELECT COUNT(*)::int FROM user_phrases uph
         JOIN scene_phrases sp ON sp.id = uph.phrase_id
         JOIN scenes s ON s.id = sp.scene_id
         JOIN paths p ON p.id = s.path_id
         WHERE ${sql.unsafe(DUE_PHRASE_SCOPE)}) AS overdue_phrases
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

export interface UserBacklogRow {
  email_masked: string;
  activeLanguage: string | null;
  dueWords: number;
  duePhrases: number;
  /** Introduced items still in the learning steps (learning_step < 2). */
  learningItems: number;
}

/**
 * Per-learner backlog for the morning digest: who is behind, in the language they are
 * actually studying. Real users active in the last 30 days only; emails masked because
 * the digest is committed to git.
 */
export async function getUserBacklog(days = 30): Promise<UserBacklogRow[]> {
  const rows = (await sql`
    WITH recent AS (
      SELECT user_id FROM pedagogy_events
        WHERE user_id IS NOT NULL AND created_at > NOW() - (${days} || ' days')::interval
      UNION SELECT user_id FROM user_words
        WHERE last_reviewed_at > NOW() - (${days} || ' days')::interval
      UNION SELECT user_id FROM user_phrases
        WHERE last_reviewed_at > NOW() - (${days} || ' days')::interval
      UNION SELECT user_id FROM user_streaks
        WHERE last_active_date >= CURRENT_DATE - ${days}::int
    ),
    act AS (
      SELECT u.id AS user_id, u.email, ${sql.unsafe(activeLanguageId('u.id'))} AS language_id
      FROM users u JOIN recent r ON r.user_id = u.id
      WHERE ${sql.unsafe(realUserOnly('u.id'))}
    )
    SELECT
      a.email, l.code AS active_language,
      (SELECT COUNT(*)::int FROM user_words uw JOIN words w ON w.id = uw.word_id
         WHERE uw.user_id = a.user_id AND w.language_id = a.language_id
           AND uw.status <> 'new' AND uw.next_review_at <= NOW()) AS due_words,
      (SELECT COUNT(*)::int FROM user_phrases uph
         JOIN scene_phrases sp ON sp.id = uph.phrase_id
         JOIN scenes s ON s.id = sp.scene_id
         JOIN paths p ON p.id = s.path_id
         WHERE uph.user_id = a.user_id AND p.language_id = a.language_id
           AND uph.status <> 'new' AND uph.next_review_at <= NOW()) AS due_phrases,
      (SELECT COUNT(*)::int FROM user_words uw JOIN words w ON w.id = uw.word_id
         WHERE uw.user_id = a.user_id AND w.language_id = a.language_id
           AND uw.status <> 'new' AND uw.learning_step < 2)
      + (SELECT COUNT(*)::int FROM user_phrases uph
         JOIN scene_phrases sp ON sp.id = uph.phrase_id
         JOIN scenes s ON s.id = sp.scene_id
         JOIN paths p ON p.id = s.path_id
         WHERE uph.user_id = a.user_id AND p.language_id = a.language_id
           AND uph.status <> 'new' AND uph.learning_step < 2) AS learning_items
    FROM act a
    LEFT JOIN languages l ON l.id = a.language_id
  `) as Array<{
    email: string;
    active_language: string | null;
    due_words: number;
    due_phrases: number;
    learning_items: number;
  }>;
  // Sorted here: Postgres can't ORDER BY an expression over output aliases.
  return rows
    .sort((a, b) => b.due_words + b.due_phrases - (a.due_words + a.due_phrases) || a.email.localeCompare(b.email))
    .map((r) => ({
      email_masked: maskEmail(r.email),
      activeLanguage: r.active_language,
      dueWords: r.due_words,
      duePhrases: r.due_phrases,
      learningItems: r.learning_items,
    }));
}
