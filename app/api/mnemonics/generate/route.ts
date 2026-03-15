import { NextRequest, NextResponse } from 'next/server';
import { GenerateMnemonicSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { MnemonicCandidate } from '@/types/ai';
import type { Mnemonic } from '@/types/database';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
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
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`mnemonics:generate:${ip}`);
  if (!allowed) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = GenerateMnemonicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { wordId } = parsed.data;
    const userId = session.user.id;

    const result = await generateMnemonic(wordId, userId);
    const candidate = result.candidates[result.recommended];

    const imageUrl = await generateSceneImage(candidate.imagePrompt);
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
    const message = error instanceof Error ? error.message : 'Failed to generate mnemonic';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
