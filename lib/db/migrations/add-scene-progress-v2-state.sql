-- Pedagogy v2 sub-state for user_scene_progress.
-- phase_step: 'intro' | 'drill' | 'checkpoint' (NULL when v2 isn't active for the current phase).
-- phase_batch: batch index inside the v2 phase.
ALTER TABLE user_scene_progress
  ADD COLUMN IF NOT EXISTS phase_step text,
  ADD COLUMN IF NOT EXISTS phase_batch integer NOT NULL DEFAULT 0;
