/**
 * The capability layer's query surface.
 *
 * Domain file, imported by full path — lib/db/index.ts is a hand-maintained
 * barrel for queries.ts + scene-flow-queries.ts only.
 */

import { sql } from './client';

/** How long after finishing a scene before its can-dos can be certified. */
export const CAN_DO_DELAY_HOURS = 48;

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
    ORDER BY ucd.eligible_at ASC
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
        COUNT(*) FILTER (WHERE ucd.status = 'unlocked' AND ucd.eligible_at <= NOW())::int AS due_now
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
      ucd.status, ucd.eligible_at::text, ucd.attempts, ucd.fails,
      ucd.unlocked_at::text
    FROM user_can_dos ucd
    JOIN can_dos cd ON cd.id = ucd.can_do_id
    WHERE ucd.user_id = ${userId} AND ucd.can_do_id = ${canDoId}
  `;
  return (rows[0] as CertifiableCanDo) ?? null;
}

export async function recordCanDoAttempt(
  userId: string,
  canDoId: string,
  verdict: 'pass' | 'fail' | 'unclear',
  attemptText: string,
  feedback: string,
  cooldownHours: number | null
): Promise<void> {
  // One statement so a pass can't half-apply. `unclear` deliberately touches
  // neither fails nor eligible_at: a grader outage must not cost the learner a
  // strike or a day's cooldown.
  await sql`
    UPDATE user_can_dos SET
      attempts = attempts + 1,
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
  `;
}
