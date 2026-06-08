import { notFound, redirect } from 'next/navigation';
import {
  getSceneWithLanguage,
  getSceneWordsForLearning,
  getDistractorsForWord,
  getNextSceneInPath,
  getSceneMasteryForPath,
  upsertUserPath,
  getWordFamilies,
  getClozePhrasesForWord,
} from '@/lib/db/queries';
import { getSceneFlowData, getOrCreateSceneProgress } from '@/lib/db/scene-flow-queries';
import { getUserProfile } from '@/lib/db/queries';
import { auth } from '@/lib/auth';
import type { LearnWord } from '@/types/learn';
import { SceneFlowClient } from '@/components/learn/SceneFlowClient';
import { LessonPersonaPrompt } from '@/components/learn/LessonPersonaPrompt';
import { getInsightState } from '@/lib/db/insight-queries';
import { resolvePedagogyFlags } from '@/lib/pedagogy/flags';
import {
  personalizeSceneContent,
  isPersonalizableLanguage,
  firstNameOf,
  type LearnerGender,
} from '@/lib/learn/personalize';
import type { SupportedLanguageCode } from '@/types/audio';

interface PageProps {
  params: Promise<{ sceneId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

async function buildWordsArray(
  sceneId: string,
  languageId: string,
  userId: string | null,
  includeClozePhrases: boolean,
): Promise<LearnWord[]> {
  const sceneWords = await getSceneWordsForLearning(sceneId, userId);
  return Promise.all(
    sceneWords.map(async (sw) => {
      const [distractors, families, clozePhrases] = await Promise.all([
        getDistractorsForWord(sw.word_id, languageId, sw.meaning_en, 3),
        getWordFamilies(sw.word_id),
        includeClozePhrases ? getClozePhrasesForWord(sw.word_id, 3) : Promise.resolve([]),
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
        clozePhrases: clozePhrases.length > 0 ? clozePhrases : undefined,
      };
    })
  );
}

export default async function LearnPage({ params, searchParams }: PageProps) {
  const { sceneId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  const scene = await getSceneWithLanguage(sceneId);
  if (!scene) return notFound();

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const userEmail = session?.user?.email ?? null;

  // Resolve Pedagogy v2 flags. Off in prod by default; admins on via the
  // ADMIN_EMAILS allowlist; URL `?p2=1` is the dev-time override.
  const pedagogyFlags = resolvePedagogyFlags({
    searchParams: resolvedSearchParams,
    userEmail,
  });

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

  // All scenes render through SceneFlowClient. The 6 legacy scenes were
  // dropped as part of the Pedagogy v2 cutover.
  const [flowData, words, progress, insightState, profile] = await Promise.all([
    getSceneFlowData(sceneId, userId),
    buildWordsArray(sceneId, scene.language_id, userId, pedagogyFlags.cloze),
    userId ? getOrCreateSceneProgress(userId, sceneId) : null,
    userId ? getInsightState(userId) : null,
    userId ? getUserProfile(userId) : null,
  ]);

  // Personalize learner-facing content (name + gender agreement). Falls back
  // to the seed persona when the learner hasn't set a name/gender. See
  // lib/learn/personalize.ts.
  const prefs = (profile?.preferences ?? {}) as Record<string, unknown>;
  const learnerName =
    (typeof prefs.learner_name === 'string' && prefs.learner_name.trim()
      ? prefs.learner_name.trim()
      : firstNameOf(profile?.name)) ?? null;
  const learnerGender =
    prefs.learner_gender === 'male' || prefs.learner_gender === 'female'
      ? (prefs.learner_gender as LearnerGender)
      : null;
  const { dialogues: personalizedDialogues, phrases: personalizedPhrases } =
    personalizeSceneContent(flowData.dialogues, flowData.phrases, scene.language_code, {
      firstName: learnerName,
      gender: learnerGender,
    });

  // Prompt for name/gender once on a gendered language when it's still unset.
  const needsPersona =
    isPersonalizableLanguage(scene.language_code) &&
    !learnerGender &&
    prefs.persona_prompt_dismissed !== true;

  const defaultProgress = {
    id: '',
    user_id: userId ?? '',
    scene_id: sceneId,
    current_phase: 'dialogue' as const,
    phase_index: 0,
    phase_step: null,
    phase_batch: 0,
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
    <>
      {needsPersona && (
        <LessonPersonaPrompt
          initialName={learnerName}
          languageName={scene.language_name}
        />
      )}
      <SceneFlowClient
        sceneId={sceneId}
        sceneTitle={scene.scene_title}
        sceneDescription={scene.scene_description}
        languageName={scene.language_name}
        languageCode={scene.language_code as SupportedLanguageCode}
        dialogues={personalizedDialogues}
        phrases={personalizedPhrases}
        words={words}
        initialProgress={progress ?? defaultProgress}
        sceneContext={scene.scene_context}
        anchorImageUrl={scene.anchor_image_url}
        nextScene={nextScene}
        pathId={scene.path_id}
        sceneNumber={sceneNumber}
        totalScenes={totalScenes}
        insightState={insightState ? { seenIds: Array.from(insightState.seenIds), shownToday: insightState.shownToday } : null}
        pedagogyFlags={pedagogyFlags}
        learnerName={learnerName}
      />
    </>
  );
}
