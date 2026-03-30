-- ============================================================
-- 007_people_registry_and_conversions.sql
-- Canonical people registry and conversion links
-- ============================================================

CREATE TABLE IF NOT EXISTS people (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name           TEXT NOT NULL,
  last_name            TEXT,
  full_name            TEXT NOT NULL,
  primary_email        TEXT,
  gender               registration_member_gender,
  shirt_size           TEXT,
  dietary_restrictions TEXT,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_people_primary_email_lower
  ON people (lower(primary_email))
  WHERE primary_email IS NOT NULL;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES people(id) ON DELETE SET NULL;

ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES people(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_person_id
  ON profiles(person_id)
  WHERE person_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_athletes_person_id
  ON athletes(person_id)
  WHERE person_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_athletes_person_lookup
  ON athletes(person_id);

ALTER TABLE volunteer_applications
  ADD COLUMN IF NOT EXISTS converted_person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS converted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE team_registrations
  ADD COLUMN IF NOT EXISTS converted_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS converted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE team_registration_members
  ADD COLUMN IF NOT EXISTS converted_person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_volunteer_applications_converted_person
  ON volunteer_applications(converted_person_id);

CREATE INDEX IF NOT EXISTS idx_team_registrations_converted_team
  ON team_registrations(converted_team_id);

CREATE INDEX IF NOT EXISTS idx_team_registration_members_converted_person
  ON team_registration_members(converted_person_id);

ALTER TABLE people ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own person" ON people;
DROP POLICY IF EXISTS "Admin-like users can read people" ON people;
DROP POLICY IF EXISTS "Admin-like users can manage people" ON people;

CREATE POLICY "Users can read own person"
  ON people FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.person_id = people.id
    )
  );

CREATE POLICY "Admin-like users can read people"
  ON people FOR SELECT
  USING (is_admin_like());

CREATE POLICY "Admin-like users can manage people"
  ON people FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DO $$
DECLARE
  profile_record RECORD;
  athlete_record RECORD;
  resolved_person_id UUID;
BEGIN
  FOR profile_record IN
    SELECT id, full_name, email
    FROM profiles
    WHERE person_id IS NULL
  LOOP
    SELECT id
    INTO resolved_person_id
    FROM people
    WHERE primary_email IS NOT NULL
      AND lower(primary_email) = lower(profile_record.email)
    LIMIT 1;

    IF resolved_person_id IS NULL THEN
      INSERT INTO people (
        first_name,
        last_name,
        full_name,
        primary_email,
        notes
      )
      VALUES (
        COALESCE(NULLIF(split_part(profile_record.full_name, ' ', 1), ''), profile_record.full_name),
        NULLIF(
          btrim(
            substring(
              profile_record.full_name
              FROM char_length(split_part(profile_record.full_name, ' ', 1)) + 1
            )
          ),
          ''
        ),
        profile_record.full_name,
        profile_record.email,
        'Persona creada desde profile existente'
      )
      RETURNING id INTO resolved_person_id;
    END IF;

    UPDATE profiles
    SET person_id = resolved_person_id
    WHERE id = profile_record.id;
  END LOOP;

  FOR athlete_record IN
    SELECT id, first_name, last_name
    FROM athletes
    WHERE person_id IS NULL
  LOOP
    INSERT INTO people (
      first_name,
      last_name,
      full_name,
      notes
    )
    VALUES (
      athlete_record.first_name,
      NULLIF(athlete_record.last_name, ''),
      btrim(concat_ws(' ', athlete_record.first_name, athlete_record.last_name)),
      'Persona creada desde athlete existente'
    )
    RETURNING id INTO resolved_person_id;

    UPDATE athletes
    SET person_id = resolved_person_id
    WHERE id = athlete_record.id;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, invited_at, person_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'athlete'),
    now(),
    NULLIF(NEW.raw_user_meta_data->>'person_id', '')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
