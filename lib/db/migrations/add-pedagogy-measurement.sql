-- Measurement layer: indexes for the pedagogy admin rollups, plus the
-- phase_step/phase_batch drift repair (those columns were added by
-- add-scene-progress-v2-state.sql but never landed in lib/db/schema.ts).
--
-- Applied by lib/db/apply-pedagogy-measurement.ts. This file is documentation
-- of the delta only — nothing reads lib/db/migrations/ at runtime.

ALTER TABLE user_scene_progress ADD COLUMN IF NOT EXISTS phase_step TEXT;
ALTER TABLE user_scene_progress ADD COLUMN IF NOT EXISTS phase_batch INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_words_next_review
  ON user_words(next_review_at) WHERE status <> 'new';

CREATE INDEX IF NOT EXISTS idx_user_phrases_next_review
  ON user_phrases(next_review_at) WHERE status <> 'new';

CREATE INDEX IF NOT EXISTS idx_user_scene_progress_completed
  ON user_scene_progress(completed_at) WHERE completed_at IS NOT NULL;
