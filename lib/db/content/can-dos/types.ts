/**
 * Can-do statements: the capability layer's content.
 *
 * One scene decomposes into 2-4 communicative acts. Each is certified by a
 * single delayed (>=48h), unaided production test — see
 * app/api/can-dos/[canDoId]/certify/route.ts.
 *
 * These files are AI-drafted by lib/db/generate-can-dos.ts and then HAND-EDITED.
 * The hand-edited file is the source of truth: the generator refuses to
 * overwrite an existing file without --force, precisely so a re-run can't
 * silently discard that editing pass. Seed with lib/db/seed-can-dos.ts.
 */
export interface CanDoData {
  /** Deterministic, derived from the scene id so re-seeds upsert cleanly. */
  id: string;
  sceneId: string;
  /** First-person CEFR voice: "I can ask a driver how much a ride costs". */
  statement_en: string;
  /**
   * The test task. A SITUATION, never a translation exercise, and it must not
   * contain the target-language answer or any of its words — the learner sees
   * this and nothing else.
   */
  prompt_en: string;
  /** One natural answer. Grader reference only; never shown before a verdict. */
  reference_target: string;
  /** Free-text note on what else counts. Hand-edited. */
  accept_notes?: string;
  /**
   * Lemmas any correct answer must contain, checked before spending a Gemini
   * call. Prefer [] — an over-strict entry rejects a valid answer for free,
   * with no appeal.
   */
  must_include: string[];
  sort_order: number;
}
