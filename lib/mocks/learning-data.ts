import type { Word, Mnemonic, UserWord, Path, Scene, SceneWord } from '@/types/database';

// ── Helper ──────────────────────────────────────────────────────────
function uuid(n: number): string {
  return `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
}

const LANG_ID = uuid(100); // Indonesian

// ── Words ───────────────────────────────────────────────────────────
const MOCK_WORDS: Word[] = [
  { id: uuid(1), language_id: LANG_ID, text: 'halo', romanization: null, pronunciation_audio_url: null, meaning_en: 'hello', part_of_speech: 'interjection', frequency_rank: 25, created_at: new Date() },
  { id: uuid(2), language_id: LANG_ID, text: 'nama', romanization: null, pronunciation_audio_url: null, meaning_en: 'name', part_of_speech: 'noun', frequency_rank: 9, created_at: new Date() },
  { id: uuid(3), language_id: LANG_ID, text: 'saya', romanization: null, pronunciation_audio_url: null, meaning_en: 'I / me', part_of_speech: 'pronoun', frequency_rank: 1, created_at: new Date() },
  { id: uuid(4), language_id: LANG_ID, text: 'baik', romanization: null, pronunciation_audio_url: null, meaning_en: 'good / fine', part_of_speech: 'adjective', frequency_rank: 10, created_at: new Date() },
  { id: uuid(5), language_id: LANG_ID, text: 'anda', romanization: null, pronunciation_audio_url: null, meaning_en: 'you (formal)', part_of_speech: 'pronoun', frequency_rank: 12, created_at: new Date() },
  { id: uuid(6), language_id: LANG_ID, text: 'selamat pagi', romanization: null, pronunciation_audio_url: null, meaning_en: 'good morning', part_of_speech: 'phrase', frequency_rank: 20, created_at: new Date() },
  { id: uuid(7), language_id: LANG_ID, text: 'makan', romanization: null, pronunciation_audio_url: null, meaning_en: 'eat', part_of_speech: 'verb', frequency_rank: 12, created_at: new Date() },
  { id: uuid(8), language_id: LANG_ID, text: 'minum', romanization: null, pronunciation_audio_url: null, meaning_en: 'drink', part_of_speech: 'verb', frequency_rank: 13, created_at: new Date() },
  { id: uuid(9), language_id: LANG_ID, text: 'air', romanization: null, pronunciation_audio_url: null, meaning_en: 'water', part_of_speech: 'noun', frequency_rank: 35, created_at: new Date() },
  { id: uuid(10), language_id: LANG_ID, text: 'enak', romanization: null, pronunciation_audio_url: null, meaning_en: 'delicious', part_of_speech: 'adjective', frequency_rank: 85, created_at: new Date() },
  { id: uuid(11), language_id: LANG_ID, text: 'berapa', romanization: null, pronunciation_audio_url: null, meaning_en: 'how much', part_of_speech: 'pronoun', frequency_rank: 14, created_at: new Date() },
  { id: uuid(12), language_id: LANG_ID, text: 'tolong', romanization: null, pronunciation_audio_url: null, meaning_en: 'help / please', part_of_speech: 'verb', frequency_rank: 30, created_at: new Date() },
];

// ── Mnemonics ───────────────────────────────────────────────────────
const MOCK_MNEMONICS: Record<string, Mnemonic> = {
  [uuid(1)]: { id: uuid(201), word_id: uuid(1), user_id: null, keyword_text: 'hollow', scene_description: 'You shout "hello" into a hollow cave and the echo greets you back with a warm "halo!"', image_url: '/onboarding/id-kucing.png', audio_url: null, is_custom: false, upvote_count: 12, thumbs_up_count: 0, thumbs_down_count: 0, bridge_sentence: null, image_reviewed: false, created_at: new Date() },
  [uuid(2)]: { id: uuid(202), word_id: uuid(2), user_id: null, keyword_text: 'nah-ma', scene_description: 'A llama wearing a name tag that says "Nah-Ma" — the llama introduces itself at a party.', image_url: '/onboarding/id-besar.png', audio_url: null, is_custom: false, upvote_count: 8, thumbs_up_count: 0, thumbs_down_count: 0, bridge_sentence: null, image_reviewed: false, created_at: new Date() },
  [uuid(3)]: { id: uuid(203), word_id: uuid(3), user_id: null, keyword_text: 'sawyer', scene_description: 'Tom Sawyer pointing at himself saying "saya" — he always talks about himself.', image_url: '/onboarding/id-makan.png', audio_url: null, is_custom: false, upvote_count: 15, thumbs_up_count: 0, thumbs_down_count: 0, bridge_sentence: null, image_reviewed: false, created_at: new Date() },
  [uuid(4)]: { id: uuid(204), word_id: uuid(4), user_id: null, keyword_text: 'bike', scene_description: 'A shiny bike with a big thumbs-up painted on the frame — "baik" means everything is good, just like a smooth bike ride.', image_url: '/onboarding/id-kucing.png', audio_url: null, is_custom: false, upvote_count: 10, thumbs_up_count: 0, thumbs_down_count: 0, bridge_sentence: null, image_reviewed: false, created_at: new Date() },
  [uuid(5)]: { id: uuid(205), word_id: uuid(5), user_id: null, keyword_text: 'Honda', scene_description: 'A Honda car pulls up and the driver politely asks "anda" — addressing you formally through the window.', image_url: '/onboarding/id-besar.png', audio_url: null, is_custom: false, upvote_count: 7, thumbs_up_count: 0, thumbs_down_count: 0, bridge_sentence: null, image_reviewed: false, created_at: new Date() },
  [uuid(6)]: { id: uuid(206), word_id: uuid(6), user_id: null, keyword_text: 'salami-party', scene_description: 'A sunrise salami party where everyone greets each other with "selamat pagi" while sharing morning snacks.', image_url: '/onboarding/id-makan.png', audio_url: null, is_custom: false, upvote_count: 11, thumbs_up_count: 0, thumbs_down_count: 0, bridge_sentence: null, image_reviewed: false, created_at: new Date() },
  [uuid(7)]: { id: uuid(207), word_id: uuid(7), user_id: null, keyword_text: "mackin'", scene_description: "Someone mackin' on a huge plate of nasi goreng, chopsticks flying, rice grains everywhere, pure joy on their face.", image_url: '/onboarding/id-makan.png', audio_url: null, is_custom: false, upvote_count: 20, thumbs_up_count: 0, thumbs_down_count: 0, bridge_sentence: null, image_reviewed: false, created_at: new Date() },
  [uuid(8)]: { id: uuid(208), word_id: uuid(8), user_id: null, keyword_text: 'mean-ooh', scene_description: 'A mean ogre goes "ooh!" when he takes a refreshing drink from a sparkling fountain.', image_url: '/onboarding/id-kucing.png', audio_url: null, is_custom: false, upvote_count: 9, thumbs_up_count: 0, thumbs_down_count: 0, bridge_sentence: null, image_reviewed: false, created_at: new Date() },
  [uuid(9)]: { id: uuid(209), word_id: uuid(9), user_id: null, keyword_text: 'air guitar', scene_description: 'Someone playing air guitar in the rain — "air" means water and it is pouring down on the rock star.', image_url: '/onboarding/id-besar.png', audio_url: null, is_custom: false, upvote_count: 14, thumbs_up_count: 0, thumbs_down_count: 0, bridge_sentence: null, image_reviewed: false, created_at: new Date() },
  [uuid(10)]: { id: uuid(210), word_id: uuid(10), user_id: null, keyword_text: 'eh-knock', scene_description: 'You knock on a restaurant door and the chef says "eh!" and serves you the most delicious dish ever.', image_url: '/onboarding/id-makan.png', audio_url: null, is_custom: false, upvote_count: 6, thumbs_up_count: 0, thumbs_down_count: 0, bridge_sentence: null, image_reviewed: false, created_at: new Date() },
  [uuid(11)]: { id: uuid(211), word_id: uuid(11), user_id: null, keyword_text: 'bear-rapper', scene_description: 'A bear rapper asking "how much" for his mixtape at a market stall — "berapa" for the beats?', image_url: '/onboarding/id-kucing.png', audio_url: null, is_custom: false, upvote_count: 13, thumbs_up_count: 0, thumbs_down_count: 0, bridge_sentence: null, image_reviewed: false, created_at: new Date() },
  [uuid(12)]: { id: uuid(212), word_id: uuid(12), user_id: null, keyword_text: 'toe-long', scene_description: 'A person with a comically long toe reaches it out to press the help button — "tolong" please!', image_url: '/onboarding/id-besar.png', audio_url: null, is_custom: false, upvote_count: 16, thumbs_up_count: 0, thumbs_down_count: 0, bridge_sentence: null, image_reviewed: false, created_at: new Date() },
};

// ── Quiz distractors per word ───────────────────────────────────────
const MOCK_DISTRACTORS: Record<string, string[]> = {
  [uuid(1)]: ['goodbye', 'thank you', 'sorry'],
  [uuid(2)]: ['house', 'friend', 'food'],
  [uuid(3)]: ['you', 'they', 'we'],
  [uuid(4)]: ['bad', 'fast', 'big'],
  [uuid(5)]: ['I', 'they', 'we'],
  [uuid(6)]: ['good night', 'thank you', 'goodbye'],
  [uuid(7)]: ['drink', 'sleep', 'run'],
  [uuid(8)]: ['eat', 'walk', 'read'],
  [uuid(9)]: ['fire', 'earth', 'wind'],
  [uuid(10)]: ['spicy', 'sour', 'bitter'],
  [uuid(11)]: ['when', 'where', 'who'],
  [uuid(12)]: ['run', 'hide', 'fight'],
};

// ── Scenes ──────────────────────────────────────────────────────────
const PATH_ID = uuid(300);

const MOCK_SCENES: Scene[] = [
  { id: uuid(301), path_id: PATH_ID, title: 'Meeting Someone', description: 'You walk into a cozy warung in Ubud. The owner smiles warmly and greets you.', combined_scene_image_url: null, anchor_image_url: null, scene_type: 'legacy', scene_context: null, sort_order: 0, created_at: new Date() },
  { id: uuid(302), path_id: PATH_ID, title: 'Getting Food', description: 'The aroma of sate and nasi goreng fills the air as you sit down at a street food stall.', combined_scene_image_url: null, anchor_image_url: null, scene_type: 'legacy', scene_context: null, sort_order: 1, created_at: new Date() },
  { id: uuid(303), path_id: PATH_ID, title: 'Shopping', description: 'You wander through a vibrant market in Bali. Colorful batik fabrics hang everywhere.', combined_scene_image_url: null, anchor_image_url: null, scene_type: 'legacy', scene_context: null, sort_order: 2, created_at: new Date() },
];

const MOCK_SCENE_WORDS: Record<string, string[]> = {
  [uuid(301)]: [uuid(1), uuid(2), uuid(3), uuid(4), uuid(5), uuid(6)],
  [uuid(302)]: [uuid(7), uuid(8), uuid(9), uuid(10)],
  [uuid(303)]: [uuid(11), uuid(12)],
};

// ── Paths ───────────────────────────────────────────────────────────
const MOCK_PATHS: Path[] = [
  { id: PATH_ID, language_id: LANG_ID, user_id: null, type: 'premade', title: 'Survival Indonesian', description: 'Essential words and phrases for your first trip to Indonesia.', created_at: new Date() },
  { id: uuid(310), language_id: LANG_ID, user_id: null, type: 'premade', title: 'Daily Conversation', description: 'Build confidence for everyday interactions.', created_at: new Date() },
  { id: uuid(320), language_id: LANG_ID, user_id: null, type: 'travel', title: 'Bali Beach Trip', description: 'Words for a perfect beach vacation in Bali.', created_at: new Date() },
  { id: uuid(330), language_id: LANG_ID, user_id: null, type: 'travel', title: 'Jakarta Business', description: 'Professional phrases for business meetings.', created_at: new Date() },
  { id: uuid(340), language_id: LANG_ID, user_id: 'user-1', type: 'custom', title: 'Cooking Words', description: 'Words I want to learn for cooking Indonesian food.', created_at: new Date() },
];

// ── Public API ──────────────────────────────────────────────────────

export interface MockWordWithMnemonic {
  word: Word;
  mnemonic: Mnemonic;
  distractors: string[];
}

export interface MockSceneData {
  scene: Scene;
  words: MockWordWithMnemonic[];
}

export interface MockDashboardData {
  activePath: Path;
  activeScene: Scene;
  wordsLearned: number;
  wordsMastered: number;
  totalWords: number;
  dueWordCount: number;
  streak: number;
  sceneProgress: number; // 0–100
}

export interface MockPathWithProgress {
  path: Path;
  wordCount: number;
  wordsCompleted: number;
  progress: number; // 0–100
}

export function getMockScene(sceneId: string): MockSceneData {
  const scene = MOCK_SCENES.find(s => s.id === sceneId) ?? MOCK_SCENES[0];
  const wordIds = MOCK_SCENE_WORDS[scene.id] ?? MOCK_SCENE_WORDS[uuid(301)];

  const words: MockWordWithMnemonic[] = wordIds.map(wid => {
    const word = MOCK_WORDS.find(w => w.id === wid)!;
    return {
      word,
      mnemonic: MOCK_MNEMONICS[wid],
      distractors: MOCK_DISTRACTORS[wid],
    };
  });

  return { scene, words };
}

export function getMockDueWords(): (UserWord & { word: Word; mnemonic: Mnemonic })[] {
  return MOCK_WORDS.slice(0, 6).map((word, i) => ({
    id: uuid(400 + i),
    user_id: 'user-1',
    word_id: word.id,
    status: i < 2 ? 'reviewing' as const : 'learning' as const,
    current_mnemonic_id: MOCK_MNEMONICS[word.id]?.id ?? null,
    ease_factor: 2.5,
    interval_days: i < 2 ? 3 : 1,
    next_review_at: new Date(),
    times_reviewed: i < 2 ? 5 : 1,
    times_correct: i < 2 ? 4 : 0,
    last_reviewed_at: new Date(Date.now() - 86400000),
    direction: 'recognition' as const,
    created_at: new Date(),
    updated_at: new Date(),
    word,
    mnemonic: MOCK_MNEMONICS[word.id],
  }));
}

export function getMockDashboardData(): MockDashboardData {
  return {
    activePath: MOCK_PATHS[0],
    activeScene: MOCK_SCENES[0],
    wordsLearned: 18,
    wordsMastered: 7,
    totalWords: 42,
    dueWordCount: 5,
    streak: 4,
    sceneProgress: 50,
  };
}

export function getMockPaths(): MockPathWithProgress[] {
  return MOCK_PATHS.map((path, i) => ({
    path,
    wordCount: [42, 35, 24, 20, 12][i],
    wordsCompleted: [18, 0, 8, 0, 3][i],
    progress: [43, 0, 33, 0, 25][i],
  }));
}

export function getMockSceneList(): Scene[] {
  return MOCK_SCENES;
}

export { MOCK_WORDS, MOCK_MNEMONICS, MOCK_SCENES, MOCK_PATHS, PATH_ID };
