'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SceneFlowHeader } from '@/components/learn/SceneFlowHeader';
import { DialoguePlayer } from '@/components/learn/DialoguePlayer';
import { PhraseCard } from '@/components/learn/PhraseCard';
import { PhraseBreakdown } from '@/components/learn/PhraseBreakdown';
import { PhraseQuiz } from '@/components/learn/PhraseQuiz';
import { WordCard } from '@/components/learn/WordCard';
import { MnemonicCard } from '@/components/learn/MnemonicCard';
import { QuizOptions } from '@/components/learn/QuizOptions';
import { PatternExercise } from '@/components/learn/PatternExercise';
import { SentenceBuilder } from '@/components/learn/SentenceBuilder';
import { TypedTranslation } from '@/components/learn/TypedTranslation';
import { AffixExercise } from '@/components/learn/AffixExercise';
import { AffixReferenceCard } from '@/components/learn/AffixReferenceCard';
import { SceneSummary } from '@/components/learn/SceneSummary';
import type { SceneDialogue, ScenePhraseWithMnemonics, ScenePatternExercise, AffixExercise as AffixExerciseData, UserSceneProgress } from '@/types/database';
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
  patternExercises: ScenePatternExercise[];
  affixExercises?: AffixExerciseData[];
  initialProgress: UserSceneProgress;
  sceneContext: string | null;
  anchorImageUrl: string | null;
  nextScene?: { id: string; title: string; description?: string | null } | null;
  pathId?: string;
  userName?: string | null;
}

type FlowState =
  | { phase: 'scene-intro' }
  | { phase: 'dialogue'; lineIndex: number }
  | { phase: 'phrases'; phraseIndex: number; step: 'show' | 'breakdown' | 'quiz' }
  | { phase: 'vocabulary'; wordIndex: number; step: 'word' | 'mnemonic' | 'quiz' }
  | { phase: 'patterns'; exerciseIndex: number }
  | { phase: 'affixes'; exerciseIndex: number }
  | { phase: 'summary' };

function initialStateFromProgress(p: UserSceneProgress, totalDialogues: number, totalPhrases: number, totalWords: number, totalPatterns: number, totalAffixes: number, hasAnchorImage: boolean): FlowState {
  // Cast to string to handle legacy 'conversation' phase from existing DB rows
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
    case 'patterns':
      if (totalPatterns === 0) {
        return { phase: 'summary' };
      }
      return { phase: 'patterns', exerciseIndex: Math.min(p.phase_index, totalPatterns - 1) };
    case 'affixes':
      if (totalAffixes === 0) {
        return { phase: 'summary' };
      }
      return { phase: 'affixes', exerciseIndex: Math.min(p.phase_index, totalAffixes - 1) };
    case 'conversation':
      // Legacy fallback for existing users with conversation progress
      return { phase: 'summary' };
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
  patternExercises: ScenePatternExercise[];
  affixExercises: AffixExerciseData[];
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
        const phrase = ctx.phrases[current.phraseIndex];
        if (phrase?.words.some((w) => w.keyword_text !== null)) {
          return { phase: 'phrases', phraseIndex: current.phraseIndex, step: 'breakdown' };
        }
        return { phase: 'phrases', phraseIndex: current.phraseIndex, step: 'show' };
      }
      if (current.step === 'breakdown') {
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

    case 'patterns': {
      if (current.exerciseIndex > 0) {
        return { phase: 'patterns', exerciseIndex: current.exerciseIndex - 1 };
      }
      // First pattern → back to last vocab word, or last phrase, or dialogue, or exit
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

    case 'affixes': {
      if (current.exerciseIndex > 0) {
        return { phase: 'affixes', exerciseIndex: current.exerciseIndex - 1 };
      }
      // First affix → back to last pattern, or last vocab, or last phrase, or dialogue, or exit
      if (ctx.patternExercises.length > 0) {
        return { phase: 'patterns', exerciseIndex: ctx.patternExercises.length - 1 };
      }
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

    case 'summary': {
      if (ctx.affixExercises.length > 0) {
        return { phase: 'affixes', exerciseIndex: ctx.affixExercises.length - 1 };
      }
      if (ctx.patternExercises.length > 0) {
        return { phase: 'patterns', exerciseIndex: ctx.patternExercises.length - 1 };
      }
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
  words,
  patternExercises,
  affixExercises = [],
  initialProgress,
  sceneContext,
  anchorImageUrl,
  nextScene,
  pathId,
  userName,
}: SceneFlowClientProps) {
  const hasAnchorImage = !!anchorImageUrl;
  const [state, setState] = useState<FlowState>(() =>
    initialStateFromProgress(initialProgress, dialogues.length, phrases.length, words.length, patternExercises.length, affixExercises.length, hasAnchorImage)
  );

  const router = useRouter();
  const progressRef = useRef(false);

  const saveProgress = useCallback((phase: string, phaseIndex: number, phaseCompleted?: string) => {
    if (progressRef.current) return;
    fetch(`/api/scenes/${sceneId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPhase: phase, phaseIndex, phaseCompleted }),
    }).catch(() => {});
  }, [sceneId]);

  // --- Scene Intro ---
  const handleSceneIntroContinue = useCallback(() => {
    setState({ phase: 'dialogue', lineIndex: 0 });
  }, []);

  // --- Back Navigation ---
  const handleBack = useCallback(() => {
    const ctx: FlowContext & { hasAnchorImage: boolean } = { dialogues, phrases, words, patternExercises, affixExercises, hasAnchorImage };
    const prev = computePreviousState(state, ctx);
    if (prev) {
      setState(prev);
    } else {
      router.push(pathId ? `/paths/${pathId}` : '/dashboard');
    }
  }, [state, dialogues, phrases, words, patternExercises, affixExercises, hasAnchorImage, pathId, router]);

  // --- Dialogue Phase ---
  const handleDialogueComplete = useCallback(() => {
    if (phrases.length === 0) {
      // Skip phrases phase (empty for studio paths)
      if (words.length > 0) {
        saveProgress('vocabulary', 0, 'dialogue');
        setState({ phase: 'vocabulary', wordIndex: 0, step: 'word' });
      } else {
        saveProgress('summary', 0, 'dialogue');
        setState({ phase: 'summary' });
      }
    } else {
      saveProgress('phrases', 0, 'dialogue');
      setState({ phase: 'phrases', phraseIndex: 0, step: 'show' });
    }
  }, [saveProgress, phrases.length, words.length]);

  const handleDialogueLineAdvance = useCallback((lineIndex: number) => {
    saveProgress('dialogue', lineIndex);
  }, [saveProgress]);

  // --- Phrases Phase ---
  const handlePhraseContinue = useCallback(() => {
    if (state.phase !== 'phrases') return;
    const phrase = phrases[state.phraseIndex];
    // If phrase has words with mnemonics, show breakdown; otherwise skip to quiz
    if (phrase?.words.some((w) => w.keyword_text !== null)) {
      setState({ phase: 'phrases', phraseIndex: state.phraseIndex, step: 'breakdown' });
    } else {
      setState({ phase: 'phrases', phraseIndex: state.phraseIndex, step: 'quiz' });
    }
  }, [state, phrases]);

  const handleBreakdownContinue = useCallback(() => {
    if (state.phase !== 'phrases') return;
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
    } else {
      // Move to vocabulary
      saveProgress('vocabulary', 0, 'phrases');
      setState({ phase: 'vocabulary', wordIndex: 0, step: 'word' });
    }
  }, [state, phrases, saveProgress]);

  // --- Vocabulary Phase (reuses existing word/mnemonic/quiz components) ---
  const handleWordContinue = useCallback(() => {
    if (state.phase !== 'vocabulary') return;
    const word = words[state.wordIndex];
    if (word?.mnemonic) {
      setState({ phase: 'vocabulary', wordIndex: state.wordIndex, step: 'mnemonic' });
    } else {
      setState({ phase: 'vocabulary', wordIndex: state.wordIndex, step: 'quiz' });
    }
  }, [state, words]);

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
    const next = state.wordIndex + 1;
    if (next < words.length) {
      saveProgress('vocabulary', next);
      setState({ phase: 'vocabulary', wordIndex: next, step: 'word' });
    } else if (patternExercises.length > 0) {
      // Move to patterns
      saveProgress('patterns', 0, 'vocabulary');
      setState({ phase: 'patterns', exerciseIndex: 0 });
    } else if (affixExercises.length > 0) {
      // Skip patterns, move to affixes
      saveProgress('affixes', 0, 'vocabulary');
      setState({ phase: 'affixes', exerciseIndex: 0 });
    } else {
      // Skip patterns and affixes phases (empty for studio paths)
      saveProgress('summary', 0, 'vocabulary');
      setState({ phase: 'summary' });
    }
  }, [state, words.length, patternExercises.length, affixExercises.length, saveProgress]);

  // --- Patterns Phase ---
  const handlePatternCorrect = useCallback((_correct?: boolean) => {
    if (state.phase !== 'patterns') return;
    const next = state.exerciseIndex + 1;
    if (next < patternExercises.length) {
      saveProgress('patterns', next);
      setState({ phase: 'patterns', exerciseIndex: next });
    } else if (affixExercises.length > 0) {
      // Move to affixes
      saveProgress('affixes', 0, 'patterns');
      setState({ phase: 'affixes', exerciseIndex: 0 });
    } else {
      // Move to summary
      saveProgress('summary', 0, 'patterns');
      setState({ phase: 'summary' });
    }
  }, [state, patternExercises.length, affixExercises.length, saveProgress]);

  // --- Affixes Phase ---
  const handleAffixComplete = useCallback((_correct: boolean) => {
    if (state.phase !== 'affixes') return;
    const next = state.exerciseIndex + 1;
    if (next < affixExercises.length) {
      saveProgress('affixes', next);
      setState({ phase: 'affixes', exerciseIndex: next });
    } else {
      // Move to summary
      saveProgress('summary', 0, 'affixes');
      setState({ phase: 'summary' });
    }
  }, [state, affixExercises.length, saveProgress]);

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
        else if (state.phase === 'phrases' && state.step === 'breakdown') handleBreakdownContinue();
      }
    }
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [state, handleWordContinue, handleMnemonicContinue, handlePhraseContinue, handleBreakdownContinue]);

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
        return (state.phraseIndex + substepFraction(state.step, ['show', 'breakdown', 'quiz'])) / phrases.length;
      case 'vocabulary':
        if (words.length === 0) return 0;
        return (state.wordIndex + substepFraction(state.step, ['word', 'mnemonic', 'quiz'])) / words.length;
      case 'patterns':
        return patternExercises.length > 1 ? state.exerciseIndex / (patternExercises.length - 1) : 0;
      case 'affixes':
        return affixExercises.length > 1 ? state.exerciseIndex / (affixExercises.length - 1) : 0;
      case 'summary':
        return 1;
    }
  })();

  return (
    <div className="max-w-lg mx-auto">
      <SceneFlowHeader title={sceneTitle} description={sceneDescription} currentPhase={state.phase} phaseProgress={phaseProgress} onBack={handleBack} />

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
        ) : state.step === 'breakdown' ? (
          <PhraseBreakdown
            phrase={phrases[state.phraseIndex]}
            onContinue={handleBreakdownContinue}
          />
        ) : (
          <PhraseQuiz
            key={phrases[state.phraseIndex].id}
            promptText={phrases[state.phraseIndex].text_en}
            correctAnswer={phrases[state.phraseIndex].text_target}
            distractors={getPhraseDistractors(phrases[state.phraseIndex].text_target)}
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
          )}
          {state.step === 'quiz' && (
            <QuizOptions
              key={words[state.wordIndex].word.id}
              wordText={words[state.wordIndex].word.text}
              wordId={words[state.wordIndex].word.id}
              correctAnswer={words[state.wordIndex].word.meaning_en}
              distractors={words[state.wordIndex].distractors}
              onCorrect={handleVocabQuizCorrect}
              onAnswer={handleVocabQuizAnswer}
            />
          )}
        </>
      )}

      {/* Patterns Phase */}
      {state.phase === 'patterns' && patternExercises[state.exerciseIndex] && (() => {
        const exercise = patternExercises[state.exerciseIndex];
        const exerciseType = exercise.exercise_type || 'fill_blank';

        if (exerciseType === 'sentence_build') {
          return (
            <SentenceBuilder
              key={exercise.id}
              prompt={exercise.hint_en || exercise.prompt}
              correctAnswer={exercise.correct_answer}
              distractors={exercise.distractors}
              explanation={exercise.explanation ?? undefined}
              onComplete={handlePatternCorrect}
            />
          );
        }

        if (exerciseType === 'typed_translation') {
          return (
            <TypedTranslation
              key={exercise.id}
              promptEn={exercise.hint_en || exercise.prompt}
              correctAnswer={exercise.correct_answer}
              onComplete={handlePatternCorrect}
            />
          );
        }

        // Default: fill_blank
        return (
          <PatternExercise
            key={exercise.id}
            exercise={exercise}
            onCorrect={handlePatternCorrect}
            userName={userName}
          />
        );
      })()}

      {/* Affixes Phase */}
      {state.phase === 'affixes' && affixExercises[state.exerciseIndex] && (
        <>
          <AffixExercise
            key={affixExercises[state.exerciseIndex].id}
            exercise={affixExercises[state.exerciseIndex]}
            onComplete={handleAffixComplete}
          />
          <AffixReferenceCard />
        </>
      )}

      {/* Summary Phase */}
      {state.phase === 'summary' && (
        <SceneSummary sceneTitle={sceneTitle} sceneDescription={sceneDescription} words={words} nextScene={nextScene} pathId={pathId} sceneId={sceneId} />
      )}
    </div>
  );
}
