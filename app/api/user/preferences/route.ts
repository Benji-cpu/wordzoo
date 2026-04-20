import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { auth } from '@/lib/auth';
import {
  getUserProfile,
  updateUserNativeLanguage,
  updateUserPreferences,
} from '@/lib/db/queries';
import type { ApiResponse } from '@/types/api';

const PreferencesSchema = z.object({
  nativeLanguage: z.string().min(2).max(10).optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }
  const profile = await getUserProfile(session.user.id);
  return NextResponse.json<ApiResponse<typeof profile>>({ data: profile, error: null });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }
  const body = await request.json();
  const parsed = PreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid request body' },
      { status: 400 }
    );
  }
  const { nativeLanguage, preferences } = parsed.data;
  if (nativeLanguage) {
    await updateUserNativeLanguage(session.user.id, nativeLanguage);
  }
  if (preferences) {
    await updateUserPreferences(session.user.id, preferences);
  }
  return NextResponse.json<ApiResponse<{ ok: true }>>({ data: { ok: true }, error: null });
}
