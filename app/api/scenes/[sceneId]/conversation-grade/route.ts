import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { generateChatJSON } from '@/lib/ai/gemini';

/**
 * Grades a learner's free-production attempt in the in-scene conversation
 * block (the "hard" tier). Deliberately separate from the tutor message
 * pipeline so it does NOT consume the free-tier tutor budget (3/day) and
 * isn't tied to a stateful 6-turn session.
 *
 * Contract: ACCEPT-AND-COACH. The caller always advances regardless of the
 * verdict; this route only decides whether to celebrate or to gently recast.
 * Any failure (network, rate limit, malformed JSON) returns accept:true so
 * the learner is never walled in (MEMORY: no dead ends).
 */

const GradeSchema = z.object({
  goalEn: z.string().min(1).max(300),
  expected: z.string().min(1).max(300),
  attempt: z.string().min(1).max(500),
  languageName: z.string().min(1).max(40).optional(),
});

interface GradeResult {
  accept: boolean;
  feedback: string;
  reference: string;
}

export async function POST(
  request: NextRequest,
  _ctx: { params: Promise<{ sceneId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 },
    );
  }

  const parsed = GradeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 },
    );
  }

  const { goalEn, expected, attempt, languageName = 'Indonesian' } = parsed.data;

  // Fail-open default — used on any error below.
  const lenientPass: GradeResult = {
    accept: true,
    feedback: 'Nice try — keep going!',
    reference: expected,
  };

  try {
    const systemPrompt =
      `You grade a beginner language learner's short ${languageName} attempt in a guided conversation. ` +
      `Be LENIENT and encouraging: accept the attempt if it communicates the goal in ${languageName}, ` +
      `even with minor spelling, accent, word-order, or politeness differences. ` +
      `Reject ONLY if it is off-topic, in the wrong language, empty, or clearly not an attempt at the goal. ` +
      `Reply with JSON only: {"accept": boolean, "feedback": string}. ` +
      `"feedback" is one short, warm sentence (<= 12 words); if rejecting, nudge toward the goal without shaming.`;
    const userMsg =
      `Goal (English): ${goalEn}\n` +
      `A natural reference answer: ${expected}\n` +
      `Learner wrote: ${attempt}`;

    const { data } = await generateChatJSON<{ accept?: boolean; feedback?: string }>(
      [{ role: 'user', content: userMsg }],
      systemPrompt,
      { maxOutputTokens: 256 },
    );

    const result: GradeResult = {
      accept: data?.accept !== false, // default to accept when ambiguous
      feedback:
        typeof data?.feedback === 'string' && data.feedback.trim()
          ? data.feedback.trim()
          : lenientPass.feedback,
      reference: expected,
    };
    return NextResponse.json<ApiResponse<GradeResult>>({ data: result, error: null });
  } catch {
    // Never block the learner on an AI/network failure.
    return NextResponse.json<ApiResponse<GradeResult>>({ data: lenientPass, error: null });
  }
}
