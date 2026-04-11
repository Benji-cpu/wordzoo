-- Register system for formal/informal variants
ALTER TABLE words ADD COLUMN IF NOT EXISTS informal_text TEXT;
ALTER TABLE words ADD COLUMN IF NOT EXISTS register TEXT DEFAULT 'neutral';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'words_register_check') THEN
    ALTER TABLE words ADD CONSTRAINT words_register_check
      CHECK (register IN ('formal', 'informal', 'neutral'));
  END IF;
END $$;

ALTER TABLE scene_phrases ADD COLUMN IF NOT EXISTS text_target_informal TEXT;
ALTER TABLE scene_dialogues ADD COLUMN IF NOT EXISTS text_target_informal TEXT;
