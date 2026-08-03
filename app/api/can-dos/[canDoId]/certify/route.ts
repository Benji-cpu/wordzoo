import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import type { ApiResponse } from '@/types/api';
import { guardSpend } from '@/lib/spend-guard';
import { readJson } from '@/lib/api/request';
import { generateChatJSON } from '@/lib/ai/gemini';
import { normalizeForCompare } from '@/lib/pedagogy/normalize';
import { sql } from '@/lib/db/client';
import { getCertifiableCanDo, recordCanDoAttempt } from '@/lib/db/can-do-queries';

/**
 * Certifies a can-do: one delayed, unaided production attempt, graded strictly.
 *
 * Contract: STRICT, and deliberately the mirror image of
 * /api/scenes/[sceneId]/conversation-grade. That route is ACCEPT-AND-COACH —
 * it advances on every branch, defaults ambiguity to accept, and passes on
 * every error, because walling a learner in mid-lesson is worse than a
 * generous verdict. Correct there; disqualifying here. A test that cannot be
 * failed certifies nothing.
 *
 * Four reasons this is a separate route rather than a `mode` flag on that one:
 *  1. One function with two contradictory failure semantics is how a silently
 *     lenient certifier ships and goes unnoticed for a month.
 *  2. Different budget — conversation_grade is 120/day for in-lesson coaching.
 *  3. Different authorization. That route checks scene access; certification is
 *     reached from /review where no scene is in scope, so the real check is
 *     "does this user own an eligible user_can_dos row".
 *  4. That route takes `expected` from the client. Harmless when the verdict is
 *     cosmetic; fatal when it certifies. This one accepts `attempt` and nothing
 *     else, and loads the reference server-side.
 *
 * Ambiguity resolves to `unclear`, never to `pass`.
 */

const CertifySchema = z.object({
  attempt: z.string().min(1).max(500),
});

type Verdict = 'pass' | 'fail' | 'unclear';

interface CertifyResult {
  verdict: Verdict;
  feedback: string;
  /** The reference answer. Revealed ONLY alongside a verdict, never before. */
  reference: string | null;
  acceptNotes: string | null;
  nextEligibleAt: string | null;
  certified: boolean;
}

/** Hours before a failed can-do can be retried. Escalates a little on repeats. */
function cooldownForFails(failCount: number): number {
  return failCount >= 3 ? 72 : 24;
}

function emit(userId: string, event: string, payload: Record<string, unknown>): void {
  void sql`
    INSERT INTO pedagogy_events (user_id, event, payload)
    VALUES (${userId}, ${event}, ${JSON.stringify(payload)}::jsonb)
  `.catch(() => {});
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ canDoId: string }> },
) {
  const guard = await guardSpend('can_do_certify');
  if (!guard.ok) return guard.response;

  const { canDoId } = await ctx.params;

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const parsed = CertifySchema.safeParse(jsonBody.data);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 },
    );
  }
  const attempt = parsed.data.attempt.trim();

  const canDo = await getCertifiableCanDo(guard.userId, canDoId);
  if (!canDo) {
    // No row means they never completed the scene. Don't confirm the can-do
    // exists — that would leak content to anyone reading ids out of devtools.
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Not found' },
      { status: 404 },
    );
  }

  if (canDo.status === 'certified') {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Already certified' },
      { status: 403 },
    );
  }

  // The 48h gate is enforced HERE, not just hidden in the UI. Otherwise anyone
  // could certify the moment they finished the scene and the delay — the entire
  // point of the test — would be decorative.
  if (new Date(canDo.eligible_at).getTime() > Date.now()) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Not yet eligible' },
      { status: 403 },
    );
  }

  const normalizedAttempt = normalizeForCompare(attempt);

  // --- Deterministic pre-checks, before spending a Gemini call ---

  // Pasting the English prompt back is not an attempt.
  if (normalizedAttempt === normalizeForCompare(canDo.prompt_en)) {
    return settle(guard.userId, canDo, 'fail', attempt, 'That’s the prompt — try saying it in the target language.', true);
  }

  // must_include is checked literally. It ships empty for most can-dos on
  // purpose: a wrong lemma rejects a valid answer before the grader ever runs.
  const missing = (canDo.must_include ?? []).filter(
    (lemma) => !normalizedAttempt.includes(normalizeForCompare(lemma)),
  );
  if (missing.length > 0) {
    return settle(guard.userId, canDo, 'fail', attempt, 'Not quite — have another look at how this is phrased.', true);
  }

  // --- Strict grade ---

  const systemPrompt =
    'You are certifying whether a language learner can perform a communicative act unaided. ' +
    'PASS only if a native speaker in this situation would understand the attempt AND it performs the stated act. ' +
    'Minor spelling, accent, and word-order slips are fine — this is about communication, not orthography. ' +
    'FAIL if it is in the wrong language, is English, omits the core act, is a fragment that does not communicate the goal, ' +
    'or performs a different act than the one asked for. ' +
    'If you genuinely cannot tell, return "unclear" — do not guess, and do not default to passing. ' +
    'Reply with JSON only: {"verdict":"pass"|"fail"|"unclear","reason":"<one short sentence, max 14 words>"}';

  const userMsg =
    `Act to certify: ${canDo.statement_en}\n` +
    `Situation given to the learner: ${canDo.prompt_en}\n` +
    `A natural reference answer: ${canDo.reference_target}\n` +
    (canDo.accept_notes ? `Also acceptable: ${canDo.accept_notes}\n` : '') +
    `Learner wrote: ${attempt}`;

  let verdict: Verdict = 'unclear';
  let reason = '';
  try {
    const { data } = await generateChatJSON<{ verdict?: string; reason?: string }>(
      [{ role: 'user', content: userMsg }],
      systemPrompt,
      { maxOutputTokens: 200 },
    );
    // Anything that is not literally pass or fail is unclear. Note the
    // asymmetry with conversation-grade's `accept: data?.accept !== false`.
    if (data?.verdict === 'pass') verdict = 'pass';
    else if (data?.verdict === 'fail') verdict = 'fail';
    else verdict = 'unclear';
    reason = typeof data?.reason === 'string' ? data.reason : '';
  } catch {
    verdict = 'unclear';
    reason = '';
  }

  const feedback =
    verdict === 'pass'
      ? reason || 'That works — certified.'
      : verdict === 'fail'
        ? reason || 'Not quite yet.'
        : 'We couldn’t check that just now — try again in a moment.';

  return settle(guard.userId, canDo, verdict, attempt, feedback, false);
}

async function settle(
  userId: string,
  canDo: NonNullable<Awaited<ReturnType<typeof getCertifiableCanDo>>>,
  verdict: Verdict,
  attempt: string,
  feedback: string,
  precheckFailed: boolean,
) {
  // `unclear` costs nothing: no strike, no cooldown. A grader outage must not
  // be indistinguishable from the learner getting it wrong.
  const cooldown = verdict === 'fail' ? cooldownForFails(canDo.fails + 1) : null;

  await recordCanDoAttempt(userId, canDo.can_do_id, verdict, attempt, feedback, cooldown);

  emit(userId, verdict === 'pass' ? 'can_do_certified' : verdict === 'fail' ? 'can_do_failed' : 'can_do_unclear', {
    canDoId: canDo.can_do_id,
    sceneId: canDo.scene_id,
    verdict,
    precheckFailed,
    attemptChars: attempt.length,
    attemptNumber: canDo.attempts + 1,
    hoursSinceUnlock: Math.round(
      (Date.now() - new Date(canDo.unlocked_at).getTime()) / 3_600_000,
    ),
  });

  const nextEligibleAt = cooldown
    ? new Date(Date.now() + cooldown * 3_600_000).toISOString()
    : null;

  return NextResponse.json<ApiResponse<CertifyResult>>({
    data: {
      verdict,
      feedback,
      // Revealed only now that the verdict is locked in. On `unclear` we hold
      // it back — they still have an untainted attempt coming.
      reference: verdict === 'unclear' ? null : canDo.reference_target,
      acceptNotes: verdict === 'fail' ? canDo.accept_notes : null,
      nextEligibleAt,
      certified: verdict === 'pass',
    },
    error: null,
  });
}
