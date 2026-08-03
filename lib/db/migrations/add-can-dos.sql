-- The capability layer: can_dos (content) + user_can_dos (per-user state).
-- Applied by lib/db/apply-can-dos.ts. This file documents the delta only —
-- nothing reads lib/db/migrations/ at runtime.

CREATE TABLE IF NOT EXISTS can_dos (
  id UUID PRIMARY KEY,
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  statement_en TEXT NOT NULL,
  prompt_en TEXT NOT NULL,
  reference_target TEXT NOT NULL,
  accept_notes TEXT,
  must_include TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'ai_generated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_can_dos_scene ON can_dos(scene_id, sort_order);

CREATE TABLE IF NOT EXISTS user_can_dos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  can_do_id UUID NOT NULL REFERENCES can_dos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unlocked' CHECK (status IN ('unlocked','certified')),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eligible_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  fails INTEGER NOT NULL DEFAULT 0,
  certified_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  last_attempt_text TEXT,
  last_verdict TEXT CHECK (last_verdict IN ('pass','fail','unclear')),
  last_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, can_do_id)
);
CREATE INDEX IF NOT EXISTS idx_user_can_dos_due
  ON user_can_dos(user_id, eligible_at) WHERE status = 'unlocked';
CREATE INDEX IF NOT EXISTS idx_user_can_dos_certified
  ON user_can_dos(user_id, certified_at DESC) WHERE status = 'certified';
