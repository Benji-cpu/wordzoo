import { NextRequest, NextResponse } from 'next/server';
import { StudioSuggestionsSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import type { StudioChip } from '@/types/database';
import { auth } from '@/lib/auth';
import { generateSubScenarioChips } from '@/lib/services/studio-service';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = StudioSuggestionsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const { sessionId, scenario } = parsed.data;
    const chips = await generateSubScenarioChips(sessionId, scenario);

    return NextResponse.json<ApiResponse<StudioChip[]>>({
      data: chips,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate suggestions';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
