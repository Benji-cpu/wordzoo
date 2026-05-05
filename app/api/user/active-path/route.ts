import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { upsertUserPath, getPremadePathByLanguageCode } from '@/lib/db';

const PatchSchema = z.object({
  // Caller may send a specific pathId, or just the target language code
  // (in which case we resolve to that language's premade path).
  pathId: z.string().uuid().optional(),
  languageCode: z.string().min(2).max(8).optional(),
}).refine((v) => v.pathId || v.languageCode, {
  message: 'pathId or languageCode is required',
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  let pathId = parsed.data.pathId;
  if (!pathId && parsed.data.languageCode) {
    const path = await getPremadePathByLanguageCode(parsed.data.languageCode);
    if (!path) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: `No path available for language "${parsed.data.languageCode}"` },
        { status: 404 }
      );
    }
    pathId = path.id;
  }

  try {
    await upsertUserPath(session.user.id, pathId!, 'active');
    return NextResponse.json<ApiResponse<{ pathId: string }>>(
      { data: { pathId: pathId! }, error: null }
    );
  } catch (error) {
    console.error('Set active path error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Failed to set active path' },
      { status: 500 }
    );
  }
}
