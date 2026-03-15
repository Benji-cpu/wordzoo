import { NextRequest, NextResponse } from 'next/server';
import { IncrementUsageSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { incrementUsage } from '@/lib/services/billing-service';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`billing:usage:${ip}`);
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
  const parsed = IncrementUsageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    await incrementUsage(session.user.id, parsed.data.feature, parsed.data.amount);
    return NextResponse.json<ApiResponse<{ success: boolean }>>({
      data: { success: true },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to increment usage';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
