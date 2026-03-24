'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { SceneFlowHeader } from '@/components/learn/SceneFlowHeader';
import { DialoguePlayer } from '@/components/learn/DialoguePlayer';
import { PhraseCard } from '@/components/learn/PhraseCard';
import { PhraseQuiz } from '@/components/learn/PhraseQuiz';
import { WordCard } from '@/components/learn/WordCard';
import { MnemonicCard } from '@/components/learn/MnemonicCard';
import { QuizOptions } from '@/components/learn/QuizOptions';
import { PatternExercise } from '@/components/learn/PatternExercise';
import { GuidedConversation } from '@/components/learn/GuidedConversation';
import { SceneSummary } from '@/components/learn/SceneSummary';
import type { SceneDialogue, ScenePhrase, ScenePatternExercise, UserSceneProgress } from '@/types/database';
import type { LearnWord } from '@/components/learn/LearnClient';
import type { SupportedLanguageCode } from '@/types/audio';

interface SceneFlowClientProps {
  sceneId: string;
  sceneTitle: string;
  languageName: string;
  languageCode?: SupportedLanguageCode;
  dialogues: SceneDialogue[];
  phrases: ScenePhrase[];
  words: LearnWord[];
  patternExercises: ScenePatternExercise[];
  initialProgress: UserSceneProgress;
  sceneContext: string | null;
  nextScene?: { id: string; title: string } | null;
  pathId?: string;
}

type FlowState =
  | { phase: 'dialogue'; lineIndex: number }
  | { phase: 'phrases'; phraseIndex: number; step: 'show' | 'quiz' }
  | { phase: 'vocabulary'; wordIndex: number; step: 'word' | 'mnemonic' | 'quiz' }
  | { phase: 'patterns'; exerciseIndex: number }
  | { phase: 'conversation' }
  | { phase: 'summary' };

function initialStateFromProgress(p: UserSceneProgress, totalDialogues: number, totalPhrases: number, totalWords: number, totalPatterns: number): FlowState {
  switch (p.current_phase) {
    case 'dialogue':
      return { phase: 'dialogue', lineIndex: Math.min(p.phase_index, totalDialogues - 1) };
    case 'phrases':
      return { phase: 'phrases', phraseIndex: Math.min(p.phase_index, totalPhrases - 1), step: 'show' };
    case 'vocabulary':
      return { phase: 'vocabulary', wordIndex: Math.min(p.phase_index, totalWords - 1), step: 'word' };
    case 'patterns':
      return { phase: 'patterns', exerciseIndex: Math.min(p.phase_index, totalPatterns - 1) };
    case 'conversation':
      return { phase: 'conversation' };
    case 'summary':
      return { phase: 'summary' };
    default:
      return { phase: 'dialogue', lineIndex: 0 };
  }
}

export function SceneFlowClient({
  sceneId,
  sceneTitle,
  languageName,
  languageCode,
  dialogues,
  phrases,
  words,
  patternExercises,
  initialProgress,
  sceneContext: _sceneContext,
  nextScene,
  pathId,
}: SceneFlowClientProps) {
  const [state, setState] = useState<FlowState>(() =>
    initialStateFromProgress(initialProgress, dialogues.length, phrases.length, words.length, patternExercises.length)
  );

  const progressRef = useRef(false);

  const saveProgress = useCallback((phase: string, phaseIndex: number, phaseCompleted?: string) => {
    if (progressRef.current) return;
    fetch(`/api/scenes/${sceneId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPhase: phase, phaseIndex, phaseCompleted }),
    }).catch(() => {});
  }, [sceneId]);

  // --- Dialogue Phase ---
  const handleDialogueComplete = useCallback(() => {
    saveProgress('phrases', 0, 'dialogue');
    setState({ phase: 'phrases', phraseIndex: 0, step: 'show' });
  }, [saveProgress]);

  const handleDialogueLineAdvance = useCallback((lineIndex: number) => {
    saveProgress('dialogue', lineIndex);
  }, [saveProgress]);

  // --- Phrases Phase ---
  const handlePhraseContinue = useCallback(() => {
    if (state.phase !== 'phrases') return;
    // After showing, go to quiz
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
    } else {
      // Move to patterns
      saveProgress('patterns', 0, 'vocabulary');
      setState({ phase: 'patterns', exerciseIndex: 0 });
    }
  }, [state, words.length, saveProgress]);

  // --- Patterns Phase ---
  const handlePatternCorrect = useCallback(() => {
    if (state.phase !== 'patterns') return;
    const next = state.exerciseIndex + 1;
    if (next < patternExercises.length) {
      saveProgress('patterns', next);
      setState({ phase: 'patterns', exerciseIndex: next });
    } else {
      // Move to guided conversation
      saveProgress('conversation', 0, 'patterns');
      setState({ phase: 'conversation' });
    }
  }, [state, patternExercises.length, saveProgress]);

  // --- Conversation Phase ---
  const handleConversationComplete = useCallback(() => {
    saveProgress('summary', 0, 'conversation');
    setState({ phase: 'summary' });
  }, [saveProgress]);

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

  return (
    <div className="max-w-lg mx-auto">
      <SceneFlowHeader title={sceneTitle} currentPhase={state.phase} />

      {/* Dialogue Phase */}
      {state.phase === 'dialogue' && (
        <DialoguePlayer
          dialogues={dialogues}
          onComplete={handleDialogueComplete}
          onLineAdvance={handleDialogueLineAdvance}
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
      {state.phase === 'patterns' && patternExercises[state.exerciseIndex] && (
        <PatternExercise
          key={patternExercises[state.exerciseIndex].id}
          exercise={patternExercises[state.exerciseIndex]}
          onCorrect={handlePatternCorrect}
        />
      )}

      {/* Conversation Phase */}
      {state.phase === 'conversation' && (
        <GuidedConversation
          sceneId={sceneId}
          onComplete={handleConversationComplete}
          onSkip={handleConversationComplete}
        />
      )}

      {/* Summary Phase */}
      {state.phase === 'summary' && (
        <SceneSummary sceneTitle={sceneTitle} words={words} nextScene={nextScene} pathId={pathId} />
      )}
    </div>
  );
}
