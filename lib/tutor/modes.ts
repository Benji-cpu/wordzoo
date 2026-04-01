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
  {
    id: 'path_builder',
    label: 'Build a Path',
    description: 'Create a custom learning path from a scenario',
    icon: '🛠️',
  },
];

export type ChallengeMode = 'easy' | 'medium' | 'hard';
export const CHALLENGE_MODE_KEY = 'wordzoo-tutor-challenge-mode';

export const MODE_LABELS: Record<string, string> = {
  free_chat: 'Free Chat',
  role_play: 'Role Play',
  word_review: 'Word Review',
  grammar_glimpse: 'Grammar',
  pronunciation_coach: 'Pronunciation',
  guided_conversation: 'Guided',
  path_builder: 'Build a Path',
};
