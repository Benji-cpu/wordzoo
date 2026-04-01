import type { OnboardingLanguage, OnboardingWord } from './data';

// --- Screen types (discriminated union) ---

export type OnboardingScreen =
  | { type: 'name_input' }
  | { type: 'language_pick' }
  | { type: 'word_reveal'; wordIndex: number }
  | { type: 'quiz'; wordIndex: number }
  | { type: 'double_quiz'; phase: 'current' | 'surprise' }
  | { type: 'complete' };

// --- State ---

export interface QuizAnswer {
  wordIndex: number;
  attempts: number;
  correct: boolean;
}

export interface OnboardingState {
  screen: OnboardingScreen;
  userName: string | null;
  selectedLanguage: OnboardingLanguage | null;
  words: OnboardingWord[];
  quizAnswers: QuizAnswer[];
  startedAt: number | null;
  completedAt: number | null;
}

export const INITIAL_STATE: OnboardingState = {
  screen: { type: 'name_input' },
  userName: null,
  selectedLanguage: null,
  words: [],
  quizAnswers: [],
  startedAt: null,
  completedAt: null,
};

// --- Actions ---

export type OnboardingAction =
  | { type: 'SET_NAME'; name: string }
  | { type: 'SELECT_LANGUAGE'; language: OnboardingLanguage }
  | { type: 'ADVANCE_FROM_WORD'; wordIndex: number }
  | { type: 'ANSWER_QUIZ'; wordIndex: number; attempts: number }
  | { type: 'ADVANCE_FROM_QUIZ'; wordIndex: number }
  | { type: 'ANSWER_DOUBLE_QUIZ'; phase: 'current' | 'surprise'; attempts: number }
  | { type: 'ADVANCE_FROM_DOUBLE_QUIZ'; phase: 'current' | 'surprise' }
  | { type: 'ADVANCE_TO_COMPLETE' }
  | { type: 'RESET' };

// --- Flow ---
// name_input → language_pick → word_reveal(0) → quiz(0) → word_reveal(1) → double_quiz(current=word2) → double_quiz(surprise=word1) → word_reveal(2) → complete

export function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
  switch (action.type) {
    case 'SET_NAME':
      return {
        ...state,
        userName: action.name || null,
        screen: { type: 'language_pick' },
      };

    case 'SELECT_LANGUAGE':
      return {
        ...state,
        selectedLanguage: action.language,
        words: [...action.language.words],
        startedAt: Date.now(),
        screen: { type: 'word_reveal', wordIndex: 0 },
      };

    case 'ADVANCE_FROM_WORD':
      // word_reveal(0) → quiz(0)
      if (action.wordIndex === 0) {
        return { ...state, screen: { type: 'quiz', wordIndex: 0 } };
      }
      // word_reveal(1) → double_quiz(current) for word index 1
      if (action.wordIndex === 1) {
        return { ...state, screen: { type: 'double_quiz', phase: 'current' } };
      }
      // word_reveal(2) → complete
      if (action.wordIndex === 2) {
        return { ...state, screen: { type: 'complete' }, completedAt: Date.now() };
      }
      return state;

    case 'ANSWER_QUIZ':
      return {
        ...state,
        quizAnswers: [
          ...state.quizAnswers,
          { wordIndex: action.wordIndex, attempts: action.attempts, correct: true },
        ],
      };

    case 'ADVANCE_FROM_QUIZ':
      // quiz(0) → word_reveal(1)
      if (action.wordIndex === 0) {
        return { ...state, screen: { type: 'word_reveal', wordIndex: 1 } };
      }
      return state;

    case 'ANSWER_DOUBLE_QUIZ':
      return {
        ...state,
        quizAnswers: [
          ...state.quizAnswers,
          {
            wordIndex: action.phase === 'current' ? 1 : 0,
            attempts: action.attempts,
            correct: true,
          },
        ],
      };

    case 'ADVANCE_FROM_DOUBLE_QUIZ':
      // double_quiz(current) → double_quiz(surprise)
      if (action.phase === 'current') {
        return { ...state, screen: { type: 'double_quiz', phase: 'surprise' } };
      }
      // double_quiz(surprise) → word_reveal(2)
      if (action.phase === 'surprise') {
        return { ...state, screen: { type: 'word_reveal', wordIndex: 2 } };
      }
      return state;

    case 'ADVANCE_TO_COMPLETE':
      return { ...state, screen: { type: 'complete' }, completedAt: Date.now() };

    case 'RESET':
      return INITIAL_STATE;

    default:
      return state;
  }
}

// --- Progress dot mapping ---

export function getProgressStep(screen: OnboardingScreen): number {
  switch (screen.type) {
    case 'name_input': return 0;
    case 'language_pick': return 0;
    case 'word_reveal':
      if (screen.wordIndex === 0) return 1;
      if (screen.wordIndex === 1) return 3;
      return 5;
    case 'quiz': return 2;
    case 'double_quiz': return 4;
    case 'complete': return 6;
  }
}

// --- localStorage persistence ---

const STORAGE_KEY = 'wordzoo_onboarding';

export function saveOnboardingProgress(state: OnboardingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (SSR, private browsing quota exceeded)
  }
}

export function loadOnboardingProgress(): OnboardingState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return null;
  }
}

export function clearOnboardingProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasOnboardingProgress(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function getOnboardingProgress(): { languageName: string; wordsLearned: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as OnboardingState;
    if (!state.selectedLanguage) return null;
    const wordsLearned = state.quizAnswers.length;
    return { languageName: state.selectedLanguage.name, wordsLearned };
  } catch {
    return null;
  }
}
