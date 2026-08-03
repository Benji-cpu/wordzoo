import { NextRequest, NextResponse, after } from 'next/server';
import { TravelPackSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Path } from '@/types/database';
import { guardSpend } from '@/lib/spend-guard';
import { generateTravelPack } from '@/lib/services/custom-path-service';
import { enrichPath } from '@/lib/services/path-enrichment-service';
import { readJson } from '@/lib/api/request';

// Path generation + post-response enrichment (mnemonics, images, TTS) need
// far more than the default budget; after() shares this route's duration.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Travel packs stay available to free users — this is the $4.99 product, not
  // a premium feature — but the generation itself is capped. Deliberately NOT
  // gated on `custom_path`: that would make the paid pack premium-only.
  const guard = await guardSpend('path_generate');
  if (!guard.ok) return guard.response;

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
  const parsed = TravelPackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const userId = guard.userId;
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
      await upsertUserPathWithTrip(userId, path.id, startDate, 6);
    }

    // Only the free teaser scene is enriched before payment. TripCommit calls
    // this route BEFORE creating the Stripe checkout session, so enriching the
    // whole path here meant every abandoned checkout cost us a full fan-out of
    // mnemonics + images + TTS (~40 words) for $0. The rest is enriched from
    // the trip dashboard once a purchase exists.
    after(() => enrichPath(path.id, userId, { maxScenes: 1 }));

    return NextResponse.json<ApiResponse<Path>>({
      data: path,
      error: null,
    });
  } catch (error) {
    console.error('[app/api/paths/travel/route.ts]', error);
    const message = 'Failed to generate travel pack';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
