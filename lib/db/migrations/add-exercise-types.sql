-- Exercise type for pattern exercises (fill_blank, sentence_build, typed_translation)
ALTER TABLE scene_pattern_exercises
  ADD COLUMN IF NOT EXISTS exercise_type TEXT DEFAULT 'fill_blank';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scene_pattern_exercises_exercise_type_check') THEN
    ALTER TABLE scene_pattern_exercises ADD CONSTRAINT scene_pattern_exercises_exercise_type_check
      CHECK (exercise_type IN ('fill_blank', 'sentence_build', 'typed_translation'));
  END IF;
END $$;
