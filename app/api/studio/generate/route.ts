import { NextRequest, NextResponse } from 'next/server';
import { StudioGenerateSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Path } from '@/types/database';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { generateStudioPath } from '@/lib/services/studio-service';
import {
  getUserById,
  getUnconsumedStudioPathPurchase,
  consumeStudioPathPurchase,
} from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`studio:generate:${ip}`);
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
  const parsed = StudioGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { sessionId } = parsed.data;
    const userId = session.user.id;

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

    return NextResponse.json<ApiResponse<{ path: Path }>>({
      data: { path },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate studio path';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
