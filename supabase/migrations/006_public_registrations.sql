-- ============================================================
-- 006_public_registrations.sql
-- Public registrations for volunteers and teams
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'registration_status'
  ) THEN
    CREATE TYPE registration_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'registration_member_gender'
  ) THEN
    CREATE TYPE registration_member_gender AS ENUM ('male', 'female');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS volunteer_applications (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name           TEXT NOT NULL,
  last_name            TEXT NOT NULL,
  email                TEXT NOT NULL,
  shirt_size           TEXT NOT NULL,
  dietary_restrictions TEXT,
  consent_accepted_at  TIMESTAMPTZ NOT NULL,
  status               registration_status NOT NULL DEFAULT 'pending',
  admin_notes          TEXT,
  reviewed_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_volunteer_applications_email
  ON volunteer_applications(email);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status
  ON volunteer_applications(status);

CREATE TABLE IF NOT EXISTS team_registrations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id         UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  team_name           TEXT NOT NULL,
  leader_name         TEXT NOT NULL,
  leader_email        TEXT NOT NULL,
  consent_accepted_at TIMESTAMPTZ NOT NULL,
  status              registration_status NOT NULL DEFAULT 'pending',
  admin_notes         TEXT,
  reviewed_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_registrations_category
  ON team_registrations(category_id);
CREATE INDEX IF NOT EXISTS idx_team_registrations_leader_email
  ON team_registrations(leader_email);
CREATE INDEX IF NOT EXISTS idx_team_registrations_status
  ON team_registrations(status);

CREATE TABLE IF NOT EXISTS team_registration_members (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_registration_id UUID NOT NULL REFERENCES team_registrations(id) ON DELETE CASCADE,
  full_name            TEXT NOT NULL,
  email                TEXT NOT NULL,
  shirt_size           TEXT NOT NULL,
  gender               registration_member_gender NOT NULL,
  sort_order           INT NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_registration_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_team_registration_members_registration
  ON team_registration_members(team_registration_id);

ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_registration_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin-like users can read volunteer applications"
  ON volunteer_applications;
DROP POLICY IF EXISTS "Admin-like users can update volunteer applications"
  ON volunteer_applications;

CREATE POLICY "Admin-like users can read volunteer applications"
  ON volunteer_applications FOR SELECT
  USING (is_admin_like());

CREATE POLICY "Admin-like users can update volunteer applications"
  ON volunteer_applications FOR UPDATE
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Admin-like users can read team registrations"
  ON team_registrations;
DROP POLICY IF EXISTS "Admin-like users can update team registrations"
  ON team_registrations;

CREATE POLICY "Admin-like users can read team registrations"
  ON team_registrations FOR SELECT
  USING (is_admin_like());

CREATE POLICY "Admin-like users can update team registrations"
  ON team_registrations FOR UPDATE
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Admin-like users can read team registration members"
  ON team_registration_members;

CREATE POLICY "Admin-like users can read team registration members"
  ON team_registration_members FOR SELECT
  USING (is_admin_like());
