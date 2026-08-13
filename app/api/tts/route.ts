import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { auth } from '@/lib/auth';
import { claimSpend } from '@/lib/spend-ledger';
import { isAdminEmail } from '@/lib/auth/admin';
import { hasTtsVoice, synthesizeCached, RATE_WORD, RATE_SENTENCE } from '@/lib/ai/google-tts';
import type { ApiResponse } from '@/types/api';

/**
 * Speak any text in the app's real voice.
 *
 * The seed scripts already give every word and mnemonic a Google Neural clip,
 * but until this route existed there was no way to reach that voice at runtime,
 * so everything else — narration, feedback, tutor replies — fell through to the
 * browser's built-in synthesiser. That, not missing clips, is the robotic voice
 * people hear.
 *
 * Returns a URL rather than audio bytes: the clip lives in Blob under a hash of
 * its own text, so the browser caches it, the CDN caches it, and the second
 * person to hear a given sentence costs nothing at all.
 */

const TtsSchema = z.object({
  // Long enough for a mnemonic scene, short enough that nobody can bill us for
  // a novel. Anything longer belongs in the offline seed pipeline.
  text: z.string().trim().min(1).max(600),
  lang: z.string().min(2).max(8),
  /** Isolated vocabulary is spoken slower than connected speech. */
  kind: z.enum(['word', 'sentence']).default('sentence'),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const parsed = TtsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 },
    );
  }

  const { text, lang, kind } = parsed.data;
  if (!hasTtsVoice(lang)) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: `No voice configured for language "${lang}"` },
      { status: 400 },
    );
  }

  const rate = kind === 'word' ? RATE_WORD : RATE_SENTENCE;

  try {
    // Charging happens between the lookup and the synthesis, deliberately.
    // Guarding the whole route would bill a learner for re-reading a page whose
    // every line is already cached, and the budget exists to cap generation,
    // not listening.
    const attempt = await synthesizeCached(text, lang, rate);
    if (attempt.cached) {
      return NextResponse.json<ApiResponse<{ url: string; cached: boolean }>>({
        data: { url: attempt.url, cached: true },
        error: null,
      });
    }

    if (!isAdminEmail(session.user?.email ?? null)) {
      const claimed = await claimSpend(`user:${userId}`, 'tts_synthesize');
      if (!claimed) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Speech generation limit reached. Try again later.' },
          { status: 429 },
        );
      }
    }

    return NextResponse.json<ApiResponse<{ url: string; cached: boolean }>>({
      data: { url: attempt.url, cached: false },
      error: null,
    });
  } catch {
    // The caller falls back to the browser voice, so a failure here is a
    // downgrade rather than silence. Nothing to leak in the message.
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Could not generate speech' },
      { status: 502 },
    );
  }
}
