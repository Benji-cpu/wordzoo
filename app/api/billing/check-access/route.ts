import { NextRequest, NextResponse } from 'next/server';
import { CheckAccessSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { checkAccess } from '@/lib/services/billing-service';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`billing:check-access:${ip}`);
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
  const parsed = CheckAccessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const result = await checkAccess(session.user.id, parsed.data.feature);
    return NextResponse.json<ApiResponse<typeof result>>({
      data: result,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check access';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
