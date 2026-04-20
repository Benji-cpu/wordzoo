export type TriggerContext =
  | 'mnemonic_card'
  | 'quiz_correct'
  | 'scene_summary'
  | 'review_start'
  | 'tutor_first'
  | 'word_family'
  | 'dashboard';

export type TriggerCondition =
  | { type: 'nth_encounter'; context: string; n: number }
  | { type: 'first_encounter' }
  | { type: 'milestone'; metric: string; value: number };

export interface InsightDefinition {
  id: string;
  title: string;
  body: string;
  icon: string;
  triggerContext: TriggerContext;
  triggerCondition: TriggerCondition;
  priority: number; // lower = higher priority
}

export const INSIGHTS: InsightDefinition[] = [
  {
    id: 'visual_mnemonics',
    title: 'Why this image works',
    body: 'Your brain remembers pictures 6x better than text alone. The weirder the scene, the stickier the memory. Scientists call this "dual coding" — you\'re encoding the word through both language AND imagery at once.',
    icon: '🧠',
    triggerContext: 'mnemonic_card',
    triggerCondition: { type: 'nth_encounter', context: 'mnemonic_viewed', n: 1 },
    priority: 1,
  },
  {
    id: 'keyword_bridge',
    title: 'The sound bridge',
    body: 'The keyword sounds like the foreign word on purpose. Your brain hears the new word, thinks of the keyword, and pictures the scene. That phonetic bridge is the fastest path from new sound to meaning. You\'ll stop needing it once the word is automatic.',
    icon: '🔊',
    triggerContext: 'mnemonic_card',
    triggerCondition: { type: 'nth_encounter', context: 'mnemonic_viewed', n: 2 },
    priority: 2,
  },
  {
    id: 'testing_effect',
    title: 'Why we quiz you',
    body: 'Being tested isn\'t just measurement — it\'s learning itself. Retrieving a memory makes it stronger, far more than re-reading does. Every time you pull the answer from memory, the neural pathway gets deeper.',
    icon: '✅',
    triggerContext: 'quiz_correct',
    triggerCondition: { type: 'first_encounter' },
    priority: 3,
  },
  {
    id: 'cognitive_chunking',
    title: 'Why scenes group words',
    body: 'Your working memory holds about 7 items at a time. That\'s why each scene teaches a handful of words, not 50. Small batches with context — a scene, a story — create richer memory networks than random word lists ever could.',
    icon: '🧩',
    triggerContext: 'scene_summary',
    triggerCondition: { type: 'first_encounter' },
    priority: 4,
  },
  {
    id: 'spacing_effect',
    title: 'Why reviews come back',
    body: 'Memories fade on a predictable curve. WordZoo times your reviews to catch each word just before you\'d forget it. Each successful recall pushes the next review further out. This is spaced repetition — the most efficient way to move words into permanent memory.',
    icon: '📈',
    triggerContext: 'review_start',
    triggerCondition: { type: 'first_encounter' },
    priority: 5,
  },
  {
    id: 'tutor_production',
    title: 'Speaking vs. recognizing',
    body: 'Recognizing a word and producing it are two different skills. The tutor pushes you to use words in conversation, building "production" memory. Think of it as the difference between understanding a joke and being funny yourself.',
    icon: '💬',
    triggerContext: 'tutor_first',
    triggerCondition: { type: 'first_encounter' },
    priority: 6,
  },
  {
    id: 'word_families',
    title: 'One root, many words',
    body: 'Learning one root unlocks a whole family of words. When you know "makan" (eat), you\'re halfway to "makanan" (food) and "dimakan" (eaten). Spotting these patterns is how fluent speakers rapidly expand vocabulary.',
    icon: '🌳',
    triggerContext: 'word_family',
    triggerCondition: { type: 'first_encounter' },
    priority: 7,
  },
  {
    id: 'learning_loop',
    title: 'The full picture',
    body: 'You\'ve experienced the full WordZoo cycle: discover words in scenes, practice with the tutor, review as they come due, master them over time. Each step reinforces the others. Keep the loop spinning and the words become permanent.',
    icon: '🔄',
    triggerContext: 'dashboard',
    triggerCondition: { type: 'milestone', metric: 'words_learned', value: 15 },
    priority: 8,
  },
];

/** Max insights shown per calendar day */
export const DAILY_INSIGHT_BUDGET = 2;

/** Users with this many completed scenes at deploy skip insights 1-4 */
export const EXISTING_USER_SCENE_THRESHOLD = 5;
