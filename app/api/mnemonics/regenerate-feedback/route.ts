import { NextRequest, NextResponse } from 'next/server';
import { RegenerateFromFeedbackSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Mnemonic } from '@/types/database';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { regenerateMnemonicFromFeedback } from '@/lib/services/mnemonic-service';
import { checkAccess, incrementUsage } from '@/lib/services/billing-service';
import { setCurrentMnemonic } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`mnemonics:regenerate-feedback:${ip}`);
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
  const parsed = RegenerateFromFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { mnemonicId, comment } = parsed.data;
    const userId = session.user.id;

    const access = await checkAccess(userId, 'regenerate_mnemonic');
    if (!access.allowed) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: access.upgradeMessage ?? 'Daily limit reached' },
        { status: 403 }
      );
    }

    const mnemonic = await regenerateMnemonicFromFeedback(mnemonicId, {
      userId,
      extraComments: comment ? [comment] : [],
    });

    // Pin it so the replacement actually wins selection on the next review
    await setCurrentMnemonic(userId, mnemonic.word_id, mnemonic.id);

    await incrementUsage(userId, 'regenerate_mnemonic');

    return NextResponse.json<ApiResponse<{ mnemonic: Mnemonic }>>({
      data: { mnemonic },
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
