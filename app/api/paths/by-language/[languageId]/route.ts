import { NextRequest, NextResponse } from 'next/server';
import { LanguageIdParamSchema } from '@/types/api';
import type { ApiResponse } from '@/types/api';
import { auth } from '@/lib/auth';
import { getPathsByLanguage, getSceneMasteryForPath, getPathWordStats } from '@/lib/db/queries';
import type { PathWithProgress } from '@/lib/services/path-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ languageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { languageId } = await params;
  const parsed = LanguageIdParamSchema.safeParse({ languageId });
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Invalid languageId parameter' },
      { status: 400 }
    );
  }

  try {
    const userId = session.user.id;
    const paths = await getPathsByLanguage(parsed.data.languageId, userId);

    // Enrich each path with progress
    const pathsWithProgress: PathWithProgress[] = await Promise.all(
      paths.map(async (path) => {
        const sceneMastery = await getSceneMasteryForPath(userId, path.id);
        const wordStats = await getPathWordStats(userId, path.id);
        const completedScenes = sceneMastery.filter(
          (s) => s.total_words > 0 && s.mastered_words >= s.total_words
        ).length;

        return {
          ...path,
          completedScenes,
          totalScenes: sceneMastery.length,
          wordsLearned: wordStats.words_learned,
          wordsMastered: wordStats.words_mastered,
          totalWords: wordStats.total_words,
          percentComplete:
            wordStats.total_words > 0
              ? Math.round((wordStats.words_mastered / wordStats.total_words) * 100)
              : 0,
        };
      })
    );

    return NextResponse.json<ApiResponse<PathWithProgress[]>>({
      data: pathsWithProgress,
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch paths';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: message },
      { status: 500 }
    );
  }
}
