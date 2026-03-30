-- ============================================================
-- 005_phase2_auth_and_validation.sql
-- Expanded auth roles, validation workflow, and volunteer hardening
-- ============================================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'athlete';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_validate_scores BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS setup_completed_at TIMESTAMPTZ;

UPDATE profiles AS profiles_table
SET email = users.email
FROM auth.users AS users
WHERE users.id = profiles_table.id
  AND (profiles_table.email IS NULL OR profiles_table.email <> users.email);

UPDATE profiles
SET invited_at = COALESCE(invited_at, created_at),
    setup_completed_at = COALESCE(setup_completed_at, updated_at, created_at)
WHERE role IN ('admin', 'volunteer');

ALTER TABLE profiles
  ALTER COLUMN email SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);

ALTER TABLE heats
  ADD COLUMN IF NOT EXISTS is_live_entry_enabled BOOLEAN NOT NULL DEFAULT false;

UPDATE heats
SET is_live_entry_enabled = true
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_heats_live_entry_enabled
  ON heats(is_live_entry_enabled);

ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

UPDATE scores
SET verified_at = COALESCE(verified_at, updated_at, created_at)
WHERE verified_at IS NULL
  AND (verified_by IS NOT NULL OR is_published = true);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, invited_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'athlete'),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Permission helpers
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_active_profile(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT COALESCE((
    SELECT is_active
    FROM profiles
    WHERE id = user_id
  ), false);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT is_active_profile()
    AND get_user_role(auth.uid()) = 'superadmin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin_like()
RETURNS BOOLEAN AS $$
  SELECT is_active_profile()
    AND get_user_role(auth.uid()) IN ('superadmin', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_validate_scores()
RETURNS BOOLEAN AS $$
  SELECT is_superadmin()
    OR EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
        AND can_validate_scores = true
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_access_volunteer_surface()
RETURNS BOOLEAN AS $$
  SELECT is_active_profile()
    AND get_user_role(auth.uid()) IN ('superadmin', 'admin', 'volunteer');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_operate_live_heat(p_heat_id UUID)
RETURNS BOOLEAN AS $$
  SELECT is_active_profile()
    AND (
      is_admin_like()
      OR (
        get_user_role(auth.uid()) = 'volunteer'
        AND EXISTS (
          SELECT 1
          FROM heats
          WHERE id = p_heat_id
            AND status = 'active'
            AND is_live_entry_enabled = true
        )
      )
      OR (
        get_user_role(auth.uid()) = 'volunteer'
        AND EXISTS (
          SELECT 1
          FROM volunteer_assignments assignments
          JOIN heats ON heats.id = assignments.heat_id
          WHERE assignments.volunteer_id = auth.uid()
            AND assignments.heat_id = p_heat_id
            AND (heats.status = 'active' OR heats.is_live_entry_enabled = true)
        )
      )
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS refresh
-- ============================================================

DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin-like users can read profiles"
  ON profiles FOR SELECT
  USING (is_admin_like());

CREATE POLICY "Superadmins can manage all profiles"
  ON profiles FOR ALL
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

DROP POLICY IF EXISTS "Admins can manage event config" ON event_config;
CREATE POLICY "Admin-like users can manage event config"
  ON event_config FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admin-like users can manage categories"
  ON categories FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Admins can manage teams" ON teams;
CREATE POLICY "Admin-like users can manage teams"
  ON teams FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Admins can manage athletes" ON athletes;
CREATE POLICY "Admin-like users can manage athletes"
  ON athletes FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Admins can manage workouts" ON workouts;
CREATE POLICY "Admin-like users can manage workouts"
  ON workouts FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Admins can manage workout stages" ON workout_stages;
CREATE POLICY "Admin-like users can manage workout stages"
  ON workout_stages FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Admins can manage heats" ON heats;
CREATE POLICY "Admin-like users can manage heats"
  ON heats FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Admins can manage lanes" ON lanes;
CREATE POLICY "Admin-like users can manage lanes"
  ON lanes FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Public can read published scores" ON scores;
DROP POLICY IF EXISTS "Admins can manage scores" ON scores;

CREATE POLICY "Public can read published scores"
  ON scores FOR SELECT
  USING (is_published = true OR is_admin_like());

CREATE POLICY "Admin-like users can manage scores"
  ON scores FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Authenticated users can insert live updates" ON live_updates;
DROP POLICY IF EXISTS "Admins can manage live updates" ON live_updates;

CREATE POLICY "Authorized users can insert live updates"
  ON live_updates FOR INSERT
  WITH CHECK (
    auth.uid() = submitted_by
    AND can_operate_live_heat(heat_id)
  );

CREATE POLICY "Admin-like users can manage live updates"
  ON live_updates FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Admins can manage sponsors" ON sponsors;
CREATE POLICY "Admin-like users can manage sponsors"
  ON sponsors FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Admins can manage sponsor slots" ON sponsor_slots;
CREATE POLICY "Admin-like users can manage sponsor slots"
  ON sponsor_slots FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Volunteers can read own assignments" ON volunteer_assignments;
DROP POLICY IF EXISTS "Admins can manage volunteer assignments" ON volunteer_assignments;

CREATE POLICY "Volunteers can read own assignments"
  ON volunteer_assignments FOR SELECT
  USING (auth.uid() = volunteer_id OR is_admin_like());

CREATE POLICY "Admin-like users can manage volunteer assignments"
  ON volunteer_assignments FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Admins can manage stream sessions" ON stream_sessions;
CREATE POLICY "Admin-like users can manage stream sessions"
  ON stream_sessions FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

DROP POLICY IF EXISTS "Admins can manage media" ON media;
CREATE POLICY "Admin-like users can manage media"
  ON media FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());
