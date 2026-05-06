-- Vercel deployment failures ingested by the nightly-routine agent.
-- Prefixed wordzoo_ to namespace the table within the shared Neon DB
-- (cc-mastery uses the same Neon project; see cc_mastery_deployment_events).
-- ON CONFLICT(vercel_deployment_id) makes the upsert idempotent across
-- repeated nightly ingest runs.

CREATE TABLE IF NOT EXISTS wordzoo_deployment_events (
  id BIGSERIAL PRIMARY KEY,
  vercel_deployment_id TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  state TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  commit_sha TEXT,
  commit_author_email TEXT,
  commit_message TEXT,
  build_url TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wordzoo_deployment_events_created
  ON wordzoo_deployment_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wordzoo_deployment_events_state
  ON wordzoo_deployment_events (state);
