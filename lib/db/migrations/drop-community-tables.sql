-- Phase 0 subtract — drop community + share-event tables.
-- mnemonic_feedback and referrals are retained.

DROP TABLE IF EXISTS mnemonic_flags;
DROP TABLE IF EXISTS mnemonic_votes;
DROP TABLE IF EXISTS community_mnemonics;
DROP TABLE IF EXISTS share_events;
