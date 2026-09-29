import { NextRequest, NextResponse, after } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { guardSpend } from '@/lib/spend-guard';
import { readJson } from '@/lib/api/request';
import { generateChatJSON } from '@/lib/ai/gemini';
import {
  cooldownForFails,
  decideCertifyAction,
  normalizeLoose,
  parseCertifyRequest,
  restingFeedback,
  GIVE_UP_COOLDOWN_HOURS,
  type CertifyMode,
} from '@/lib/pedagogy/can-do-certify';
import { sql } from '@/lib/db/client';
import { getCertifiableCanDo, recordCanDoAttempt, recordCanDoGiveUp } from '@/lib/db/can-do-queries';

/**
 * Certifies a can-do: one delayed, unaided production attempt, graded strictly.
 *
 * Contract: STRICT, and deliberately the mirror image of in-lesson
 * conversation practice (ConversationBlock), which is ACCEPT-AND-COACH: it
 * advances on every branch, because walling a learner in mid-lesson is worse
 * than a generous verdict. Correct there; disqualifying here. A test that
 * cannot be failed certifies nothing.
 *
 * Lesson practice is matched locally against authored answers (no model);
 * certification stays model-graded because the attempt is free production
 * with no answer list. The reference is loaded server-side and the client
 * sends `attempt` and nothing else.
 *
 * Ambiguity resolves to `unclear`, never to `pass`.
 *
 * State is never an error. A duplicate POST after a pass, or a POST while the
 * can-do is resting, is a 200 with the settled result (`alreadySettled: true`),
 * no model call and no strike. The attempt UPDATE is guarded on
 * status = 'unlocked' AND eligible_at <= NOW(), so concurrent requests can't
 * downgrade a certified row or stack strikes. `gaveUp` is the "I don't know"
 * exit: no model call, no strike, a 12h rest, and the scene's phrases come back
 * for study.
 *
 * The request schema lives in lib/pedagogy/can-do-certify.ts, not types/api.ts.
 */

type Verdict = 'pass' | 'fail' | 'unclear';

interface CertifyResult {
  verdict: Verdict | 'gave_up';
  feedback: string;
  /** The reference answer. Revealed ONLY alongside a verdict, never before. */
  reference: string | null;
  acceptNotes: string | null;
  nextEligibleAt: string | null;
  certified: boolean;
  /** True when this request changed nothing: the row was already certified or resting. */
  alreadySettled: boolean;
  gaveUp: boolean;
}

type CanDo = NonNullable<Awaited<ReturnType<typeof getCertifiableCanDo>>>;

/**
 * Fire-and-forget, but inside after() so the serverless function isn't frozen
 * before the insert lands. Outside a request scope after() throws; fall back to
 * a plain floating promise.
 */
function emit(userId: string, event: string, payload: Record<string, unknown>): void {
  const insert = () =>
    sql`
      INSERT INTO pedagogy_events (user_id, event, payload)
      VALUES (${userId}, ${event}, ${JSON.stringify(payload)}::jsonb)
    `.then(() => undefined);
  try {
    after(async () => {
      try {
        await insert();
      } catch {}
    });
  } catch {
    void insert().catch(() => {});
  }
}

function json(data: CertifyResult) {
  return NextResponse.json<ApiResponse<CertifyResult>>({ data, error: null });
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
  const parsed = parseCertifyRequest(jsonBody.data);
  if (!parsed.ok) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: parsed.error },
      { status: 400 },
    );
  }
  const { attempt, gaveUp, mode } = parsed.value;

  const canDo = await getCertifiableCanDo(guard.userId, canDoId);
  if (!canDo) {
    // No row means they never completed the scene. Don't confirm the can-do
    // exists — that would leak content to anyone reading ids out of devtools.
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Not found' },
      { status: 404 },
    );
  }

  const decision = decideCertifyAction(
    { status: canDo.status, eligibleAt: canDo.eligible_at },
    { gaveUp },
    Date.now(),
  );

  // The 48h gate is enforced HERE, not just hidden in the UI. Otherwise anyone
  // could certify the moment they finished the scene and the delay — the entire
  // point of the test — would be decorative.
  if (decision.action === 'return_settled') return json(settledResult(canDo, decision));

  if (decision.action === 'give_up') return giveUp(guard.userId, canDo, decision.cooldownHours, mode);

  return grade(guard.userId, canDo, attempt ?? '', mode);
}

/** The row is already certified, or resting: report it, change nothing. */
function settledResult(
  canDo: Pick<CanDo, 'reference_target'>,
  decision: { status: 'certified' } | { status: 'resting'; nextEligibleAt: string },
): CertifyResult {
  if (decision.status === 'certified') {
    return {
      verdict: 'pass',
      feedback: 'Already certified',
      reference: canDo.reference_target,
      acceptNotes: null,
      nextEligibleAt: null,
      certified: true,
      alreadySettled: true,
      gaveUp: false,
    };
  }
  return {
    verdict: 'unclear',
    feedback: restingFeedback(decision.nextEligibleAt, Date.now()),
    // Held back: it isn't tested yet, so the answer stays hidden.
    reference: null,
    acceptNotes: null,
    nextEligibleAt: decision.nextEligibleAt,
    certified: false,
    alreadySettled: true,
    gaveUp: false,
  };
}

/**
 * A guarded write matched no rows: another request settled the row between our
 * read and our write. Re-read and report whatever it is now.
 */
async function raceLost(userId: string, canDo: CanDo) {
  const fresh = await getCertifiableCanDo(userId, canDo.can_do_id);
  const decision = fresh
    ? decideCertifyAction({ status: fresh.status, eligibleAt: fresh.eligible_at }, { gaveUp: false }, Date.now())
    : null;
  if (decision?.action === 'return_settled') return json(settledResult(canDo, decision));
  // Still eligible and unlocked (clock skew at the boundary): nothing was
  // recorded, so say so and let them try again. No strike either way.
  return json({
    verdict: 'unclear',
    feedback: 'We couldn’t check that just now — try again in a moment.',
    reference: null,
    acceptNotes: null,
    nextEligibleAt: null,
    certified: false,
    alreadySettled: true,
    gaveUp: false,
  });
}

async function giveUp(userId: string, canDo: CanDo, restHours: number, mode: CertifyMode) {
  const result = await recordCanDoGiveUp(userId, canDo.can_do_id, restHours);
  if (!result) return raceLost(userId, canDo);

  emit(userId, 'can_do_gave_up', {
    canDoId: canDo.can_do_id,
    sceneId: canDo.scene_id,
    mode,
    attemptNumber: canDo.attempts,
    restHours: GIVE_UP_COOLDOWN_HOURS,
    phrasesReset: result.phrasesReset,
    hoursSinceUnlock: hoursSince(canDo.unlocked_at),
  });

  return json({
    verdict: 'gave_up',
    feedback: 'No problem — here’s how it goes. We’ll bring these phrases back for practice.',
    reference: canDo.reference_target,
    acceptNotes: canDo.accept_notes,
    nextEligibleAt: result.nextEligibleAt,
    certified: false,
    alreadySettled: false,
    gaveUp: true,
  });
}

function hoursSince(iso: string): number {
  return Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
}

async function grade(userId: string, canDo: CanDo, attempt: string, mode: CertifyMode) {
  const normalizedAttempt = normalizeLoose(attempt);

  // --- Deterministic pre-checks, before spending a Gemini call ---

  // Pasting the English prompt back is not an attempt.
  if (normalizedAttempt === normalizeLoose(canDo.prompt_en)) {
    return settle(userId, canDo, 'fail', attempt, mode, 'That’s the prompt — try saying it in the target language.', true);
  }

  // must_include is checked literally. It ships empty for most can-dos on
  // purpose: a wrong lemma rejects a valid answer before the grader ever runs.
  const missing = (canDo.must_include ?? []).filter(
    (lemma) => !normalizedAttempt.includes(normalizeLoose(lemma)),
  );
  if (missing.length > 0) {
    return settle(userId, canDo, 'fail', attempt, mode, 'Not quite — have another look at how this is phrased.', true);
  }

  // --- Strict grade ---

  const systemPrompt =
    'You are certifying whether a language learner can perform a communicative act unaided. ' +
    'PASS only if a native speaker in this situation would understand the attempt AND it performs the stated act. ' +
    'Minor spelling, accent, and word-order slips are fine — this is about communication, not orthography. ' +
    (mode === 'spoken'
      ? 'The attempt is a speech-recognition transcript of what the learner said aloud: ignore punctuation, casing and missing accents, ' +
        'and forgive a homophone the recogniser plausibly picked. '
      : '') +
    'FAIL if it is in the wrong language, is English, omits the core act, is a fragment that does not communicate the goal, ' +
    'or performs a different act than the one asked for. ' +
    'If you genuinely cannot tell, return "unclear" — do not guess, and do not default to passing. ' +
    'Reply with JSON only: {"verdict":"pass"|"fail"|"unclear","reason":"<one short sentence, max 14 words>"}';

  const userMsg =
    `Act to certify: ${canDo.statement_en}\n` +
    `Situation given to the learner: ${canDo.prompt_en}\n` +
    `A natural reference answer: ${canDo.reference_target}\n` +
    (canDo.accept_notes ? `Also acceptable: ${canDo.accept_notes}\n` : '') +
    (mode === 'spoken' ? `Learner said (speech transcript): ${attempt}` : `Learner wrote: ${attempt}`);

  let verdict: Verdict = 'unclear';
  let reason = '';
  try {
    const { data } = await generateChatJSON<{ verdict?: string; reason?: string }>(
      [{ role: 'user', content: userMsg }],
      systemPrompt,
      { maxOutputTokens: 200 },
    );
    // Anything that is not literally pass or fail is unclear — never a
    // default pass.
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

  return settle(userId, canDo, verdict, attempt, mode, feedback, false);
}

async function settle(
  userId: string,
  canDo: CanDo,
  verdict: Verdict,
  attempt: string,
  mode: CertifyMode,
  feedback: string,
  precheckFailed: boolean,
) {
  // `unclear` costs nothing: no strike, no cooldown, no attempt counted. A
  // grader outage must not be indistinguishable from the learner getting it
  // wrong.
  const cooldown = verdict === 'fail' ? cooldownForFails(canDo.fails + 1) : null;

  const applied = await recordCanDoAttempt(userId, canDo.can_do_id, verdict, attempt, feedback, cooldown);
  if (!applied) return raceLost(userId, canDo);

  emit(userId, verdict === 'pass' ? 'can_do_certified' : verdict === 'fail' ? 'can_do_failed' : 'can_do_unclear', {
    canDoId: canDo.can_do_id,
    sceneId: canDo.scene_id,
    verdict,
    mode,
    precheckFailed,
    attemptChars: attempt.length,
    attemptNumber: verdict === 'unclear' ? canDo.attempts : canDo.attempts + 1,
    hoursSinceUnlock: hoursSince(canDo.unlocked_at),
  });

  const nextEligibleAt = cooldown
    ? new Date(Date.now() + cooldown * 3_600_000).toISOString()
    : null;

  return json({
    verdict,
    feedback,
    // Revealed only now that the verdict is locked in. On `unclear` we hold
    // it back — they still have an untainted attempt coming.
    reference: verdict === 'unclear' ? null : canDo.reference_target,
    acceptNotes: verdict === 'fail' ? canDo.accept_notes : null,
    nextEligibleAt,
    certified: verdict === 'pass',
    alreadySettled: false,
    gaveUp: false,
  });
}
