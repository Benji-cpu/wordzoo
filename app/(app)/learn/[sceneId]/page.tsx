import { notFound, redirect } from 'next/navigation';
import {
  getSceneWithLanguage,
  getSceneWordsForLearning,
  getDistractorsForWord,
  getNextSceneInPath,
  getSceneMasteryForPath,
  upsertUserPath,
  getWordFamilies,
} from '@/lib/db/queries';
import { getSceneFlowData, getOrCreateSceneProgress } from '@/lib/db/scene-flow-queries';
import { auth } from '@/lib/auth';
import { LearnClient, type LearnWord } from '@/components/learn/LearnClient';
import { SceneFlowClient } from '@/components/learn/SceneFlowClient';
import { getInsightState } from '@/lib/db/insight-queries';
import type { SupportedLanguageCode } from '@/types/audio';

interface PageProps {
  params: Promise<{ sceneId: string }>;
}

async function buildWordsArray(
  sceneId: string,
  languageId: string,
  userId: string | null
): Promise<LearnWord[]> {
  const sceneWords = await getSceneWordsForLearning(sceneId, userId);
  return Promise.all(
    sceneWords.map(async (sw) => {
      const [distractors, families] = await Promise.all([
        getDistractorsForWord(sw.word_id, languageId, sw.meaning_en, 3),
        getWordFamilies(sw.word_id),
      ]);
      return {
        word: {
          id: sw.word_id,
          text: sw.text,
          romanization: sw.romanization,
          meaning_en: sw.meaning_en,
          part_of_speech: sw.part_of_speech,
          pronunciation_audio_url: sw.pronunciation_audio_url,
          informal_text: sw.informal_text ?? null,
          register: sw.register ?? 'neutral',
        },
        mnemonic: sw.mnemonic_id
          ? {
              id: sw.mnemonic_id,
              keyword_text: sw.keyword_text!,
              scene_description: sw.scene_description!,
              bridge_sentence: sw.bridge_sentence ?? null,
              image_url: sw.image_url,
            }
          : null,
        distractors,
        userWordStatus: sw.user_word_status ?? null,
        wordFamilies: families.length > 0
          ? families.map(f => ({
              affix_type: f.affix_type,
              derived_word: f.derived_text,
              derived_meaning: f.derived_meaning_en,
              meaning_shift: f.meaning_shift ?? '',
            }))
          : undefined,
      };
    })
  );
}

export default async function LearnPage({ params }: PageProps) {
  const { sceneId } = await params;

  const scene = await getSceneWithLanguage(sceneId);
  if (!scene) return notFound();

  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Scene position in path (computed if logged in)
  let sceneNumber: number | undefined;
  let totalScenes: number | undefined;

  // Auto-advance: if user is logged in and scene is complete, redirect to next incomplete
  if (userId) {
    // Auto-enroll user in this path (fire-and-forget)
    upsertUserPath(userId, scene.path_id, 'active').catch(() => {});

    const sceneMastery = await getSceneMasteryForPath(userId, scene.path_id);
    const currentRow = sceneMastery.find(s => s.id === sceneId);
    if (currentRow) {
      const sceneIsComplete = (s: typeof currentRow) =>
        s.scene_type === 'dialogue' ? s.scene_completed : s.mastered_words >= s.total_words;

      // Sequential gate: an earlier scene in the path is incomplete, so the
      // user can't skip ahead. Bounce them to the earliest incomplete scene.
      // Mirrors the lock state shown in PathJourneyMap on the client.
      const earlierIncomplete = sceneMastery.find(s =>
        s.sort_order < currentRow.sort_order && !sceneIsComplete(s),
      );
      if (earlierIncomplete) {
        redirect(`/learn/${earlierIncomplete.id}`);
      }

      if (sceneIsComplete(currentRow)) {
        const nextIncomplete = sceneMastery.find(s =>
          s.sort_order > currentRow.sort_order && !sceneIsComplete(s),
        );
        if (nextIncomplete) {
          redirect(`/learn/${nextIncomplete.id}`);
        } else {
          redirect(`/paths/${scene.path_id}`);
        }
      }
    }

    // Compute scene position in path
    const sceneIndex = sceneMastery.findIndex(s => s.id === sceneId);
    sceneNumber = sceneIndex >= 0 ? sceneIndex + 1 : undefined;
    totalScenes = sceneMastery.length;
  }

  // Fetch next scene for navigation
  const nextScene = await getNextSceneInPath(scene.path_id, scene.sort_order);

  // Legacy scenes use the original LearnClient
  if (scene.scene_type === 'legacy') {
    const [words, legacyInsightState] = await Promise.all([
      buildWordsArray(sceneId, scene.language_id, userId),
      userId ? getInsightState(userId) : null,
    ]);
    return (
      <LearnClient
        sceneId={sceneId}
        sceneTitle={scene.scene_title}
        sceneDescription={scene.scene_description}
        languageName={scene.language_name}
        languageCode={scene.language_code as SupportedLanguageCode}
        words={words}
        nextScene={nextScene}
        pathId={scene.path_id}
        sceneNumber={sceneNumber}
        totalScenes={totalScenes}
        insightState={legacyInsightState ? { seenIds: Array.from(legacyInsightState.seenIds), shownToday: legacyInsightState.shownToday } : null}
      />
    );
  }

  // Dialogue scenes use the new SceneFlowClient
  const [flowData, words, progress, insightState] = await Promise.all([
    getSceneFlowData(sceneId, userId),
    buildWordsArray(sceneId, scene.language_id, userId),
    userId ? getOrCreateSceneProgress(userId, sceneId) : null,
    userId ? getInsightState(userId) : null,
  ]);

  const defaultProgress = {
    id: '',
    user_id: userId ?? '',
    scene_id: sceneId,
    current_phase: 'dialogue' as const,
    phase_index: 0,
    dialogue_completed: false,
    phrases_completed: false,
    vocabulary_completed: false,
    patterns_completed: false,
    affixes_completed: false,
    conversation_completed: false,
    completed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  return (
    <SceneFlowClient
      sceneId={sceneId}
      sceneTitle={scene.scene_title}
      sceneDescription={scene.scene_description}
      languageName={scene.language_name}
      languageCode={scene.language_code as SupportedLanguageCode}
      dialogues={flowData.dialogues}
      phrases={flowData.phrases}
      words={words}
      initialProgress={progress ?? defaultProgress}
      sceneContext={scene.scene_context}
      anchorImageUrl={scene.anchor_image_url}
      nextScene={nextScene}
      pathId={scene.path_id}
      sceneNumber={sceneNumber}
      totalScenes={totalScenes}
      insightState={insightState ? { seenIds: Array.from(insightState.seenIds), shownToday: insightState.shownToday } : null}
    />
  );
}
