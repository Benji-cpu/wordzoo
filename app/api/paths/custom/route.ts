import { NextRequest, NextResponse } from 'next/server';
import { CustomPathSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Path } from '@/types/database';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { generateCustomPath } from '@/lib/services/custom-path-service';
import { checkAccess } from '@/lib/services/billing-service';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`paths:custom:${ip}`);
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
  const parsed = CustomPathSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    // Check billing access
    const access = await checkAccess(session.user.id, 'custom_path');
    if (!access.allowed) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: access.upgradeMessage ?? 'Premium feature' },
        { status: 403 }
      );
    }

    const { languageId, userInput } = parsed.data;
    const path = await generateCustomPath(session.user.id, userInput, languageId);

    return NextResponse.json<ApiResponse<Path>>({
      data: path,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate custom path';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
