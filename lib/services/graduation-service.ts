import type { Word } from '@/types/database';
import {
  getSceneMasteryForPath,
  getPathWordStats,
  getRandomPathWordsForQuiz,
  upsertUserPath,
  getPathsByLanguage,
  getPathById,
} from '@/lib/db/queries';

export interface GraduationData {
  eligible: boolean;
  quizWords: Word[];
  stats: {
    totalWords: number;
    wordsMastered: number;
    completedScenes: number;
    totalScenes: number;
  };
}

export async function checkGraduation(
  userId: string,
  pathId: string
): Promise<GraduationData> {
  const sceneMastery = await getSceneMasteryForPath(userId, pathId);
  const wordStats = await getPathWordStats(userId, pathId);

  const completedScenes = sceneMastery.filter(
    (s) => s.total_words > 0 && s.mastered_words >= s.total_words
  ).length;
  const totalScenes = sceneMastery.length;
  const eligible = totalScenes > 0 && completedScenes >= totalScenes;

  // Only fetch quiz words if eligible
  const quizWords = eligible
    ? await getRandomPathWordsForQuiz(pathId, 15)
    : [];

  return {
    eligible,
    quizWords,
    stats: {
      totalWords: wordStats.total_words,
      wordsMastered: wordStats.words_mastered,
      completedScenes,
      totalScenes,
    },
  };
}

export interface GraduationResult {
  graduated: boolean;
  nextPathSuggestion: { id: string; title: string } | null;
}

export async function completeGraduation(
  userId: string,
  pathId: string,
  quizScore: number
): Promise<GraduationResult> {
  if (quizScore < 80) {
    return { graduated: false, nextPathSuggestion: null };
  }

  // Mark path as completed
  await upsertUserPath(userId, pathId, 'completed');

  // Find a next path suggestion
  const currentPath = await getPathById(pathId);
  let nextPathSuggestion: { id: string; title: string } | null = null;

  if (currentPath) {
    const languagePaths = await getPathsByLanguage(currentPath.language_id, userId);
    const otherPath = languagePaths.find((p) => p.id !== pathId);
    if (otherPath) {
      nextPathSuggestion = { id: otherPath.id, title: otherPath.title };
    }
  }

  return { graduated: true, nextPathSuggestion };
}
