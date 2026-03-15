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
  image_url: string | null;
  audio_url: string | null;
  is_custom: boolean;
  upvote_count: number;
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
  mode: 'free_chat' | 'role_play' | 'word_review' | 'grammar_glimpse' | 'pronunciation_coach';
  scenario: string | null;
  started_at: Date;
  ended_at: Date | null;
  summary: Record<string, unknown> | null;
  tokens_used: number;
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
