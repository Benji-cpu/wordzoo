import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { ProfileQuerySchema } from '@/types/api';
import { auth } from '@/lib/auth';
import { getOrCreateProfile, getWeaknessReport } from '@/lib/services/learner-profile-service';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = ProfileQuerySchema.safeParse({
    languageId: searchParams.get('languageId'),
  });

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid query parameters' },
      { status: 400 }
    );
  }

  try {
    const [profile, weakness] = await Promise.all([
      getOrCreateProfile(session.user.id, parsed.data.languageId),
      getWeaknessReport(session.user.id, parsed.data.languageId),
    ]);

    return NextResponse.json<ApiResponse<typeof profile & { weakness: typeof weakness }>>({
      data: { ...profile, weakness },
      error: null,
    });
  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}
