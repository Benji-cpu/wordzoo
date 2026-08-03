import { NextRequest, NextResponse } from 'next/server';
import { RegenerateFromFeedbackSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Mnemonic } from '@/types/database';
import { guardSpend } from '@/lib/spend-guard';
import { regenerateMnemonicFromFeedback } from '@/lib/services/mnemonic-service';
import { checkAccess, incrementUsage } from '@/lib/services/billing-service';
import { setCurrentMnemonic } from '@/lib/db/queries';
import { readJson } from '@/lib/api/request';

export async function POST(request: NextRequest) {
  // Gemini + a fresh image generation + a Blob write per call.
  const guard = await guardSpend('mnemonic_regenerate');
  if (!guard.ok) return guard.response;

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
  const parsed = RegenerateFromFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { mnemonicId, comment } = parsed.data;
    const userId = guard.userId;

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
    console.error('[app/api/mnemonics/regenerate-feedback/route.ts]', error);
    const message = 'Failed to regenerate mnemonic';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
