-- Studio Path Purchases (one-time $2.99 per-path purchases for free users)
CREATE TABLE IF NOT EXISTS studio_path_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  studio_session_id UUID REFERENCES studio_sessions(id) ON DELETE SET NULL,
  stripe_payment_id TEXT,
  path_id UUID REFERENCES paths(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_studio_path_purchases_user ON studio_path_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_path_purchases_unconsumed
  ON studio_path_purchases(user_id) WHERE consumed_at IS NULL;
