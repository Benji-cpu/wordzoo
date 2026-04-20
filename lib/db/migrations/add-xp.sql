-- XP total + XP event log (UI Polish pause — Phase 1)
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_total INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_xp_events_user ON user_xp_events(user_id, created_at DESC);
