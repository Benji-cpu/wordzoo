-- Word morphological relationships
CREATE TABLE IF NOT EXISTS word_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  derived_word_id UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  affix_type TEXT NOT NULL,
  affix_rule TEXT,
  meaning_shift TEXT,
  UNIQUE(root_word_id, derived_word_id)
);

-- Affix decomposition/construction exercises
CREATE TABLE IF NOT EXISTS affix_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('decompose', 'construct', 'match', 'predict')),
  root_word TEXT NOT NULL,
  root_meaning TEXT NOT NULL,
  target_affix TEXT NOT NULL,
  derived_word TEXT NOT NULL,
  derived_meaning TEXT NOT NULL,
  explanation TEXT NOT NULL,
  distractors TEXT[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_scene_progress ADD COLUMN IF NOT EXISTS affixes_completed BOOLEAN DEFAULT false;

-- Update current_phase constraint to include 'affixes'
DO $$
DECLARE _conname TEXT;
BEGIN
  SELECT conname INTO _conname FROM pg_constraint
  WHERE conrelid = 'user_scene_progress'::regclass AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%current_phase%';
  IF _conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE user_scene_progress DROP CONSTRAINT %I', _conname);
  END IF;
  ALTER TABLE user_scene_progress ADD CONSTRAINT user_scene_progress_phase_check
    CHECK (current_phase IN ('dialogue','phrases','vocabulary','patterns','affixes','conversation','summary'));
END $$;
