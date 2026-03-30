-- ============================================================
-- 010_judge_profiles.sql
-- Volunteer judge preference and profile specialization
-- ============================================================

ALTER TABLE volunteer_applications
  ADD COLUMN IF NOT EXISTS is_judge BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_volunteer_applications_is_judge
  ON volunteer_applications(is_judge);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_judge BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_is_judge
  ON profiles(is_judge);
