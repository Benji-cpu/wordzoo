import { NextRequest, NextResponse } from 'next/server';
import { CustomMnemonicSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Mnemonic } from '@/types/database';
import { guardSpend } from '@/lib/spend-guard';
import { incrementUsage } from '@/lib/services/billing-service';
import { readJson } from '@/lib/api/request';
import {
  generateFromUserKeyword,
  generateSceneImage,
  saveMnemonic,
} from '@/lib/services/mnemonic-service';

export async function POST(request: NextRequest) {
  // Identical economics to /regenerate (Gemini + image + Blob), so it gets the
  // same quota. Previously this route was free while /regenerate cost one — a
  // learner could bypass the regeneration limit just by supplying a keyword.
  const guard = await guardSpend('mnemonic_custom', { feature: 'regenerate_mnemonic' });
  if (!guard.ok) return guard.response;

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
  const parsed = CustomMnemonicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { wordId, keyword } = parsed.data;
    const userId = guard.userId;

    const candidate = await generateFromUserKeyword(wordId, userId, keyword);

    // Image failure must not sink the mnemonic — the keyword fallback card
    // still renders. Mirrors /api/mnemonics/generate.
    let imageUrl: string | null = null;
    try {
      imageUrl = await generateSceneImage(candidate.imagePrompt);
    } catch (error) {
      console.error('Custom mnemonic image generation failed, saving without image:', error);
    }
    const mnemonic = await saveMnemonic(wordId, userId, candidate, imageUrl, true);
    await incrementUsage(userId, 'regenerate_mnemonic');

    return NextResponse.json<ApiResponse<Mnemonic>>({
      data: mnemonic,
      error: null,
    });
  } catch (error) {
    console.error('[app/api/mnemonics/custom/route.ts]', error);
    const message = 'Failed to create custom mnemonic';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
