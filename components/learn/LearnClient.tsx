'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SceneHeader } from '@/components/learn/SceneHeader';
import { WordCard } from '@/components/learn/WordCard';
import { MnemonicCard } from '@/components/learn/MnemonicCard';
import { QuizOptions } from '@/components/learn/QuizOptions';
import { SceneSummary } from '@/components/learn/SceneSummary';
import type { SupportedLanguageCode } from '@/types/audio';

export interface LearnWord {
  word: {
    id: string;
    text: string;
    romanization: string | null;
    meaning_en: string;
    part_of_speech: string;
    pronunciation_audio_url: string | null;
    informal_text: string | null;
    register: 'formal' | 'informal' | 'neutral';
  };
  mnemonic: {
    id: string;
    keyword_text: string;
    scene_description: string;
    bridge_sentence: string | null;
    image_url: string | null;
  } | null;
  distractors: string[];
  userWordStatus: string | null;
}

interface LearnClientProps {
  sceneId: string;
  sceneTitle: string;
  sceneDescription?: string | null;
  languageName: string;
  languageCode?: SupportedLanguageCode;
  words: LearnWord[];
  nextScene?: { id: string; title: string; description?: string | null } | null;
  pathId?: string;
}

type SceneState =
  | { phase: 'word_learning'; wordIndex: number; step: 'word' | 'mnemonic' | 'quiz' }
  | { phase: 'scene_complete' };

export function LearnClient({ sceneId, sceneTitle, sceneDescription, languageName, languageCode, words, nextScene, pathId }: LearnClientProps) {
  const [state, setState] = useState<SceneState>(
    { phase: 'word_learning', wordIndex: 0, step: 'word' }
  );

  // Fetch learned word IDs from API on mount and skip to the first unlearned word.
  // We can't rely on RSC props for userWordStatus because Next.js 16 hydration
  // doesn't re-render the component after the Flight payload reconciles.
  const learnedIdsRef = useRef<Set<string> | null>(null);
  const userHasInteractedRef = useRef(false);
  const wordsRef = useRef(words);
  wordsRef.current = words;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/scenes/${sceneId}/progress`)
      .then(r => r.json())
      .then(res => {
        if (cancelled || !res.data || userHasInteractedRef.current) return;
        const ids = new Set<string>(res.data.learnedWordIds);
        learnedIdsRef.current = ids;
        if (ids.size === 0) return;
        const currentWords = wordsRef.current;
        const startIndex = currentWords.findIndex(w => !ids.has(w.word.id));
        if (startIndex === -1) {
          setState({ phase: 'scene_complete' });
        } else if (startIndex > 0) {
          setState({ phase: 'word_learning', wordIndex: startIndex, step: 'word' });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [sceneId]);

  const currentWord: LearnWord | undefined =
    state.phase === 'word_learning' ? words[state.wordIndex] : undefined;

  // Pre-fetch next word's image and preload audio for smoother playback
  useEffect(() => {
    if (state.phase !== 'word_learning') return;

    // On 'word' step: preload current word's audio (so auto-play uses cached data)
    if (state.step === 'word') {
      const currentAudioUrl = words[state.wordIndex]?.word.pronunciation_audio_url;
      if (currentAudioUrl) {
        const audio = new Audio(currentAudioUrl);
        audio.preload = 'auto';
      }
    }

    // On 'mnemonic' step: preload next word's image and audio
    if (state.step === 'mnemonic') {
      const nextIndex = state.wordIndex + 1;
      if (nextIndex < words.length) {
        const nextWord = words[nextIndex];
        const nextImg = nextWord.mnemonic?.image_url;
        if (nextImg) {
          const img = new Image();
          img.src = nextImg;
        }
        const nextAudioUrl = nextWord.word.pronunciation_audio_url;
        if (nextAudioUrl) {
          const audio = new Audio(nextAudioUrl);
          audio.preload = 'auto';
        }
      }
    }
  }, [state, words]);

  const advanceWord = useCallback(() => {
    userHasInteractedRef.current = true;
    setState(prev => {
      if (prev.phase !== 'word_learning') return prev;
      const { wordIndex, step } = prev;
      const word = wordsRef.current[wordIndex];
      if (step === 'word') {
        return word?.mnemonic
          ? { phase: 'word_learning', wordIndex, step: 'mnemonic' }
          : { phase: 'word_learning', wordIndex, step: 'quiz' };
      } else if (step === 'mnemonic') {
        return { phase: 'word_learning', wordIndex, step: 'quiz' };
      }
      return prev;
    });
  }, []);

  const handleQuizAnswer = useCallback((correct: boolean) => {
    if (state.phase !== 'word_learning') return;
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
    }).catch(() => {/* ignore errors */});
  }, [state, words]);

  // Track word IDs completed in this session so we skip them when advancing
  const sessionLearnedRef = useRef<Set<string>>(new Set());

  const onQuizCorrect = useCallback(() => {
    userHasInteractedRef.current = true;
    setState(prev => {
      if (prev.phase !== 'word_learning') return prev;
      const currentWords = wordsRef.current;
      const currentId = currentWords[prev.wordIndex]?.word.id;
      if (currentId) sessionLearnedRef.current.add(currentId);

      const learned = learnedIdsRef.current;
      const nextIndex = currentWords.findIndex((w, i) => {
        if (i <= prev.wordIndex) return false;
        if (sessionLearnedRef.current.has(w.word.id)) return false;
        if (learned?.has(w.word.id)) return false;
        return true;
      });
      if (nextIndex === -1) {
        return { phase: 'scene_complete' };
      }
      return { phase: 'word_learning', wordIndex: nextIndex, step: 'word' };
    });
  }, []);

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
    <div className="max-w-lg mx-auto">
      {state.phase === 'word_learning' && currentWord && (
        <>
          <SceneHeader
            title={sceneTitle}
            current={state.wordIndex + 1}
            total={words.length}
          />

          {state.step === 'word' && (
            <WordCard
              text={currentWord.word.text}
              romanization={currentWord.word.romanization}
              meaningEn={currentWord.word.meaning_en}
              partOfSpeech={currentWord.word.part_of_speech}
              wordId={currentWord.word.id}
              audioUrl={currentWord.word.pronunciation_audio_url}
              languageCode={languageCode}
              informalText={currentWord.word.informal_text}
              onContinue={advanceWord}
            />
          )}

          {state.step === 'mnemonic' && currentWord.mnemonic && (
            <MnemonicCard
              wordText={currentWord.word.text}
              keyword={currentWord.mnemonic.keyword_text}
              sceneDescription={currentWord.mnemonic.scene_description}
              bridgeSentence={currentWord.mnemonic.bridge_sentence}
              imageUrl={currentWord.mnemonic.image_url}
              mnemonicId={currentWord.mnemonic.id}
              wordId={currentWord.word.id}
              meaningEn={currentWord.word.meaning_en}
              languageName={languageName}
              onContinue={advanceWord}
            />
          )}

          {state.step === 'quiz' && (
            <QuizOptions
              key={currentWord.word.id}
              wordText={currentWord.word.text}
              wordId={currentWord.word.id}
              correctAnswer={currentWord.word.meaning_en}
              distractors={currentWord.distractors}
              onCorrect={onQuizCorrect}
              onAnswer={handleQuizAnswer}
            />
          )}
        </>
      )}

      {state.phase === 'scene_complete' && (
        <SceneSummary sceneTitle={sceneTitle} sceneDescription={sceneDescription} words={words} nextScene={nextScene} pathId={pathId} />
      )}
    </div>
  );
}
