import { NextRequest, NextResponse } from 'next/server';
import { TravelPackSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Path } from '@/types/database';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { generateTravelPack } from '@/lib/services/custom-path-service';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { allowed } = checkRateLimit(`paths:travel:${ip}`);
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
  const parsed = TravelPackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { destination, duration, languageId } = parsed.data;
    const path = await generateTravelPack(
      session.user.id,
      destination,
      duration,
      languageId
    );

    return NextResponse.json<ApiResponse<Path>>({
      data: path,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate travel pack';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
