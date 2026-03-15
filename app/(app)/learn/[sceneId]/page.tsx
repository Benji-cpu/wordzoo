'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { getMockScene, getMockDueWords, type MockWordWithMnemonic } from '@/lib/mocks/learning-data';
import { SceneHeader } from '@/components/learn/SceneHeader';
import { WordCard } from '@/components/learn/WordCard';
import { MnemonicCard } from '@/components/learn/MnemonicCard';
import { QuizOptions } from '@/components/learn/QuizOptions';
import { SceneSummary } from '@/components/learn/SceneSummary';
import { PreSceneReview } from '@/components/learn/PreSceneReview';

type SceneState =
  | { phase: 'pre_review'; dueCount: number }
  | { phase: 'word_learning'; wordIndex: number; step: 'word' | 'mnemonic' | 'quiz' }
  | { phase: 'scene_complete' };

export default function LearnPage() {
  const params = useParams<{ sceneId: string }>();
  const sceneId = params.sceneId;

  const sceneData = getMockScene(sceneId);
  const dueWords = getMockDueWords();
  const dueCount = dueWords.length;

  const [state, setState] = useState<SceneState>(
    dueCount > 0
      ? { phase: 'pre_review', dueCount }
      : { phase: 'word_learning', wordIndex: 0, step: 'word' }
  );

  const words = sceneData.words;
  const currentWord: MockWordWithMnemonic | undefined =
    state.phase === 'word_learning' ? words[state.wordIndex] : undefined;

  // Pre-fetch next word's image
  useEffect(() => {
    if (state.phase === 'word_learning' && state.step === 'mnemonic') {
      const nextIndex = state.wordIndex + 1;
      if (nextIndex < words.length) {
        const nextImg = words[nextIndex].mnemonic?.image_url;
        if (nextImg) {
          const img = new Image();
          img.src = nextImg;
        }
      }
    }
  }, [state, words]);

  const advanceWord = useCallback(() => {
    if (state.phase !== 'word_learning') return;
    const { wordIndex, step } = state;

    if (step === 'word') {
      setState({ phase: 'word_learning', wordIndex, step: 'mnemonic' });
    } else if (step === 'mnemonic') {
      setState({ phase: 'word_learning', wordIndex, step: 'quiz' });
    }
  }, [state]);

  const onQuizCorrect = useCallback(() => {
    if (state.phase !== 'word_learning') return;
    const nextIndex = state.wordIndex + 1;
    if (nextIndex >= words.length) {
      setState({ phase: 'scene_complete' });
    } else {
      setState({ phase: 'word_learning', wordIndex: nextIndex, step: 'word' });
    }
  }, [state, words.length]);

  // Handle swipe right to advance
  useEffect(() => {
    let startX = 0;

    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
    }
    function onTouchEnd(e: TouchEvent) {
      const diff = e.changedTouches[0].clientX - startX;
      if (diff > 60 && state.phase === 'word_learning' && state.step !== 'quiz') {
        advanceWord();
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [state, advanceWord]);

  return (
    <div className="max-w-lg mx-auto pb-24">
      {state.phase === 'pre_review' && (
        <PreSceneReview
          dueCount={state.dueCount}
          onStartReview={() => {
            // In a real app, this would navigate to /review with a return URL
            setState({ phase: 'word_learning', wordIndex: 0, step: 'word' });
          }}
          onSkip={() => setState({ phase: 'word_learning', wordIndex: 0, step: 'word' })}
        />
      )}

      {state.phase === 'word_learning' && currentWord && (
        <>
          <SceneHeader
            title={sceneData.scene.title}
            current={state.wordIndex + 1}
            total={words.length}
          />

          {state.step === 'word' && (
            <WordCard
              text={currentWord.word.text}
              romanization={currentWord.word.romanization}
              meaningEn={currentWord.word.meaning_en}
              partOfSpeech={currentWord.word.part_of_speech}
              onContinue={advanceWord}
            />
          )}

          {state.step === 'mnemonic' && (
            <MnemonicCard
              wordText={currentWord.word.text}
              keyword={currentWord.mnemonic.keyword_text}
              sceneDescription={currentWord.mnemonic.scene_description}
              imageUrl={currentWord.mnemonic.image_url}
              mnemonicId={currentWord.mnemonic.id}
              wordId={currentWord.word.id}
              meaningEn={currentWord.word.meaning_en}
              languageName="Indonesian"
              onContinue={advanceWord}
            />
          )}

          {state.step === 'quiz' && (
            <QuizOptions
              key={currentWord.word.id}
              wordText={currentWord.word.text}
              correctAnswer={currentWord.word.meaning_en}
              distractors={currentWord.distractors}
              onCorrect={onQuizCorrect}
            />
          )}
        </>
      )}

      {state.phase === 'scene_complete' && (
        <SceneSummary sceneTitle={sceneData.scene.title} words={words} />
      )}
    </div>
  );
}
