export interface TutorMode {
  id: string;
  label: string;
  description: string;
  icon: string;
  hasScenario?: boolean;
}

export const TUTOR_MODES: TutorMode[] = [
  {
    id: 'free_chat',
    label: 'Free Chat',
    description: 'Open conversation on any topic',
    icon: '💬',
  },
  {
    id: 'role_play',
    label: 'Role Play',
    description: 'Practice real-world scenarios',
    icon: '🎭',
    hasScenario: true,
  },
  {
    id: 'word_review',
    label: 'Word Review',
    description: 'Practice vocabulary in context',
    icon: '📝',
  },
  {
    id: 'grammar_glimpse',
    label: 'Grammar',
    description: 'Learn grammar through conversation',
    icon: '📐',
  },
  {
    id: 'pronunciation_coach',
    label: 'Pronunciation',
    description: 'Improve your pronunciation',
    icon: '🗣️',
  },
];

export type ChallengeMode = 'easy' | 'medium' | 'hard';
export const CHALLENGE_MODE_KEY = 'wordzoo-tutor-challenge-mode';

/**
 * Turn caps. One definition, shared by the server that enforces them and the
 * progress bar that shows them — a counter that disagrees with the auto-end is
 * worse than no counter at all.
 */
export const MAX_GUIDED_TURNS = 6;
export const MAX_FREE_TURNS = 10;

export function turnCapForMode(mode: string | null | undefined): number {
  if (mode === 'guided_conversation') return MAX_GUIDED_TURNS;
  return MAX_FREE_TURNS;
}

export const MODE_LABELS: Record<string, string> = {
  free_chat: 'Free Chat',
  role_play: 'Role Play',
  word_review: 'Word Review',
  grammar_glimpse: 'Grammar',
  pronunciation_coach: 'Pronunciation',
  guided_conversation: 'Guided',
};
