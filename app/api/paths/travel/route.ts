import { NextRequest, NextResponse, after } from 'next/server';
import { TravelPackSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Path } from '@/types/database';
import { checkRateLimit } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';
import { generateTravelPack } from '@/lib/services/custom-path-service';
import { enrichPath } from '@/lib/services/path-enrichment-service';

// Path generation + post-response enrichment (mnemonics, images, TTS) need
// far more than the default budget; after() shares this route's duration.
export const maxDuration = 300;

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
    const userId = session.user.id;
    const { destination, duration, languageId, useCases, tripDays, tripStartDate } = parsed.data;
    const path = await generateTravelPack(
      userId,
      destination,
      duration,
      languageId,
      useCases ?? [],
      tripDays,
    );

    if (tripStartDate || tripDays) {
      const { upsertUserPathWithTrip } = await import('@/lib/db/queries');
      const startDate = tripStartDate ?? new Date().toISOString().slice(0, 10);
      // Average words per scene; the dashboard divides scenes across trip days.
      await upsertUserPathWithTrip(session.user.id, path.id, startDate, 6);
    }

    after(() => enrichPath(path.id, userId));

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
