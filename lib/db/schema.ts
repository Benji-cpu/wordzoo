export const CREATE_TABLES_SQL = `
-- Users (extended beyond Auth.js default)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  native_language TEXT NOT NULL DEFAULT 'en',
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  preferences JSONB NOT NULL DEFAULT '{"audio_speed": 1, "absurdity_level": "medium", "hands_free_mode": false}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure custom columns exist when NextAuth adapter created users table first
ALTER TABLE users ADD COLUMN IF NOT EXISTS native_language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{"audio_speed": 1, "absurdity_level": "medium", "hands_free_mode": false}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_subscription_tier_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check CHECK (subscription_tier IN ('free', 'premium'));
  END IF;
END $$;

-- Auth.js required tables
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Languages
CREATE TABLE IF NOT EXISTS languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Words
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  romanization TEXT,
  pronunciation_audio_url TEXT,
  meaning_en TEXT NOT NULL,
  part_of_speech TEXT NOT NULL,
  frequency_rank INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phrases
CREATE TABLE IF NOT EXISTS phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  meaning_en TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mnemonics
CREATE TABLE IF NOT EXISTS mnemonics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  keyword_text TEXT NOT NULL,
  scene_description TEXT NOT NULL,
  image_url TEXT,
  audio_url TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  upvote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Words (SRS tracking)
CREATE TABLE IF NOT EXISTS user_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'learning', 'reviewing', 'mastered')),
  current_mnemonic_id UUID REFERENCES mnemonics(id) ON DELETE SET NULL,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  times_reviewed INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  direction TEXT NOT NULL DEFAULT 'recognition' CHECK (direction IN ('recognition', 'production', 'both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- Paths
CREATE TABLE IF NOT EXISTS paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'premade' CHECK (type IN ('premade', 'custom', 'travel')),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Path Words (composite PK)
CREATE TABLE IF NOT EXISTS path_words (
  path_id UUID NOT NULL REFERENCES paths(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (path_id, word_id)
);

-- Scenes
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  combined_scene_image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scene Words (composite PK)
CREATE TABLE IF NOT EXISTS scene_words (
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (scene_id, word_id)
);

-- User Paths (active/completed path tracking)
CREATE TABLE IF NOT EXISTS user_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES paths(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, path_id)
);

-- Tutor Sessions
CREATE TABLE IF NOT EXISTS tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('free_chat','role_play','word_review','grammar_glimpse','pronunciation_coach')),
  scenario TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  summary JSONB,
  tokens_used INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_user ON tutor_sessions(user_id, started_at DESC);

-- Tutor Messages
CREATE TABLE IF NOT EXISTS tutor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','model')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_session ON tutor_messages(session_id, created_at);

-- Community Mnemonics (submitted to community)
CREATE TABLE IF NOT EXISTS community_mnemonics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mnemonic_id UUID NOT NULL REFERENCES mnemonics(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','flagged')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(mnemonic_id)
);
CREATE INDEX IF NOT EXISTS idx_community_mnemonics_status ON community_mnemonics(status);

-- Mnemonic Votes (one upvote per user per mnemonic)
CREATE TABLE IF NOT EXISTS mnemonic_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mnemonic_id UUID NOT NULL REFERENCES mnemonics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mnemonic_id)
);
CREATE INDEX IF NOT EXISTS idx_mnemonic_votes_mnemonic ON mnemonic_votes(mnemonic_id);

-- Mnemonic Flags (user reports)
CREATE TABLE IF NOT EXISTS mnemonic_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mnemonic_id UUID NOT NULL REFERENCES mnemonics(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('offensive','spam','misleading','other')),
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, mnemonic_id)
);

-- Share Events
CREATE TABLE IF NOT EXISTS share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  mnemonic_id UUID NOT NULL REFERENCES mnemonics(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  platform TEXT,
  format TEXT NOT NULL DEFAULT 'square' CHECK (format IN ('square','story')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_share_events_user ON share_events(user_id, created_at DESC);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  click_ip TEXT,
  click_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signup_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'clicked' CHECK (status IN ('clicked','signed_up'))
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);

-- Purchases (travel pack one-time purchases)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES paths(id) ON DELETE CASCADE,
  stripe_payment_id TEXT NOT NULL UNIQUE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);

-- Daily Usage (free tier limit tracking)
CREATE TABLE IF NOT EXISTS daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  words_learned INTEGER NOT NULL DEFAULT 0,
  tutor_messages INTEGER NOT NULL DEFAULT 0,
  hands_free_seconds INTEGER NOT NULL DEFAULT 0,
  regenerations INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage(user_id, date DESC);

-- Mnemonic feedback counter columns
ALTER TABLE mnemonics ADD COLUMN IF NOT EXISTS thumbs_up_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE mnemonics ADD COLUMN IF NOT EXISTS thumbs_down_count INTEGER NOT NULL DEFAULT 0;

-- Bridge sentence and image review columns
ALTER TABLE mnemonics ADD COLUMN IF NOT EXISTS bridge_sentence TEXT;
ALTER TABLE mnemonics ADD COLUMN IF NOT EXISTS image_reviewed BOOLEAN NOT NULL DEFAULT false;

-- Mnemonic Feedback (thumbs up/down + optional comment)
CREATE TABLE IF NOT EXISTS mnemonic_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mnemonic_id UUID NOT NULL REFERENCES mnemonics(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('thumbs_up', 'thumbs_down')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mnemonic_id)
);
CREATE INDEX IF NOT EXISTS idx_mnemonic_feedback_mnemonic ON mnemonic_feedback(mnemonic_id);

-- Scene type + context columns for dialogue-based learning
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS scene_type TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS scene_context TEXT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scenes_scene_type_check') THEN
    ALTER TABLE scenes ADD CONSTRAINT scenes_scene_type_check CHECK (scene_type IN ('legacy', 'dialogue'));
  END IF;
END $$;

-- Tutor sessions: add scene linkage + expand mode
ALTER TABLE tutor_sessions ADD COLUMN IF NOT EXISTS scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL;

DO $$
DECLARE
  _conname TEXT;
BEGIN
  SELECT conname INTO _conname FROM pg_constraint
  WHERE conrelid = 'tutor_sessions'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%mode%';
  IF _conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE tutor_sessions DROP CONSTRAINT %I', _conname);
  END IF;
  ALTER TABLE tutor_sessions ADD CONSTRAINT tutor_sessions_mode_check
    CHECK (mode IN ('free_chat','role_play','word_review','grammar_glimpse','pronunciation_coach','guided_conversation'));
END $$;

-- Scene Dialogues (anchor dialogue lines per scene)
CREATE TABLE IF NOT EXISTS scene_dialogues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL,
  text_target TEXT NOT NULL,
  text_en TEXT NOT NULL,
  audio_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scene_dialogues_scene ON scene_dialogues(scene_id, sort_order);

-- Scene Phrases (key functional phrases per scene)
CREATE TABLE IF NOT EXISTS scene_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  text_target TEXT NOT NULL,
  text_en TEXT NOT NULL,
  literal_translation TEXT,
  audio_url TEXT,
  usage_note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scene_phrases_scene ON scene_phrases(scene_id, sort_order);

-- Phrase Words (links phrases to constituent vocabulary)
CREATE TABLE IF NOT EXISTS phrase_words (
  phrase_id UUID NOT NULL REFERENCES scene_phrases(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (phrase_id, word_id)
);

-- Scene Pattern Exercises (grammar patterns with fill-in exercises)
CREATE TABLE IF NOT EXISTS scene_pattern_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  pattern_template TEXT NOT NULL,
  pattern_en TEXT NOT NULL,
  explanation TEXT,
  prompt TEXT NOT NULL,
  hint_en TEXT,
  correct_answer TEXT NOT NULL,
  distractors TEXT[] NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scene_pattern_exercises_scene ON scene_pattern_exercises(scene_id, sort_order);

-- User Phrases (SRS tracking for phrases, mirrors user_words)
CREATE TABLE IF NOT EXISTS user_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phrase_id UUID NOT NULL REFERENCES scene_phrases(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','learning','reviewing','mastered')),
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  times_reviewed INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, phrase_id)
);
CREATE INDEX IF NOT EXISTS idx_user_phrases_review ON user_phrases(user_id, next_review_at);

-- User Scene Progress (tracks 6-phase completion per scene)
CREATE TABLE IF NOT EXISTS user_scene_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  current_phase TEXT NOT NULL DEFAULT 'dialogue' CHECK (current_phase IN ('dialogue','phrases','vocabulary','patterns','conversation','summary')),
  phase_index INTEGER NOT NULL DEFAULT 0,
  dialogue_completed BOOLEAN NOT NULL DEFAULT false,
  phrases_completed BOOLEAN NOT NULL DEFAULT false,
  vocabulary_completed BOOLEAN NOT NULL DEFAULT false,
  patterns_completed BOOLEAN NOT NULL DEFAULT false,
  conversation_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, scene_id)
);

-- Performance indexes for core queries
CREATE INDEX IF NOT EXISTS idx_user_words_user_next_review ON user_words(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_user_words_user_status ON user_words(user_id, status);
CREATE INDEX IF NOT EXISTS idx_mnemonics_word ON mnemonics(word_id);
CREATE INDEX IF NOT EXISTS idx_scenes_path_sort ON scenes(path_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_paths_language ON paths(language_id);
CREATE INDEX IF NOT EXISTS idx_words_language ON words(language_id);

-- User Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);

-- Learner Profiles (adaptive tutor intelligence)
CREATE TABLE IF NOT EXISTS learner_profiles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  weakness_patterns JSONB NOT NULL DEFAULT '[]',
  topics_covered JSONB NOT NULL DEFAULT '[]',
  correction_history JSONB NOT NULL DEFAULT '{}',
  proficiency_estimate TEXT NOT NULL DEFAULT 'beginner',
  session_count INT NOT NULL DEFAULT 0,
  total_messages INT NOT NULL DEFAULT 0,
  total_practice_minutes INT NOT NULL DEFAULT 0,
  recent_session_summaries JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, language_id)
);

-- Tutor Word Reviews (SRS bridge tracking)
CREATE TABLE IF NOT EXISTS tutor_word_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('correct','corrected','introduced','missed')),
  srs_quality INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tutor_word_reviews_session ON tutor_word_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_tutor_word_reviews_user ON tutor_word_reviews(user_id, language_id, created_at DESC);

-- Tutor Nudges (smart suggestion tracking)
CREATE TABLE IF NOT EXISTS tutor_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL,
  context JSONB,
  shown_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tutor_nudges_user ON tutor_nudges(user_id, created_at DESC);

-- Tutor Sessions: adaptive context snapshot
ALTER TABLE tutor_sessions ADD COLUMN IF NOT EXISTS learner_context JSONB;

-- Scene anchor image (the memory palace "room")
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS anchor_image_url TEXT;

-- Phrase-level mnemonic data
ALTER TABLE scene_phrases ADD COLUMN IF NOT EXISTS phrase_bridge_sentence TEXT;
ALTER TABLE scene_phrases ADD COLUMN IF NOT EXISTS composite_image_url TEXT;
ALTER TABLE scene_phrases ADD COLUMN IF NOT EXISTS composite_scene_description TEXT;

-- Studio Sessions (Path Studio co-creation sessions)
CREATE TABLE IF NOT EXISTS studio_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  intake_data JSONB DEFAULT '{}',
  messages JSONB DEFAULT '[]',
  path_preview JSONB,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  path_id UUID REFERENCES paths(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_studio_sessions_user ON studio_sessions(user_id, created_at DESC);

DO $$
DECLARE
  _conname TEXT;
BEGIN
  SELECT conname INTO _conname FROM pg_constraint
  WHERE conrelid = 'paths'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%type%';
  IF _conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE paths DROP CONSTRAINT %I', _conname);
  END IF;
  ALTER TABLE paths ADD CONSTRAINT paths_type_check CHECK (type IN ('premade', 'custom', 'travel', 'studio'));
END $$;
`;
