/**
 * The capability layer's query surface.
 *
 * Domain file, imported by full path — lib/db/index.ts is a hand-maintained
 * barrel for queries.ts + scene-flow-queries.ts only.
 */

import { sql } from './client';

export { CAN_DO_DELAY_HOURS } from './can-do-delay';
import { CAN_DO_DELAY_HOURS } from './can-do-delay';

export interface DueCanDo {
  can_do_id: string;
  scene_id: string;
  scene_title: string;
  statement_en: string;
  prompt_en: string;
  attempts: number;
  fails: number;
}

/**
 * Can-dos this learner is eligible to certify right now.
 *
 * Due = the time rules (unlocked, eligible_at passed) AND readiness: the scene's
 * words and phrases are all out of the learning phase (learning_step >= 2, see
 * GRADUATED in lib/srs/engine.ts). A row the learner has never met doesn't
 * block; one still being learned does. Testing production of phrases the
 * learner hasn't consolidated just books a strike; the reviews that would fix
 * that are already in the same sitting. can_dos has no phrase FK, so readiness
 * is scene-level.
 *
 * Note what is NOT selected: reference_target and accept_notes. They are the
 * answer, and this payload is server-rendered into the review page. The test is
 * only unaided if the answer never reaches the client before a verdict — it
 * arrives in the certify response and nowhere else.
 */
export async function getDueCanDos(
  userId: string,
  limit = 5,
  languageId?: string | null
): Promise<DueCanDo[]> {
  const rows = await sql`
    SELECT
      cd.id AS can_do_id, cd.scene_id, s.title AS scene_title,
      cd.statement_en, cd.prompt_en,
      ucd.attempts, ucd.fails
    FROM user_can_dos ucd
    JOIN can_dos cd ON cd.id = ucd.can_do_id
    JOIN scenes s ON s.id = cd.scene_id
    JOIN paths p ON p.id = s.path_id
    WHERE ucd.user_id = ${userId}
      AND ucd.status = 'unlocked'
      AND ucd.eligible_at <= NOW()
      AND (${languageId ?? null}::uuid IS NULL OR p.language_id = ${languageId ?? null}::uuid)
      AND NOT EXISTS (
        SELECT 1 FROM scene_words sw
        JOIN user_words uw ON uw.word_id = sw.word_id AND uw.user_id = ${userId}
        WHERE sw.scene_id = cd.scene_id AND uw.learning_step < 2
      )
      AND NOT EXISTS (
        SELECT 1 FROM scene_phrases sp
        JOIN user_phrases up ON up.phrase_id = sp.id AND up.user_id = ${userId}
        WHERE sp.scene_id = cd.scene_id AND up.learning_step < 2
      )
    -- A scene's can-dos share one eligible_at; sort_order makes their order stable.
    ORDER BY ucd.eligible_at ASC, cd.sort_order ASC
    LIMIT ${limit}
  `;
  return rows as DueCanDo[];
}

export interface SceneCanDo {
  id: string;
  statement_en: string;
}

/** Statements for the "N can-dos unlocked" card on the scene summary. */
export async function getCanDosForScene(sceneId: string): Promise<SceneCanDo[]> {
  const rows = await sql`
    SELECT id, statement_en FROM can_dos
    WHERE scene_id = ${sceneId}
    ORDER BY sort_order
  `;
  return rows as SceneCanDo[];
}

/**
 * Unlock a scene's can-dos, scheduled CAN_DO_DELAY_HOURS after the learner
 * finished it.
 *
 * eligible_at is anchored to user_scene_progress.completed_at, not NOW().
 * updateSceneProgress writes `completed_at = COALESCE($1, completed_at)`, so
 * the first completion wins and replays never move it — meaning a learner who
 * re-runs the scene on day 3 doesn't reset their own clock and push the test
 * out forever. ON CONFLICT DO NOTHING is the other half of that guarantee.
 */
export async function unlockCanDosForScene(userId: string, sceneId: string): Promise<number> {
  const rows = await sql`
    INSERT INTO user_can_dos (user_id, can_do_id, unlocked_at, eligible_at)
    SELECT ${userId}, cd.id, usp.completed_at,
           usp.completed_at + (${CAN_DO_DELAY_HOURS} || ' hours')::interval
    FROM can_dos cd
    JOIN user_scene_progress usp
      ON usp.user_id = ${userId} AND usp.scene_id = ${sceneId}
    WHERE cd.scene_id = ${sceneId} AND usp.completed_at IS NOT NULL
    ON CONFLICT (user_id, can_do_id) DO NOTHING
    RETURNING id
  `;
  return rows.length;
}

export interface CanDoInventory {
  certified: number;
  unlocked: number;
  due_now: number;
  recent: { statement_en: string; certified_at: string }[];
}

export async function getCanDoInventory(
  userId: string,
  languageId: string | null
): Promise<CanDoInventory> {
  const [counts, recent] = await Promise.all([
    sql`
      SELECT
        COUNT(*) FILTER (WHERE ucd.status = 'certified')::int AS certified,
        COUNT(*) FILTER (WHERE ucd.status = 'unlocked')::int AS unlocked,
        -- Same readiness rule as getDueCanDos, so "N ready to certify" is what /review offers.
        COUNT(*) FILTER (
          WHERE ucd.status = 'unlocked' AND ucd.eligible_at <= NOW()
            AND NOT EXISTS (
              SELECT 1 FROM scene_words sw
              JOIN user_words uw ON uw.word_id = sw.word_id AND uw.user_id = ${userId}
              WHERE sw.scene_id = cd.scene_id AND uw.learning_step < 2
            )
            AND NOT EXISTS (
              SELECT 1 FROM scene_phrases sp
              JOIN user_phrases up ON up.phrase_id = sp.id AND up.user_id = ${userId}
              WHERE sp.scene_id = cd.scene_id AND up.learning_step < 2
            )
        )::int AS due_now
      FROM user_can_dos ucd
      JOIN can_dos cd ON cd.id = ucd.can_do_id
      JOIN scenes s ON s.id = cd.scene_id
      JOIN paths p ON p.id = s.path_id
      WHERE ucd.user_id = ${userId}
        AND (${languageId ?? null}::uuid IS NULL OR p.language_id = ${languageId ?? null}::uuid)
    `,
    sql`
      SELECT cd.statement_en, ucd.certified_at::text
      FROM user_can_dos ucd
      JOIN can_dos cd ON cd.id = ucd.can_do_id
      JOIN scenes s ON s.id = cd.scene_id
      JOIN paths p ON p.id = s.path_id
      WHERE ucd.user_id = ${userId}
        AND ucd.status = 'certified'
        AND (${languageId ?? null}::uuid IS NULL OR p.language_id = ${languageId ?? null}::uuid)
      ORDER BY ucd.certified_at DESC
      LIMIT 3
    `,
  ]);

  const c = (counts[0] as { certified: number; unlocked: number; due_now: number }) ?? {
    certified: 0,
    unlocked: 0,
    due_now: 0,
  };
  return {
    ...c,
    recent: recent as { statement_en: string; certified_at: string }[],
  };
}

export interface CertifiableCanDo {
  can_do_id: string;
  scene_id: string;
  statement_en: string;
  prompt_en: string;
  reference_target: string;
  accept_notes: string | null;
  must_include: string[];
  status: string;
  eligible_at: string;
  attempts: number;
  fails: number;
  unlocked_at: string;
}

/**
 * Server-side load for the certify route. Returns null when the learner has no
 * row for this can-do — i.e. they never completed the scene, so there is
 * nothing to certify and no reason to reveal the content.
 */
export async function getCertifiableCanDo(
  userId: string,
  canDoId: string
): Promise<CertifiableCanDo | null> {
  const rows = await sql`
    SELECT
      cd.id AS can_do_id, cd.scene_id, cd.statement_en, cd.prompt_en,
      cd.reference_target, cd.accept_notes, cd.must_include,
      ucd.status,
      -- ISO, not ::text: Postgres text timestamps ('2026-10-01 12:00:00+00') are not reliably Date-parseable.
      to_char(ucd.eligible_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS eligible_at,
      ucd.attempts, ucd.fails, ucd.unlocked_at::text
    FROM user_can_dos ucd
    JOIN can_dos cd ON cd.id = ucd.can_do_id
    WHERE ucd.user_id = ${userId} AND ucd.can_do_id = ${canDoId}
  `;
  return (rows[0] as CertifiableCanDo) ?? null;
}

/**
 * Applies a graded attempt. Returns false when the row was no longer
 * 'unlocked' and eligible (a concurrent request already settled it), in which
 * case nothing was written: a second request can never downgrade a certified
 * row or add a strike. The caller re-reads and returns the settled state.
 */
export async function recordCanDoAttempt(
  userId: string,
  canDoId: string,
  verdict: 'pass' | 'fail' | 'unclear',
  attemptText: string,
  feedback: string,
  cooldownHours: number | null
): Promise<boolean> {
  // One statement so a pass can't half-apply. `unclear` deliberately touches
  // neither attempts, fails nor eligible_at: a grader outage must not cost the
  // learner a strike, an attempt or a day's cooldown.
  const counts = verdict !== 'unclear';
  const rows = await sql`
    UPDATE user_can_dos SET
      attempts = attempts + ${counts ? 1 : 0},
      last_attempt_at = NOW(),
      last_attempt_text = ${attemptText},
      last_verdict = ${verdict},
      last_feedback = ${feedback},
      fails = fails + ${verdict === 'fail' ? 1 : 0},
      status = ${verdict === 'pass' ? 'certified' : 'unlocked'},
      certified_at = CASE WHEN ${verdict === 'pass'} THEN NOW() ELSE certified_at END,
      eligible_at = CASE
        WHEN ${cooldownHours}::int IS NULL THEN eligible_at
        ELSE NOW() + (${cooldownHours}::int || ' hours')::interval
      END,
      updated_at = NOW()
    WHERE user_id = ${userId} AND can_do_id = ${canDoId}
      AND status = 'unlocked' AND eligible_at <= NOW()
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * "I don't know": no strike, no attempt counted, no verdict change. The can-do
 * rests for `restHours`, and the scene's phrases come back for study: one
 * relearn step (learning_step 0, due now if not already sooner) with interval
 * and ease untouched, so this only ever tightens a schedule.
 *
 * Same guard as recordCanDoAttempt; returns null when a concurrent request got
 * there first. One statement (data-modifying CTEs), so the rest and the
 * phrase reset land together.
 */
export async function recordCanDoGiveUp(
  userId: string,
  canDoId: string,
  restHours: number
): Promise<{ nextEligibleAt: string; phrasesReset: number } | null> {
  const rows = await sql`
    WITH upd AS (
      UPDATE user_can_dos SET
        eligible_at = NOW() + (${restHours}::int || ' hours')::interval,
        updated_at = NOW()
      WHERE user_id = ${userId} AND can_do_id = ${canDoId}
        AND status = 'unlocked' AND eligible_at <= NOW()
      RETURNING can_do_id, eligible_at
    ),
    ph AS (
      UPDATE user_phrases up SET
        learning_step = 0,
        next_review_at = LEAST(up.next_review_at, NOW())
      FROM scene_phrases sp, can_dos cd, upd
      WHERE up.user_id = ${userId}
        AND up.phrase_id = sp.id
        AND cd.id = upd.can_do_id
        AND sp.scene_id = cd.scene_id
      RETURNING up.id
    )
    SELECT
      to_char(upd.eligible_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS next_eligible_at,
      (SELECT COUNT(*) FROM ph)::int AS phrases_reset
    FROM upd
  `;
  const r = rows[0] as { next_eligible_at: string; phrases_reset: number } | undefined;
  return r ? { nextEligibleAt: r.next_eligible_at, phrasesReset: r.phrases_reset } : null;
}
