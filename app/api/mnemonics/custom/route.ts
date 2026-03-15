import { NextRequest, NextResponse } from 'next/server';
import { CustomMnemonicSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Mnemonic } from '@/types/database';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import {
  generateFromUserKeyword,
  generateSceneImage,
  saveMnemonic,
} from '@/lib/services/mnemonic-service';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`mnemonics:custom:${ip}`);
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
  const parsed = CustomMnemonicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { wordId, keyword } = parsed.data;
    const userId = session.user.id;

    const candidate = await generateFromUserKeyword(wordId, userId, keyword);

    const imageUrl = await generateSceneImage(candidate.imagePrompt);
    const mnemonic = await saveMnemonic(wordId, userId, candidate, imageUrl, true);

    return NextResponse.json<ApiResponse<Mnemonic>>({
      data: mnemonic,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create custom mnemonic';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
