import { NextRequest, NextResponse } from 'next/server';
import { RegenerateMnemonicSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { MnemonicCandidate } from '@/types/ai';
import type { Mnemonic } from '@/types/database';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import {
  regenerateMnemonic,
  generateSceneImage,
  saveMnemonic,
} from '@/lib/services/mnemonic-service';
import { checkAccess, incrementUsage } from '@/lib/services/billing-service';

interface RegenerateResponse {
  mnemonic: Mnemonic;
  candidates: MnemonicCandidate[];
  recommended: number;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`mnemonics:regenerate:${ip}`);
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
  const parsed = RegenerateMnemonicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { wordId, excludeKeywords } = parsed.data;
    const userId = session.user.id;

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
    const message = error instanceof Error ? error.message : 'Failed to regenerate mnemonic';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
