export interface User {
  id: string;
  name: string | null;
  email: string;
  email_verified: Date | null;
  image: string | null;
  native_language: string;
  subscription_tier: 'free' | 'premium';
  preferences: UserPreferences;
  created_at: Date;
  updated_at: Date;
}

export interface UserPreferences {
  audio_speed: number;
  absurdity_level: 'mild' | 'medium' | 'wild';
  hands_free_mode: boolean;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  native_name: string;
  created_at: Date;
}

export interface Word {
  id: string;
  language_id: string;
  text: string;
  romanization: string | null;
  pronunciation_audio_url: string | null;
  meaning_en: string;
  part_of_speech: string;
  frequency_rank: number;
  created_at: Date;
}

export interface Phrase {
  id: string;
  word_id: string;
  text: string;
  meaning_en: string;
  audio_url: string | null;
  created_at: Date;
}

export interface Mnemonic {
  id: string;
  word_id: string;
  user_id: string | null;
  keyword_text: string;
  scene_description: string;
  bridge_sentence: string | null;
  image_url: string | null;
  audio_url: string | null;
  is_custom: boolean;
  upvote_count: number;
  thumbs_up_count: number;
  thumbs_down_count: number;
  image_reviewed: boolean;
  created_at: Date;
}

export interface UserWord {
  id: string;
  user_id: string;
  word_id: string;
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
  current_mnemonic_id: string | null;
  ease_factor: number;
  interval_days: number;
  next_review_at: Date;
  times_reviewed: number;
  times_correct: number;
  last_reviewed_at: Date | null;
  direction: 'recognition' | 'production' | 'both';
  created_at: Date;
  updated_at: Date;
}

export interface Path {
  id: string;
  language_id: string;
  user_id: string | null;
  type: 'premade' | 'custom' | 'travel';
  title: string;
  description: string | null;
  created_at: Date;
}

export interface PathWord {
  path_id: string;
  word_id: string;
  sort_order: number;
}

export interface Scene {
  id: string;
  path_id: string;
  title: string;
  description: string | null;
  combined_scene_image_url: string | null;
  scene_type: 'legacy' | 'dialogue';
  scene_context: string | null;
  sort_order: number;
  created_at: Date;
}

export interface SceneWord {
  scene_id: string;
  word_id: string;
  sort_order: number;
}

export interface UserPath {
  id: string;
  user_id: string;
  path_id: string;
  status: 'active' | 'completed' | 'abandoned';
  started_at: Date;
  completed_at: Date | null;
}

export interface TutorSession {
  id: string;
  user_id: string;
  language_id: string;
  mode: 'free_chat' | 'role_play' | 'word_review' | 'grammar_glimpse' | 'pronunciation_coach' | 'guided_conversation';
  scene_id: string | null;
  scenario: string | null;
  started_at: Date;
  ended_at: Date | null;
  summary: Record<string, unknown> | null;
  tokens_used: number;
  learner_context: Record<string, unknown> | null;
}

export interface LearnerProfile {
  user_id: string;
  language_id: string;
  weakness_patterns: string[];
  topics_covered: string[];
  correction_history: Record<string, unknown>;
  proficiency_estimate: string;
  session_count: number;
  total_messages: number;
  total_practice_minutes: number;
  recent_session_summaries: Record<string, unknown>[];
  updated_at: Date;
}

export interface TutorWordReview {
  id: string;
  session_id: string;
  user_id: string;
  word_id: string;
  language_id: string;
  usage_type: 'correct' | 'corrected' | 'introduced' | 'missed';
  srs_quality: number | null;
  created_at: Date;
}

export interface TutorNudge {
  id: string;
  user_id: string;
  nudge_type: string;
  context: Record<string, unknown> | null;
  shown_at: Date | null;
  dismissed_at: Date | null;
  accepted_at: Date | null;
  created_at: Date;
}

export interface TutorMessage {
  id: string;
  session_id: string;
  role: 'user' | 'model';
  content: string;
  created_at: Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  current_period_end: Date;
  created_at: Date;
}

export interface Purchase {
  id: string;
  user_id: string;
  pack_id: string;
  stripe_payment_id: string;
  purchased_at: Date;
}

export interface DailyUsage {
  id: string;
  user_id: string;
  date: string;
  words_learned: number;
  tutor_messages: number;
  hands_free_seconds: number;
  regenerations: number;
}

export interface CommunityMnemonic {
  id: string;
  mnemonic_id: string;
  submitted_by: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  submitted_at: Date;
  reviewed_at: Date | null;
}

export interface MnemonicVote {
  id: string;
  user_id: string;
  mnemonic_id: string;
  created_at: Date;
}

export interface MnemonicFlag {
  id: string;
  user_id: string;
  mnemonic_id: string;
  reason: 'offensive' | 'spam' | 'misleading' | 'other';
  detail: string | null;
  created_at: Date;
  resolved: boolean;
}

export interface MnemonicFeedback {
  id: string;
  user_id: string;
  mnemonic_id: string;
  rating: 'thumbs_up' | 'thumbs_down';
  comment: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ShareEvent {
  id: string;
  user_id: string | null;
  mnemonic_id: string;
  word_id: string;
  platform: string | null;
  format: 'square' | 'story';
  created_at: Date;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  click_ip: string | null;
  click_at: Date;
  signup_at: Date | null;
  status: 'clicked' | 'signed_up';
}

// --- Dialogue-based learning types ---

export interface SceneDialogue {
  id: string;
  scene_id: string;
  speaker: string;
  text_target: string;
  text_en: string;
  audio_url: string | null;
  sort_order: number;
  created_at: Date;
}

export interface ScenePhrase {
  id: string;
  scene_id: string;
  text_target: string;
  text_en: string;
  literal_translation: string | null;
  audio_url: string | null;
  usage_note: string | null;
  sort_order: number;
  created_at: Date;
}

export interface PhraseWord {
  phrase_id: string;
  word_id: string;
  position: number;
}

export interface PhraseWordMnemonic {
  word_id: string;
  word_text: string;
  word_en: string;
  part_of_speech: string;
  position: number;
  keyword_text: string | null;
  bridge_sentence: string | null;
  image_url: string | null;
}

export interface ScenePhraseWithMnemonics extends ScenePhrase {
  words: PhraseWordMnemonic[];
}

export interface ScenePatternExercise {
  id: string;
  scene_id: string;
  pattern_template: string;
  pattern_en: string;
  explanation: string | null;
  prompt: string;
  hint_en: string | null;
  correct_answer: string;
  distractors: string[];
  sort_order: number;
  created_at: Date;
}

export interface UserPhrase {
  id: string;
  user_id: string;
  phrase_id: string;
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
  ease_factor: number;
  interval_days: number;
  next_review_at: Date;
  times_reviewed: number;
  times_correct: number;
  last_reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type SceneFlowPhase = 'dialogue' | 'phrases' | 'vocabulary' | 'patterns' | 'conversation' | 'summary';

export interface UserSceneProgress {
  id: string;
  user_id: string;
  scene_id: string;
  current_phase: SceneFlowPhase;
  phase_index: number;
  dialogue_completed: boolean;
  phrases_completed: boolean;
  vocabulary_completed: boolean;
  patterns_completed: boolean;
  conversation_completed: boolean;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
