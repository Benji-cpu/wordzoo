-- Track scenes completed per day for pacing system
ALTER TABLE daily_usage ADD COLUMN IF NOT EXISTS scenes_completed INTEGER NOT NULL DEFAULT 0;
