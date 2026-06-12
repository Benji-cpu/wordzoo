-- Tracks post-generation enrichment (mnemonics + TTS audio) for AI-generated
-- paths (custom / travel / studio). Curated paths stay at 'none'.
ALTER TABLE paths ADD COLUMN IF NOT EXISTS enrichment_status TEXT NOT NULL DEFAULT 'none';
