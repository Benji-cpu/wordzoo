import { NextRequest, NextResponse } from 'next/server';
import { GenerateMnemonicSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { MnemonicCandidate } from '@/types/ai';
import type { Mnemonic } from '@/types/database';
import { guardSpend } from '@/lib/spend-guard';
import { readJson } from '@/lib/api/request';
import {
  generateMnemonic,
  generateSceneImage,
  saveMnemonic,
} from '@/lib/services/mnemonic-service';

interface GenerateResponse {
  mnemonic: Mnemonic;
  candidates: MnemonicCandidate[];
  recommended: number;
}

export async function POST(request: NextRequest) {
  // Gemini (8192 output tokens) + an image generation + a Blob write per call,
  // and IntroduceBatch fires this in parallel for every unenriched word in a
  // scene. This is the single most expensive endpoint in the app.
  const guard = await guardSpend('mnemonic_generate');
  if (!guard.ok) return guard.response;

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
  const parsed = GenerateMnemonicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { wordId } = parsed.data;
    const userId = guard.userId;

    const result = await generateMnemonic(wordId, userId);
    const candidate = result.candidates[result.recommended];

    // A mnemonic without an image still renders via the keyword fallback
    // card — don't let image generation (Blob quota, model hiccups) sink
    // the whole mnemonic.
    let imageUrl: string | null = null;
    try {
      imageUrl = await generateSceneImage(candidate.imagePrompt);
    } catch (error) {
      console.error('Mnemonic image generation failed, saving without image:', error);
    }
    const mnemonic = await saveMnemonic(wordId, userId, candidate, imageUrl);

    return NextResponse.json<ApiResponse<GenerateResponse>>({
      data: {
        mnemonic,
        candidates: result.candidates,
        recommended: result.recommended,
      },
      error: null,
    });
  } catch (error) {
    console.error('[app/api/mnemonics/generate/route.ts]', error);
    const message = 'Failed to generate mnemonic';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
