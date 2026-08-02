import { NextRequest, NextResponse } from 'next/server';
import { TripPreviewSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { TripPreviewResponse } from '@/lib/trip/types';
import { guardAnonymousSpend } from '@/lib/spend-guard';
import { previewTravelPack } from '@/lib/services/custom-path-service';
import { getLanguageByCode, getLanguageById } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  // Unauthenticated Gemini call — the only spend gate here is the caller's IP,
  // so it must be a durable one. 3/hour is generous for a real trip planner
  // and useless as a free generation endpoint.
  const guard = await guardAnonymousSpend(request, 'trip_preview');
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const parsed = TripPreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { destination, tripDays, useCases, languageId: requestedId } = parsed.data;

  try {
    const language = requestedId
      ? await getLanguageById(requestedId)
      : await getLanguageByCode('id');

    if (!language) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Language not found. Run `npm run db:seed` first.' },
        { status: 500 }
      );
    }

    const generated = await previewTravelPack(
      destination,
      `${tripDays} days`,
      language.id,
      useCases,
      tripDays,
    );

    const response: TripPreviewResponse = {
      pathTitle: generated.pathTitle,
      pathDescription: generated.pathDescription,
      destination,
      tripDays,
      useCases,
      languageId: language.id,
      languageCode: language.code,
      scenes: generated.scenes.map((s) => ({
        title: s.title,
        narrative: s.narrative,
        words: s.words.map((w) => ({
          text: w.text,
          romanization: w.romanization,
          meaning: w.meaning,
          partOfSpeech: w.part_of_speech,
        })),
      })),
    };

    return NextResponse.json<ApiResponse<TripPreviewResponse>>({
      data: response,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate trip preview';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
