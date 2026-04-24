'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SceneFlowHeader } from '@/components/learn/SceneFlowHeader';
import { SceneShell } from '@/components/learn/SceneShell';
import { DialoguePlayer } from '@/components/learn/DialoguePlayer';
import { PhraseCard } from '@/components/learn/PhraseCard';
import { PhraseQuiz } from '@/components/learn/PhraseQuiz';
import { WordCard } from '@/components/learn/WordCard';
import { MnemonicCard } from '@/components/learn/MnemonicCard';
import { QuizOptions } from '@/components/learn/QuizOptions';
import { CollapsibleWordFamily } from '@/components/learn/WordFamilyCard';
import { SceneSummary } from '@/components/learn/SceneSummary';
import { InsightCard } from '@/components/insights/InsightCard';
import { getEligibleInsight, type InsightUserState } from '@/lib/insights/engine';
import type { InsightDefinition, TriggerContext } from '@/lib/insights/data';
import type { SceneDialogue, ScenePhraseWithMnemonics, UserSceneProgress } from '@/types/database';
import type { LearnWord } from '@/components/learn/LearnClient';
import type { SupportedLanguageCode } from '@/types/audio';

interface SceneFlowClientProps {
  sceneId: string;
  sceneTitle: string;
  sceneDescription?: string | null;
  languageName: string;
  languageCode?: SupportedLanguageCode;
  dialogues: SceneDialogue[];
  phrases: ScenePhraseWithMnemonics[];
  words: LearnWord[];
  initialProgress: UserSceneProgress;
  sceneContext: string | null;
  anchorImageUrl: string | null;
  nextScene?: { id: string; title: string; description?: string | null } | null;
  pathId?: string;
  sceneNumber?: number;
  totalScenes?: number;
  insightState?: { seenIds: string[]; shownToday: number } | null;
}

type FlowState =
  | { phase: 'scene-intro' }
  | { phase: 'dialogue'; lineIndex: number }
  | { phase: 'phrases'; phraseIndex: number; step: 'show' | 'quiz' }
  | { phase: 'vocabulary'; wordIndex: number; step: 'word' | 'mnemonic' | 'quiz' }
  | { phase: 'summary' };

function initialStateFromProgress(p: UserSceneProgress, totalDialogues: number, totalPhrases: number, totalWords: number, hasAnchorImage: boolean): FlowState {
  // Cast to string to handle legacy phases ('conversation' / 'patterns' / 'affixes')
  // from existing DB rows — these flow-stages were removed in Phase 0.
  const phase = p.current_phase as string;
  switch (phase) {
    case 'dialogue':
      // Show scene intro before dialogue if user hasn't started yet and there's an anchor image
      if (p.phase_index === 0 && !p.dialogue_completed && hasAnchorImage) {
        return { phase: 'scene-intro' };
      }
      return { phase: 'dialogue', lineIndex: Math.min(p.phase_index, totalDialogues - 1) };
    case 'phrases':
      if (totalPhrases === 0) {
        return totalWords > 0
          ? { phase: 'vocabulary', wordIndex: 0, step: 'word' }
          : { phase: 'summary' };
      }
      return { phase: 'phrases', phraseIndex: Math.min(p.phase_index, totalPhrases - 1), step: 'show' };
    case 'vocabulary':
      return { phase: 'vocabulary', wordIndex: Math.min(p.phase_index, totalWords - 1), step: 'word' };
    // Legacy phases — forward-normalize to summary (content was already consumed).
    case 'patterns':
    case 'affixes':
    case 'conversation':
    case 'summary':
      return { phase: 'summary' };
    default:
      return hasAnchorImage ? { phase: 'scene-intro' } : { phase: 'dialogue', lineIndex: 0 };
  }
}

interface FlowContext {
  dialogues: SceneDialogue[];
  phrases: ScenePhraseWithMnemonics[];
  words: LearnWord[];
}

/** Returns the previous FlowState, or null to exit the scene. */
function computePreviousState(current: FlowState, ctx: FlowContext & { hasAnchorImage: boolean }): FlowState | null {
  switch (current.phase) {
    case 'scene-intro':
      return null;

    case 'dialogue':
      return ctx.hasAnchorImage ? { phase: 'scene-intro' } : null;

    case 'phrases': {
      if (current.step === 'quiz') {
        return { phase: 'phrases', phraseIndex: current.phraseIndex, step: 'show' };
      }
      // step === 'show'
      if (current.phraseIndex > 0) {
        return { phase: 'phrases', phraseIndex: current.phraseIndex - 1, step: 'show' };
      }
      // First phrase → back to dialogue (all lines visible) or exit
      if (ctx.dialogues.length > 0) {
        return { phase: 'dialogue', lineIndex: ctx.dialogues.length - 1 };
      }
      return null;
    }

    case 'vocabulary': {
      if (current.step === 'quiz') {
        const word = ctx.words[current.wordIndex];
        if (word?.mnemonic) {
          return { phase: 'vocabulary', wordIndex: current.wordIndex, step: 'mnemonic' };
        }
        return { phase: 'vocabulary', wordIndex: current.wordIndex, step: 'word' };
      }
      if (current.step === 'mnemonic') {
        return { phase: 'vocabulary', wordIndex: current.wordIndex, step: 'word' };
      }
      // step === 'word'
      if (current.wordIndex > 0) {
        return { phase: 'vocabulary', wordIndex: current.wordIndex - 1, step: 'word' };
      }
      // First word → back to last phrase show, or dialogue, or exit
      if (ctx.phrases.length > 0) {
        return { phase: 'phrases', phraseIndex: ctx.phrases.length - 1, step: 'show' };
      }
      if (ctx.dialogues.length > 0) {
        return { phase: 'dialogue', lineIndex: ctx.dialogues.length - 1 };
      }
      return null;
    }

    case 'summary': {
      if (ctx.words.length > 0) {
        return { phase: 'vocabulary', wordIndex: ctx.words.length - 1, step: 'word' };
      }
      if (ctx.phrases.length > 0) {
        return { phase: 'phrases', phraseIndex: ctx.phrases.length - 1, step: 'show' };
      }
      if (ctx.dialogues.length > 0) {
        return { phase: 'dialogue', lineIndex: ctx.dialogues.length - 1 };
      }
      return null;
    }
  }
}

export function SceneFlowClient({
  sceneId,
  sceneTitle,
  sceneDescription,
  languageName,
  languageCode,
  dialogues,
  phrases,
  words: allWords,
  initialProgress,
  sceneContext,
  anchorImageUrl,
  nextScene,
  pathId,
  sceneNumber,
  totalScenes,
  insightState,
}: SceneFlowClientProps) {
  const hasAnchorImage = !!anchorImageUrl;

  // Filter out already-learned words so users don't re-learn duplicates across scenes
  const [learnedWordIds, setLearnedWordIds] = useState<Set<string> | null>(null);
  const words = learnedWordIds
    ? allWords.filter(w => !learnedWordIds.has(w.word.id))
    : allWords;

  const [state, setState] = useState<FlowState>(() =>
    initialStateFromProgress(initialProgress, dialogues.length, phrases.length, allWords.length, hasAnchorImage)
  );
  const [dailyStats, setDailyStats] = useState<{ words_learned: number; scenes_completed: number }>({ words_learned: 0, scenes_completed: 0 });
  const statsFetched = useRef(false);

  // Fetch learned word IDs on mount — skip already-learned words in vocabulary phase
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/scenes/${sceneId}/progress`)
      .then(r => r.json())
      .then(res => {
        if (cancelled || !res.data) return;
        const ids = new Set<string>(res.data.learnedWordIds);
        if (ids.size === 0) return;
        setLearnedWordIds(ids);

        // If we're currently in vocabulary phase, check if all words are now learned
        const unlearnedWords = allWords.filter(w => !ids.has(w.word.id));
        setState(prev => {
          if (prev.phase !== 'vocabulary') return prev;
          if (unlearnedWords.length === 0) {
            return { phase: 'summary' };
          }
          // Clamp wordIndex to filtered list bounds
          if (prev.wordIndex >= unlearnedWords.length) {
            return { phase: 'vocabulary', wordIndex: 0, step: 'word' };
          }
          return prev;
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [sceneId, allWords]);

  // Fix stale DB records: if we initialize into summary but DB never recorded completion,
  // save progress now so completed_at gets set (e.g. legacy 'conversation' phase rows)
  const completionSynced = useRef(false);
  useEffect(() => {
    if (state.phase === 'summary' && !initialProgress.completed_at && !completionSynced.current) {
      completionSynced.current = true;
      fetch(`/api/scenes/${sceneId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPhase: 'summary', phaseIndex: 0 }),
      }).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Insight tracking
  const [seenInsightIds, setSeenInsightIds] = useState<Set<string>>(
    () => new Set(insightState?.seenIds ?? [])
  );
  const [insightsShownToday, setInsightsShownToday] = useState(insightState?.shownToday ?? 0);
  const [mnemonicsViewedInSession, setMnemonicsViewedInSession] = useState(0);
  const [firstQuizCorrect, setFirstQuizCorrect] = useState(false);
  const [activeInsight, setActiveInsight] = useState<InsightDefinition | null>(null);
  const [activeInsightContext, setActiveInsightContext] = useState<TriggerContext | null>(null);

  const checkInsight = useCallback((context: TriggerContext, overrides?: Partial<InsightUserState>) => {
    if (!insightState) return; // not logged in
    const userState: InsightUserState = {
      seenInsightIds,
      insightsShownToday,
      totalMnemonicsViewed: mnemonicsViewedInSession,
      totalScenesCompleted: sceneNumber ? sceneNumber - 1 : 0,
      totalWordsLearned: dailyStats.words_learned,
      ...overrides,
    };
    const insight = getEligibleInsight(context, userState);
    if (insight) {
      setActiveInsight(insight);
      setActiveInsightContext(context);
      // Mark as shown
      setSeenInsightIds(prev => new Set(prev).add(insight.id));
      setInsightsShownToday(prev => prev + 1);
      fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId: insight.id, action: 'shown' }),
      }).catch(() => {});
    }
  }, [insightState, seenInsightIds, insightsShownToday, mnemonicsViewedInSession, sceneNumber, dailyStats.words_learned]);

  const dismissInsight = useCallback(() => {
    setActiveInsight(null);
    setActiveInsightContext(null);
  }, []);

  const router = useRouter();
  const [saveFailed, setSaveFailed] = useState(false);

  const saveProgress = useCallback((phase: string, phaseIndex: number, phaseCompleted?: string) => {
    const body = JSON.stringify({ currentPhase: phase, phaseIndex, phaseCompleted });
    const doFetch = (retries: number) => {
      fetch(`/api/scenes/${sceneId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }).catch(() => {
        if (phase === 'summary' && retries > 0) {
          setTimeout(() => doFetch(retries - 1), 1000);
        } else if (phase === 'summary') {
          setSaveFailed(true);
        }
      });
    };
    doFetch(phase === 'summary' ? 2 : 0);
  }, [sceneId]);

  const retrySave = useCallback(() => {
    setSaveFailed(false);
    saveProgress('summary', 0);
  }, [saveProgress]);

  // --- Scene Intro ---
  const handleSceneIntroContinue = useCallback(() => {
    setState({ phase: 'dialogue', lineIndex: 0 });
  }, []);

  // --- Back Navigation ---
  const handleBack = useCallback(() => {
    const ctx: FlowContext & { hasAnchorImage: boolean } = { dialogues, phrases, words, hasAnchorImage };
    const prev = computePreviousState(state, ctx);
    if (prev) {
      setState(prev);
    } else {
      router.push(pathId ? `/paths/${pathId}` : '/dashboard');
    }
  }, [state, dialogues, phrases, words, hasAnchorImage, pathId, router]);

  // --- Dialogue Phase ---
  const handleDialogueComplete = useCallback(() => {
    if (phrases.length > 0) {
      saveProgress('phrases', 0, 'dialogue');
      setState({ phase: 'phrases', phraseIndex: 0, step: 'show' });
    } else if (words.length > 0) {
      saveProgress('vocabulary', 0, 'dialogue');
      setState({ phase: 'vocabulary', wordIndex: 0, step: 'word' });
    } else {
      saveProgress('summary', 0, 'dialogue');
      setState({ phase: 'summary' });
    }
  }, [saveProgress, phrases.length, words.length]);

  const handleDialogueLineAdvance = useCallback((lineIndex: number) => {
    saveProgress('dialogue', lineIndex);
  }, [saveProgress]);

  // --- Phrases Phase ---
  const handlePhraseContinue = useCallback(() => {
    if (state.phase !== 'phrases') return;
    // show → quiz. Any breakdown is revealed inline inside PhraseQuiz after a correct answer.
    setState({ phase: 'phrases', phraseIndex: state.phraseIndex, step: 'quiz' });
  }, [state]);

  const handlePhraseQuizCorrect = useCallback(() => {
    if (state.phase !== 'phrases') return;
    // Record phrase review for SRS tracking
    const phrase = phrases[state.phraseIndex];
    if (phrase) {
      fetch('/api/reviews/record-phrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phraseId: phrase.id, rating: 'got_it' }),
      }).catch(() => {});
    }
    const next = state.phraseIndex + 1;
    if (next < phrases.length) {
      saveProgress('phrases', next);
      setState({ phase: 'phrases', phraseIndex: next, step: 'show' });
    } else if (words.length > 0) {
      // Move to vocabulary (only unlearned words remain after filtering)
      saveProgress('vocabulary', 0, 'phrases');
      setState({ phase: 'vocabulary', wordIndex: 0, step: 'word' });
    } else {
      saveProgress('summary', 0, 'phrases');
      setState({ phase: 'summary' });
    }
  }, [state, phrases, words.length, saveProgress]);

  // --- Vocabulary Phase (reuses existing word/mnemonic/quiz components) ---
  const handleWordContinue = useCallback(() => {
    if (state.phase !== 'vocabulary') return;
    const word = words[state.wordIndex];
    if (word?.mnemonic) {
      const newCount = mnemonicsViewedInSession + 1;
      setMnemonicsViewedInSession(newCount);
      setState({ phase: 'vocabulary', wordIndex: state.wordIndex, step: 'mnemonic' });
      // Check for mnemonic or word_family insight
      if (!activeInsight) {
        checkInsight('mnemonic_card', { totalMnemonicsViewed: newCount });
      }
    } else {
      setState({ phase: 'vocabulary', wordIndex: state.wordIndex, step: 'quiz' });
    }
  }, [state, words, mnemonicsViewedInSession, activeInsight, checkInsight]);

  const handleMnemonicContinue = useCallback(() => {
    if (state.phase !== 'vocabulary') return;
    setState({ phase: 'vocabulary', wordIndex: state.wordIndex, step: 'quiz' });
  }, [state]);

  const handleVocabQuizAnswer = useCallback((correct: boolean) => {
    if (state.phase !== 'vocabulary') return;
    const word = words[state.wordIndex];
    if (!word) return;
    fetch('/api/reviews/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wordId: word.word.id,
        direction: 'recognition',
        rating: correct ? 'got_it' : 'forgot',
      }),
    }).catch(() => {});
  }, [state, words]);

  const handleVocabQuizCorrect = useCallback(() => {
    if (state.phase !== 'vocabulary') return;
    // Check for testing_effect insight on first correct quiz
    if (!firstQuizCorrect && !activeInsight) {
      setFirstQuizCorrect(true);
      checkInsight('quiz_correct');
    }
    const next = state.wordIndex + 1;
    if (next < words.length) {
      saveProgress('vocabulary', next);
      setState({ phase: 'vocabulary', wordIndex: next, step: 'word' });
    } else {
      saveProgress('summary', 0, 'vocabulary');
      setState({ phase: 'summary' });
    }
  }, [state, words.length, saveProgress, firstQuizCorrect, activeInsight, checkInsight]);

  // Check for word_family insight when a word family is first displayed
  const wordFamilyInsightChecked = useRef(false);
  useEffect(() => {
    if (
      state.phase === 'vocabulary' &&
      state.step === 'mnemonic' &&
      !wordFamilyInsightChecked.current &&
      !activeInsight &&
      words[state.wordIndex]?.wordFamilies?.length
    ) {
      wordFamilyInsightChecked.current = true;
      checkInsight('word_family');
    }
  }, [state, words, activeInsight, checkInsight]);

  // Check for scene_summary insight when entering summary phase
  const summaryInsightChecked = useRef(false);
  useEffect(() => {
    if (state.phase === 'summary' && !summaryInsightChecked.current && !activeInsight) {
      summaryInsightChecked.current = true;
      checkInsight('scene_summary');
    }
  }, [state.phase, activeInsight, checkInsight]);

  // Fetch daily stats when entering summary phase
  useEffect(() => {
    if (state.phase === 'summary' && !statsFetched.current) {
      statsFetched.current = true;
      fetch(`/api/scenes/${sceneId}/progress`)
        .then(res => res.json())
        .then(json => {
          if (json.data?.dailyStats) {
            setDailyStats(json.data.dailyStats);
          }
        })
        .catch(() => {});
    }
  }, [state.phase, sceneId]);

  // Swipe to advance for card-based phases
  useEffect(() => {
    let startX = 0;
    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
    }
    function onTouchEnd(e: TouchEvent) {
      const diff = e.changedTouches[0].clientX - startX;
      if (diff > 60) {
        if (state.phase === 'vocabulary' && state.step === 'word') handleWordContinue();
        else if (state.phase === 'vocabulary' && state.step === 'mnemonic') handleMnemonicContinue();
        else if (state.phase === 'phrases' && state.step === 'show') handlePhraseContinue();
      }
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [state, handleWordContinue, handleMnemonicContinue, handlePhraseContinue]);

  // Generate phrase distractors from other phrases in the same scene
  const getPhraseDistractors = useCallback((targetPhrase: string): string[] => {
    return phrases
      .filter((p) => p.text_target !== targetPhrase)
      .map((p) => p.text_target)
      .slice(0, 3);
  }, [phrases]);

  const phaseProgress = (() => {
    const substepFraction = (step: string, steps: string[]) => steps.indexOf(step) / steps.length;

    switch (state.phase) {
      case 'scene-intro':
        return 0;
      case 'dialogue':
        return dialogues.length > 1 ? state.lineIndex / (dialogues.length - 1) : 0;
      case 'phrases':
        if (phrases.length === 0) return 0;
        return (state.phraseIndex + substepFraction(state.step, ['show', 'quiz'])) / phrases.length;
      case 'vocabulary':
        if (words.length === 0) return 0;
        return (state.wordIndex + substepFraction(state.step, ['word', 'mnemonic', 'quiz'])) / words.length;
      case 'summary':
        return 1;
    }
  })();

  return (
    <SceneShell
      top={
        <SceneFlowHeader
          title={sceneTitle}
          description={sceneDescription}
          currentPhase={state.phase}
          phaseProgress={phaseProgress}
          onBack={handleBack}
          sceneNumber={sceneNumber}
          totalScenes={totalScenes}
          languageCode={languageCode}
        />
      }
      className="max-w-lg mx-auto"
    >
      {/* Scene Intro Phase */}
      {state.phase === 'scene-intro' && (
        <div className="animate-slide-up cursor-pointer" onClick={handleSceneIntroContinue}>
          {anchorImageUrl && (
            <div className="relative rounded-xl overflow-hidden mb-4 max-h-[40vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={anchorImageUrl}
                alt={sceneTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <h2 className="absolute bottom-4 left-4 right-4 text-2xl font-bold text-white">
                {sceneTitle}
              </h2>
            </div>
          )}
          {sceneContext && (
            <p className="text-sm text-text-secondary text-center px-4 mb-6">
              {sceneContext}
            </p>
          )}
          <p className="text-sm text-text-secondary text-center animate-pulse">
            Tap to begin
          </p>
        </div>
      )}

      {/* Dialogue Phase */}
      {state.phase === 'dialogue' && (
        <DialoguePlayer
          dialogues={dialogues}
          onComplete={handleDialogueComplete}
          onLineAdvance={handleDialogueLineAdvance}
          vocabWords={words}
          initialVisibleCount={state.lineIndex + 1}
        />
      )}

      {/* Phrases Phase */}
      {state.phase === 'phrases' && phrases[state.phraseIndex] && (
        state.step === 'show' ? (
          <PhraseCard
            phrase={phrases[state.phraseIndex]}
            onContinue={handlePhraseContinue}
          />
        ) : (
          <PhraseQuiz
            key={phrases[state.phraseIndex].id}
            promptText={phrases[state.phraseIndex].text_en}
            correctAnswer={phrases[state.phraseIndex].text_target}
            distractors={getPhraseDistractors(phrases[state.phraseIndex].text_target)}
            phrase={phrases[state.phraseIndex]}
            onCorrect={handlePhraseQuizCorrect}
          />
        )
      )}

      {/* Vocabulary Phase */}
      {state.phase === 'vocabulary' && words[state.wordIndex] && (
        <>
          {state.step === 'word' && (
            <WordCard
              text={words[state.wordIndex].word.text}
              romanization={words[state.wordIndex].word.romanization}
              meaningEn={words[state.wordIndex].word.meaning_en}
              partOfSpeech={words[state.wordIndex].word.part_of_speech}
              wordId={words[state.wordIndex].word.id}
              audioUrl={words[state.wordIndex].word.pronunciation_audio_url}
              languageCode={languageCode}
              informalText={words[state.wordIndex].word.informal_text}
              onContinue={handleWordContinue}
            />
          )}
          {state.step === 'mnemonic' && words[state.wordIndex].mnemonic && (
            <>
              <MnemonicCard
                wordText={words[state.wordIndex].word.text}
                keyword={words[state.wordIndex].mnemonic!.keyword_text}
                sceneDescription={words[state.wordIndex].mnemonic!.scene_description}
                bridgeSentence={words[state.wordIndex].mnemonic!.bridge_sentence}
                imageUrl={words[state.wordIndex].mnemonic!.image_url}
                mnemonicId={words[state.wordIndex].mnemonic!.id}
                wordId={words[state.wordIndex].word.id}
                meaningEn={words[state.wordIndex].word.meaning_en}
                languageName={languageName}
                onContinue={handleMnemonicContinue}
              />
              {activeInsight && activeInsightContext === 'mnemonic_card' && (
                <div className="mt-3">
                  <InsightCard insight={activeInsight} onDismiss={dismissInsight} />
                </div>
              )}
              {words[state.wordIndex].wordFamilies && words[state.wordIndex].wordFamilies!.length > 0 && (
                <CollapsibleWordFamily
                  rootWord={{
                    text: words[state.wordIndex].word.text,
                    meaning: words[state.wordIndex].word.meaning_en,
                  }}
                  derivedForms={words[state.wordIndex].wordFamilies!}
                />
              )}
              {activeInsight && activeInsightContext === 'word_family' && (
                <div className="mt-3">
                  <InsightCard insight={activeInsight} onDismiss={dismissInsight} />
                </div>
              )}
            </>
          )}
          {state.step === 'quiz' && (
            <>
              <QuizOptions
                key={words[state.wordIndex].word.id}
                wordText={words[state.wordIndex].word.text}
                wordId={words[state.wordIndex].word.id}
                correctAnswer={words[state.wordIndex].word.meaning_en}
                distractors={words[state.wordIndex].distractors}
                onCorrect={handleVocabQuizCorrect}
                onAnswer={handleVocabQuizAnswer}
              />
              {activeInsight && activeInsightContext === 'quiz_correct' && (
                <div className="mt-3">
                  <InsightCard insight={activeInsight} onDismiss={dismissInsight} />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Summary Phase */}
      {state.phase === 'summary' && (
        <>
          {saveFailed && (
            <button
              onClick={retrySave}
              className="w-full mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm text-center hover:bg-amber-500/20 transition-colors"
            >
              Progress not saved — tap to retry
            </button>
          )}
          <SceneSummary sceneTitle={sceneTitle} sceneDescription={sceneDescription} words={allWords} nextScene={nextScene} pathId={pathId} sceneId={sceneId} sceneNumber={sceneNumber} totalScenes={totalScenes} wordsLearnedToday={dailyStats.words_learned} scenesCompletedToday={dailyStats.scenes_completed} insight={activeInsight && activeInsightContext === 'scene_summary' ? activeInsight : undefined} onInsightDismiss={dismissInsight} />
        </>
      )}
    </SceneShell>
  );
}
