import { NextRequest, NextResponse, after } from 'next/server';
import { CustomPathSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { Path } from '@/types/database';
import { guardSpend } from '@/lib/spend-guard';
import { generateCustomPath } from '@/lib/services/custom-path-service';
import { enrichPath } from '@/lib/services/path-enrichment-service';
import { readJson } from '@/lib/api/request';

// Path generation + post-response enrichment (mnemonics, images, TTS) need
// far more than the default budget; after() shares this route's duration.
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Premium-only, and additionally capped: one custom path fans out to a
  // mnemonic + image + TTS clip for every word in it.
  const guard = await guardSpend('path_generate', { feature: 'custom_path' });
  if (!guard.ok) return guard.response;

  const jsonBody = await readJson(request);
  if (!jsonBody.ok) return jsonBody.response;
  const body = jsonBody.data;
  const parsed = CustomPathSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { languageId, userInput } = parsed.data;
    const userId = guard.userId;
    const path = await generateCustomPath(userId, userInput, languageId);

    after(() => enrichPath(path.id, userId));

    return NextResponse.json<ApiResponse<Path>>({
      data: path,
      error: null,
    });
  } catch (error) {
    console.error('[app/api/paths/custom/route.ts]', error);
    const message = 'Failed to generate custom path';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
