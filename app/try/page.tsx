'use client';

import { useReducer, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  onboardingReducer,
  INITIAL_STATE,
  getProgressStep,
  saveOnboardingProgress,
  loadOnboardingProgress,
} from '@/lib/onboarding/state';
import ProgressDots from '@/components/onboarding/ProgressDots';
import LanguagePicker from '@/components/onboarding/LanguagePicker';
import WordReveal from '@/components/onboarding/WordReveal';
import QuizCard from '@/components/onboarding/QuizCard';
import OnboardingComplete from '@/components/onboarding/OnboardingComplete';

const SPEED_MULTIPLIERS = [1.0, 0.8, 0.6] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(onboardingReducer, INITIAL_STATE);

  // Resume from localStorage on mount
  useEffect(() => {
    const saved = loadOnboardingProgress();
    if (saved?.selectedLanguage && saved.screen.type !== 'complete') {
      dispatch({ type: 'SELECT_LANGUAGE', language: saved.selectedLanguage });
    }
  }, []);

  // Save to localStorage after each state change
  useEffect(() => {
    if (state.selectedLanguage) {
      saveOnboardingProgress(state);
    }
  }, [state]);

  const currentStep = getProgressStep(state.screen);
  const { screen } = state;

  const handleKeepLearning = useCallback(() => {
    saveOnboardingProgress(state);
    router.push('/signup');
  }, [state, router]);

  const handleMaybeLater = useCallback(() => {
    saveOnboardingProgress(state);
    router.push('/');
  }, [state, router]);

  const screenKey =
    screen.type === 'word_reveal' ? `word_reveal_${screen.wordIndex}` :
    screen.type === 'quiz' ? `quiz_${screen.wordIndex}` :
    screen.type === 'double_quiz' ? `double_quiz_${screen.phase}` :
    screen.type;

  const renderScreen = () => {
    switch (screen.type) {
      case 'language_pick':
        return (
          <LanguagePicker
            onSelect={(lang) => dispatch({ type: 'SELECT_LANGUAGE', language: lang })}
          />
        );

      case 'word_reveal': {
        if (!state.selectedLanguage) return null;
        const { wordIndex } = screen;
        return (
          <WordReveal
            word={state.words[wordIndex]}
            wordNumber={wordIndex + 1}
            speedMultiplier={SPEED_MULTIPLIERS[wordIndex]}
            onComplete={() => dispatch({ type: 'ADVANCE_FROM_WORD', wordIndex })}
          />
        );
      }

      case 'quiz': {
        if (!state.selectedLanguage) return null;
        const { wordIndex } = screen;
        return (
          <QuizCard
            word={state.words[wordIndex]}
            languageName={state.selectedLanguage.name}
            onAnswer={(_, attempts) => {
              dispatch({ type: 'ANSWER_QUIZ', wordIndex, attempts });
              setTimeout(() => dispatch({ type: 'ADVANCE_FROM_QUIZ', wordIndex }), 100);
            }}
          />
        );
      }

      case 'double_quiz': {
        if (!state.selectedLanguage) return null;
        const { phase } = screen;
        return (
          <QuizCard
            word={phase === 'current' ? state.words[1] : state.words[0]}
            languageName={state.selectedLanguage.name}
            promptText={phase === 'surprise' ? 'Still remember this one?' : undefined}
            onAnswer={(_, attempts) => {
              dispatch({ type: 'ANSWER_DOUBLE_QUIZ', phase, attempts });
              setTimeout(() => dispatch({ type: 'ADVANCE_FROM_DOUBLE_QUIZ', phase }), 100);
            }}
          />
        );
      }

      case 'complete': {
        if (!state.selectedLanguage) return null;
        return (
          <OnboardingComplete
            languageName={state.selectedLanguage.name}
            words={state.words}
            elapsedSeconds={
              state.startedAt && state.completedAt
                ? Math.round((state.completedAt - state.startedAt) / 1000)
                : 60
            }
            quizResults={state.quizAnswers}
            onKeepLearning={handleKeepLearning}
            onMaybeLater={handleMaybeLater}
          />
        );
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      {screen.type !== 'language_pick' && (
        <ProgressDots totalSteps={7} currentStep={currentStep} />
      )}

      <div className="flex-1 flex items-center justify-center py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={screenKey}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
