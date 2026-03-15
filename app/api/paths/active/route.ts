import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { getUserActivePath, getLanguageById } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const activePath = await getUserActivePath(session.user.id);
    if (!activePath) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: null }
      );
    }

    const language = await getLanguageById(activePath.path_language_id);

    return NextResponse.json<ApiResponse<{
      pathId: string;
      pathTitle: string;
      languageId: string;
      languageCode: string | null;
    }>>(
      {
        data: {
          pathId: activePath.path_id,
          pathTitle: activePath.path_title,
          languageId: activePath.path_language_id,
          languageCode: language?.code ?? null,
        },
        error: null,
      }
    );
  } catch (error) {
    console.error('Active path error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Failed to fetch active path' },
      { status: 500 }
    );
  }
}
