-- ============================================================
-- 008_event_editions_and_participations.sql
-- Active edition, participation history, and athlete continuity
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'edition_participation_role'
  ) THEN
    CREATE TYPE edition_participation_role AS ENUM (
      'athlete',
      'volunteer',
      'staff'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS event_editions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug       TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  year       INT,
  starts_on  DATE,
  ends_on    DATE,
  venue_name TEXT,
  location   TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE event_config
  ADD COLUMN IF NOT EXISTS active_edition_id UUID REFERENCES event_editions(id) ON DELETE SET NULL;

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS edition_id UUID REFERENCES event_editions(id) ON DELETE SET NULL;

ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS edition_id UUID REFERENCES event_editions(id) ON DELETE SET NULL;

DROP INDEX IF EXISTS idx_athletes_person_id;

ALTER TABLE teams
  DROP CONSTRAINT IF EXISTS teams_category_id_slug_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_category_slug_per_edition
  ON teams(category_id, edition_id, slug)
  WHERE edition_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_category_slug_without_edition
  ON teams(category_id, slug)
  WHERE edition_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_teams_edition_id
  ON teams(edition_id);

CREATE INDEX IF NOT EXISTS idx_athletes_edition_id
  ON athletes(edition_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_athletes_person_edition_unique
  ON athletes(person_id, edition_id)
  WHERE person_id IS NOT NULL
    AND edition_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS edition_participations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edition_id    UUID NOT NULL REFERENCES event_editions(id) ON DELETE CASCADE,
  person_id     UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  profile_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  team_id       UUID REFERENCES teams(id) ON DELETE SET NULL,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  athlete_id    UUID REFERENCES athletes(id) ON DELETE SET NULL,
  role          edition_participation_role NOT NULL,
  invited_at    TIMESTAMPTZ,
  activated_at  TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT edition_participations_person_role_unique
    UNIQUE (edition_id, person_id, role)
);

CREATE INDEX IF NOT EXISTS idx_edition_participations_person
  ON edition_participations(person_id);

CREATE INDEX IF NOT EXISTS idx_edition_participations_profile
  ON edition_participations(profile_id);

CREATE INDEX IF NOT EXISTS idx_edition_participations_team
  ON edition_participations(team_id);

CREATE INDEX IF NOT EXISTS idx_edition_participations_role
  ON edition_participations(role);

CREATE OR REPLACE FUNCTION get_active_edition_id()
RETURNS UUID AS $$
  SELECT active_edition_id
  FROM event_config
  ORDER BY created_at
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION set_team_edition_from_event_config()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.edition_id IS NULL THEN
    NEW.edition_id := get_active_edition_id();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS teams_set_edition_id ON teams;
CREATE TRIGGER teams_set_edition_id
  BEFORE INSERT OR UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION set_team_edition_from_event_config();

CREATE OR REPLACE FUNCTION set_athlete_edition_from_team()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.edition_id IS NULL THEN
    SELECT edition_id
    INTO NEW.edition_id
    FROM teams
    WHERE id = NEW.team_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS athletes_set_edition_id ON athletes;
CREATE TRIGGER athletes_set_edition_id
  BEFORE INSERT OR UPDATE ON athletes
  FOR EACH ROW
  EXECUTE FUNCTION set_athlete_edition_from_team();

ALTER TABLE event_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE edition_participations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read event editions" ON event_editions;
DROP POLICY IF EXISTS "Admin-like users can manage event editions" ON event_editions;

CREATE POLICY "Public can read event editions"
  ON event_editions FOR SELECT
  USING (true);

CREATE POLICY "Admin-like users can manage event editions"
  ON event_editions FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Users can read own edition participations" ON edition_participations;
DROP POLICY IF EXISTS "Admin-like users can read edition participations" ON edition_participations;
DROP POLICY IF EXISTS "Admin-like users can manage edition participations" ON edition_participations;

CREATE POLICY "Users can read own edition participations"
  ON edition_participations FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.person_id = edition_participations.person_id
    )
  );

CREATE POLICY "Admin-like users can read edition participations"
  ON edition_participations FOR SELECT
  USING (is_admin_like());

CREATE POLICY "Admin-like users can manage edition participations"
  ON edition_participations FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DO $$
DECLARE
  event_row RECORD;
  resolved_edition_id UUID;
  resolved_year INT;
  resolved_slug TEXT;
  resolved_label TEXT;
BEGIN
  SELECT *
  INTO event_row
  FROM event_config
  ORDER BY created_at
  LIMIT 1;

  IF event_row IS NULL THEN
    RETURN;
  END IF;

  resolved_year := EXTRACT(
    YEAR
    FROM COALESCE(event_row.end_date, event_row.date, CURRENT_DATE)
  )::INT;
  resolved_slug := format('%s-%s', event_row.slug, resolved_year);
  resolved_label := format('%s %s', event_row.name, resolved_year);

  IF event_row.active_edition_id IS NULL THEN
    INSERT INTO event_editions (
      slug,
      label,
      year,
      starts_on,
      ends_on,
      venue_name,
      location,
      is_active
    )
    VALUES (
      resolved_slug,
      resolved_label,
      resolved_year,
      event_row.date,
      COALESCE(event_row.end_date, event_row.date),
      event_row.venue_name,
      event_row.location,
      true
    )
    ON CONFLICT (slug) DO UPDATE
      SET label = EXCLUDED.label,
          year = EXCLUDED.year,
          starts_on = EXCLUDED.starts_on,
          ends_on = EXCLUDED.ends_on,
          venue_name = EXCLUDED.venue_name,
          location = EXCLUDED.location,
          is_active = true,
          updated_at = now()
    RETURNING id INTO resolved_edition_id;

    UPDATE event_config
    SET active_edition_id = resolved_edition_id
    WHERE id = event_row.id;
  ELSE
    resolved_edition_id := event_row.active_edition_id;
  END IF;

  UPDATE event_editions
  SET is_active = (id = resolved_edition_id),
      updated_at = CASE WHEN id = resolved_edition_id THEN now() ELSE updated_at END;

  UPDATE teams
  SET edition_id = resolved_edition_id
  WHERE edition_id IS NULL;

  UPDATE athletes AS athletes_table
  SET edition_id = COALESCE(athletes_table.edition_id, teams_table.edition_id, resolved_edition_id)
  FROM teams AS teams_table
  WHERE teams_table.id = athletes_table.team_id
    AND athletes_table.edition_id IS NULL;

  INSERT INTO edition_participations (
    edition_id,
    person_id,
    profile_id,
    team_id,
    category_id,
    athlete_id,
    role,
    invited_at,
    activated_at,
    notes
  )
  SELECT
    COALESCE(athletes_table.edition_id, teams_table.edition_id, resolved_edition_id),
    athletes_table.person_id,
    profiles_table.id,
    athletes_table.team_id,
    teams_table.category_id,
    athletes_table.id,
    'athlete'::edition_participation_role,
    profiles_table.invited_at,
    profiles_table.setup_completed_at,
    'Participacion inicial creada desde athlete existente'
  FROM athletes AS athletes_table
  JOIN teams AS teams_table
    ON teams_table.id = athletes_table.team_id
  LEFT JOIN profiles AS profiles_table
    ON profiles_table.person_id = athletes_table.person_id
  WHERE athletes_table.person_id IS NOT NULL
    AND COALESCE(athletes_table.edition_id, teams_table.edition_id, resolved_edition_id) IS NOT NULL
  ON CONFLICT (edition_id, person_id, role) DO UPDATE
    SET profile_id = COALESCE(EXCLUDED.profile_id, edition_participations.profile_id),
        team_id = EXCLUDED.team_id,
        category_id = EXCLUDED.category_id,
        athlete_id = EXCLUDED.athlete_id,
        invited_at = COALESCE(edition_participations.invited_at, EXCLUDED.invited_at),
        activated_at = COALESCE(edition_participations.activated_at, EXCLUDED.activated_at),
        updated_at = now();

  INSERT INTO edition_participations (
    edition_id,
    person_id,
    profile_id,
    role,
    invited_at,
    activated_at,
    notes
  )
  SELECT
    resolved_edition_id,
    profiles_table.person_id,
    profiles_table.id,
    'volunteer'::edition_participation_role,
    profiles_table.invited_at,
    profiles_table.setup_completed_at,
    'Participacion inicial creada desde cuenta de voluntario existente'
  FROM profiles AS profiles_table
  WHERE profiles_table.person_id IS NOT NULL
    AND profiles_table.role = 'volunteer'
  ON CONFLICT (edition_id, person_id, role) DO UPDATE
    SET profile_id = COALESCE(EXCLUDED.profile_id, edition_participations.profile_id),
        invited_at = COALESCE(edition_participations.invited_at, EXCLUDED.invited_at),
        activated_at = COALESCE(edition_participations.activated_at, EXCLUDED.activated_at),
        updated_at = now();

  INSERT INTO edition_participations (
    edition_id,
    person_id,
    profile_id,
    role,
    invited_at,
    activated_at,
    notes
  )
  SELECT
    resolved_edition_id,
    profiles_table.person_id,
    profiles_table.id,
    'staff'::edition_participation_role,
    profiles_table.invited_at,
    profiles_table.setup_completed_at,
    'Participacion inicial creada desde cuenta staff existente'
  FROM profiles AS profiles_table
  WHERE profiles_table.person_id IS NOT NULL
    AND profiles_table.role IN ('admin', 'superadmin')
  ON CONFLICT (edition_id, person_id, role) DO UPDATE
    SET profile_id = COALESCE(EXCLUDED.profile_id, edition_participations.profile_id),
        invited_at = COALESCE(edition_participations.invited_at, EXCLUDED.invited_at),
        activated_at = COALESCE(edition_participations.activated_at, EXCLUDED.activated_at),
        updated_at = now();
END $$;
