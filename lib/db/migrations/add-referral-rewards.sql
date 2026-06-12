-- Referral rewards: each signed-up referral grants the referrer temporary
-- Premium via users.bonus_premium_until; referrals.rewarded_at makes the
-- grant idempotent.
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_premium_until TIMESTAMPTZ;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS rewarded_at TIMESTAMPTZ;
