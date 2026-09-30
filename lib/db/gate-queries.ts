import { sql } from './client';
import { decideGate, GATE_THRESHOLD, PACE_WINDOW_DAYS, type GateResult } from '@/lib/pedagogy/gate';

/**
 * Should this scene open, or wait for a practice round? Counts FRAGILE items
 * in the scene's own path language: due now, past 'new', and either still in
 * the learning steps or on an interval of 3 days or less. Mature items never
 * block. The scene's own words and phrases are excluded (they can't be
 * "before" it), and a scene the learner already started or finished is open.
 */
export async function getNewContentGate(userId: string, sceneId: string): Promise<GateResult> {
  const rows = (await sql`
    SELECT p.language_id,
           (usp.id IS NOT NULL) AS started,
           (usp.completed_at IS NOT NULL) AS completed
    FROM scenes s
    JOIN paths p ON p.id = s.path_id
    LEFT JOIN user_scene_progress usp ON usp.scene_id = s.id AND usp.user_id = ${userId}
    WHERE s.id = ${sceneId}
  `) as { language_id: string; started: boolean; completed: boolean }[];

  const row = rows[0];
  if (!row) return { open: true, fragileDue: 0, threshold: GATE_THRESHOLD, languageId: null };

  // Already in the scene: it is open whatever the backlog, so skip the count.
  if (row.started || row.completed) {
    return { ...decideGate({ fragileDue: 0, sceneStarted: row.started, sceneCompleted: row.completed }), languageId: row.language_id };
  }

  const [words, phrases] = await Promise.all([
    sql`
      SELECT COUNT(*)::int AS count
      FROM user_words uw
      JOIN words w ON w.id = uw.word_id
      WHERE uw.user_id = ${userId}
        AND w.language_id = ${row.language_id}::uuid
        AND uw.next_review_at <= NOW()
        AND uw.status <> 'new'
        AND (uw.learning_step < 2 OR uw.interval_days <= 3)
        AND NOT EXISTS (
          SELECT 1 FROM scene_words sw WHERE sw.scene_id = ${sceneId} AND sw.word_id = uw.word_id
        )
    `,
    sql`
      SELECT COUNT(*)::int AS count
      FROM user_phrases up
      JOIN scene_phrases sp ON sp.id = up.phrase_id
      JOIN scenes s ON s.id = sp.scene_id
      JOIN paths p ON p.id = s.path_id
      WHERE up.user_id = ${userId}
        AND p.language_id = ${row.language_id}::uuid
        AND sp.scene_id <> ${sceneId}
        AND up.next_review_at <= NOW()
        AND up.status <> 'new'
        AND (up.learning_step < 2 OR up.interval_days <= 3)
    `,
  ]);

  const fragileDue =
    ((words[0] as { count: number } | undefined)?.count ?? 0) +
    ((phrases[0] as { count: number } | undefined)?.count ?? 0);

  return {
    ...decideGate({ fragileDue, sceneStarted: false, sceneCompleted: false }),
    languageId: row.language_id,
  };
}

/** Scenes the learner finished in the last PACE_WINDOW_DAYS days on this path. */
export async function getRecentSceneCompletions(
  userId: string,
  pathId: string,
  days: number = PACE_WINDOW_DAYS,
): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM user_scene_progress usp
    JOIN scenes s ON s.id = usp.scene_id
    WHERE usp.user_id = ${userId}
      AND s.path_id = ${pathId}
      AND usp.completed_at IS NOT NULL
      AND usp.completed_at > NOW() - make_interval(days => ${days}::int)
  `;
  return (rows[0] as { count: number } | undefined)?.count ?? 0;
}
