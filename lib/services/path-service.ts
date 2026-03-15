import type { Path } from '@/types/database';
import {
  getUserActivePath,
  getSceneMasteryForPath,
  getPathWordStats,
  getSceneWordsWithDetails,
  getOverdueWordsForPreviousScenes,
  getSceneById,
  getSceneNumberInPath,
  getPathById,
} from '@/lib/db/queries';
import type { SceneWordWithDetails, OverdueWordRow, SceneMasteryRow } from '@/lib/db/queries';

// --- Exported Types ---

export interface PathWithProgress extends Path {
  completedScenes: number;
  totalScenes: number;
  wordsLearned: number;
  wordsMastered: number;
  totalWords: number;
  percentComplete: number;
}

export interface SceneWordData {
  wordId: string;
  text: string;
  romanization: string | null;
  pronunciationAudioUrl: string | null;
  meaningEn: string;
  partOfSpeech: string;
  sortOrder: number;
  userWordStatus: string | null;
  mnemonic: {
    id: string;
    keywordText: string;
    sceneDescription: string;
    imageUrl: string | null;
  } | null;
}

export interface SceneLearningData {
  scene: {
    id: string;
    title: string;
    description: string | null;
    pathId: string;
  };
  narrativeSetup: string | null;
  wordsToLearn: SceneWordData[];
  reviewFirst: SceneWordData[];
  sceneNumber: number;
  totalScenes: number;
}

export interface NextSceneData {
  scene: {
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
  } | null;
  reviewFirst: SceneWordData[];
  allScenesCompleted: boolean;
}

// --- Helper Functions ---

function mapWordRow(row: SceneWordWithDetails | OverdueWordRow, sortOrder?: number): SceneWordData {
  return {
    wordId: row.word_id,
    text: row.text,
    romanization: row.romanization,
    pronunciationAudioUrl: row.pronunciation_audio_url,
    meaningEn: row.meaning_en,
    partOfSpeech: row.part_of_speech,
    sortOrder: 'sort_order' in row ? row.sort_order : (sortOrder ?? 0),
    userWordStatus: row.user_word_status ?? null,
    mnemonic: row.mnemonic_id
      ? {
          id: row.mnemonic_id,
          keywordText: row.keyword_text ?? '',
          sceneDescription: row.scene_description ?? '',
          imageUrl: row.image_url,
        }
      : null,
  };
}

function computeProgress(
  sceneMastery: SceneMasteryRow[],
  wordStats: { total_words: number; words_learned: number; words_mastered: number }
): { completedScenes: number; totalScenes: number; percentComplete: number } {
  const completedScenes = sceneMastery.filter((s) => s.total_words > 0 && s.mastered_words >= s.total_words).length;
  const totalScenes = sceneMastery.length;
  const percentComplete = wordStats.total_words > 0
    ? Math.round((wordStats.words_mastered / wordStats.total_words) * 100)
    : 0;
  return { completedScenes, totalScenes, percentComplete };
}

// --- Public Functions ---

export async function getActivePath(userId: string): Promise<PathWithProgress | null> {
  const activeRow = await getUserActivePath(userId);
  if (!activeRow) return null;

  const path = await getPathById(activeRow.path_id);
  if (!path) return null;

  const sceneMastery = await getSceneMasteryForPath(userId, path.id);
  const wordStats = await getPathWordStats(userId, path.id);
  const { completedScenes, totalScenes, percentComplete } = computeProgress(sceneMastery, wordStats);

  return {
    ...path,
    completedScenes,
    totalScenes,
    wordsLearned: wordStats.words_learned,
    wordsMastered: wordStats.words_mastered,
    totalWords: wordStats.total_words,
    percentComplete,
  };
}

export async function getNextScene(
  userId: string,
  pathId: string
): Promise<NextSceneData> {
  const sceneMastery = await getSceneMasteryForPath(userId, pathId);

  // Find first scene not fully mastered
  const nextScene = sceneMastery.find((s) => s.total_words === 0 || s.mastered_words < s.total_words);

  if (!nextScene) {
    return { scene: null, reviewFirst: [], allScenesCompleted: true };
  }

  // Get overdue review words from earlier scenes
  const overdueRows = await getOverdueWordsForPreviousScenes(
    userId,
    pathId,
    nextScene.sort_order,
    5
  );

  return {
    scene: {
      id: nextScene.id,
      title: nextScene.title,
      description: nextScene.description,
      sortOrder: nextScene.sort_order,
    },
    reviewFirst: overdueRows.map((r, i) => mapWordRow(r, i)),
    allScenesCompleted: false,
  };
}

export async function getPathProgress(
  userId: string,
  pathId: string
): Promise<{
  completedScenes: number;
  totalScenes: number;
  wordsLearned: number;
  wordsMastered: number;
  totalWords: number;
  percentComplete: number;
  scenes: Array<{ id: string; title: string; sortOrder: number; totalWords: number; masteredWords: number }>;
}> {
  const sceneMastery = await getSceneMasteryForPath(userId, pathId);
  const wordStats = await getPathWordStats(userId, pathId);
  const { completedScenes, totalScenes, percentComplete } = computeProgress(sceneMastery, wordStats);

  return {
    completedScenes,
    totalScenes,
    wordsLearned: wordStats.words_learned,
    wordsMastered: wordStats.words_mastered,
    totalWords: wordStats.total_words,
    percentComplete,
    scenes: sceneMastery.map((s) => ({
      id: s.id,
      title: s.title,
      sortOrder: s.sort_order,
      totalWords: s.total_words,
      masteredWords: s.mastered_words,
    })),
  };
}

export async function getSceneForLearning(
  userId: string,
  sceneId: string
): Promise<SceneLearningData | null> {
  const scene = await getSceneById(sceneId);
  if (!scene) return null;

  const [wordRows, { sceneNumber, totalScenes }] = await Promise.all([
    getSceneWordsWithDetails(sceneId, userId),
    getSceneNumberInPath(sceneId, scene.path_id),
  ]);

  // Get overdue words from earlier scenes
  const overdueRows = await getOverdueWordsForPreviousScenes(
    userId,
    scene.path_id,
    scene.sort_order,
    5
  );

  return {
    scene: {
      id: scene.id,
      title: scene.title,
      description: scene.description,
      pathId: scene.path_id,
    },
    narrativeSetup: scene.description,
    wordsToLearn: wordRows.map((r) => mapWordRow(r)),
    reviewFirst: overdueRows.map((r, i) => mapWordRow(r, i)),
    sceneNumber,
    totalScenes,
  };
}
