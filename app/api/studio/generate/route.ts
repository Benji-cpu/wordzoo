import { NextRequest, NextResponse, after } from 'next/server';
import { StudioGenerateSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Path } from '@/types/database';
import { guardSpend } from '@/lib/spend-guard';
import { generateStudioPath } from '@/lib/services/studio-service';
import { enrichPath } from '@/lib/services/path-enrichment-service';
import { readJson } from '@/lib/api/request';
import {
  getUserById,
  getUnconsumedStudioPathPurchase,
  consumeStudioPathPurchase,
} from '@/lib/db/queries';

// Path generation + post-response enrichment (mnemonics, images, TTS) need
// far more than the default budget; after() shares this route's duration.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // One studio path fans out to a mnemonic + image + TTS per word.
  const guard = await guardSpend('path_generate');
  if (!guard.ok) return guard.response;

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
  const parsed = StudioGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { sessionId } = parsed.data;
    const userId = guard.userId;

    // Billing: allow premium OR anyone with an unconsumed studio_path purchase
    const user = await getUserById(userId);
    const isPremium = user?.subscription_tier === 'premium';

    const purchase = isPremium
      ? null
      : await getUnconsumedStudioPathPurchase(userId, sessionId);

    if (!isPremium && !purchase) {
      return NextResponse.json<ApiResponse<{ needsPayment: boolean }>>(
        { data: { needsPayment: true }, error: null },
        { status: 200 }
      );
    }

    const path = await generateStudioPath(sessionId, userId);

    // Mark purchase consumed only after successful generation
    if (purchase) {
      await consumeStudioPathPurchase(purchase.id, path.id);
    }

    after(() => enrichPath(path.id, userId));

    return NextResponse.json<ApiResponse<{ path: Path }>>({
      data: { path },
      error: null,
    });
  } catch (error) {
    console.error('[app/api/studio/generate/route.ts]', error);
    const message = 'Failed to generate studio path';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
