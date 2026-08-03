import { NextRequest, NextResponse } from 'next/server';
import { RegenerateMnemonicSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { MnemonicCandidate } from '@/types/ai';
import type { Mnemonic } from '@/types/database';
import { guardSpend } from '@/lib/spend-guard';
import {
  regenerateMnemonic,
  generateSceneImage,
  saveMnemonic,
} from '@/lib/services/mnemonic-service';
import { checkAccess, incrementUsage } from '@/lib/services/billing-service';
import { setCurrentMnemonic } from '@/lib/db/queries';
import { readJson } from '@/lib/api/request';

interface RegenerateResponse {
  mnemonic: Mnemonic;
  candidates: MnemonicCandidate[];
  recommended: number;
}

export async function POST(request: NextRequest) {
  // Gemini + a fresh image generation + a Blob write per call.
  const guard = await guardSpend('mnemonic_regenerate');
  if (!guard.ok) return guard.response;

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
  const parsed = RegenerateMnemonicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { wordId, excludeKeywords } = parsed.data;
    const userId = guard.userId;

    // Check billing access
    const access = await checkAccess(userId, 'regenerate_mnemonic');
    if (!access.allowed) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: access.upgradeMessage ?? 'Daily limit reached' },
        { status: 403 }
      );
    }

    const result = await regenerateMnemonic(wordId, userId, excludeKeywords);
    const candidate = result.candidates[result.recommended];

    const imageUrl = await generateSceneImage(candidate.imagePrompt);
    const mnemonic = await saveMnemonic(wordId, userId, candidate, imageUrl);

    // Pin the fresh mnemonic so it wins selection on the next review
    await setCurrentMnemonic(userId, wordId, mnemonic.id);

    await incrementUsage(userId, 'regenerate_mnemonic');

    return NextResponse.json<ApiResponse<RegenerateResponse>>({
      data: {
        mnemonic,
        candidates: result.candidates,
        recommended: result.recommended,
      },
      error: null,
    });
  } catch (error) {
    console.error('[app/api/mnemonics/regenerate/route.ts]', error);
    const message = 'Failed to regenerate mnemonic';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
