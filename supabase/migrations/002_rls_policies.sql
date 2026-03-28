-- ============================================================
-- 002_rls_policies.sql
-- Row Level Security for all tables
-- ============================================================

-- Helper function: get user role without recursion (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role(auth.uid()) = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (is_admin());

-- ============================================================
-- EVENT_CONFIG
-- ============================================================

ALTER TABLE event_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read event config"
  ON event_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage event config"
  ON event_config FOR ALL
  USING (is_admin());

-- ============================================================
-- CATEGORIES
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (is_admin());

-- ============================================================
-- TEAMS
-- ============================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active teams"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL
  USING (is_admin());

-- ============================================================
-- ATHLETES
-- ============================================================

ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read athletes"
  ON athletes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage athletes"
  ON athletes FOR ALL
  USING (is_admin());

-- ============================================================
-- WORKOUTS
-- ============================================================

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read visible workouts"
  ON workouts FOR SELECT
  USING (is_visible = true OR is_admin());

CREATE POLICY "Admins can manage workouts"
  ON workouts FOR ALL
  USING (is_admin());

-- ============================================================
-- WORKOUT_STAGES
-- ============================================================

ALTER TABLE workout_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read workout stages"
  ON workout_stages FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage workout stages"
  ON workout_stages FOR ALL
  USING (is_admin());

-- ============================================================
-- HEATS
-- ============================================================

ALTER TABLE heats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read heats"
  ON heats FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage heats"
  ON heats FOR ALL
  USING (is_admin());

-- ============================================================
-- LANES
-- ============================================================

ALTER TABLE lanes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read lanes"
  ON lanes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage lanes"
  ON lanes FOR ALL
  USING (is_admin());

-- ============================================================
-- SCORES
-- ============================================================

ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published scores"
  ON scores FOR SELECT
  USING (is_published = true OR is_admin());

CREATE POLICY "Admins can manage scores"
  ON scores FOR ALL
  USING (is_admin());

-- ============================================================
-- LIVE_UPDATES
-- ============================================================

ALTER TABLE live_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read live updates"
  ON live_updates FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert live updates"
  ON live_updates FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Admins can manage live updates"
  ON live_updates FOR ALL
  USING (is_admin());

-- ============================================================
-- SPONSORS
-- ============================================================

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active sponsors"
  ON sponsors FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage sponsors"
  ON sponsors FOR ALL
  USING (is_admin());

-- ============================================================
-- SPONSOR_SLOTS
-- ============================================================

ALTER TABLE sponsor_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active sponsor slots"
  ON sponsor_slots FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage sponsor slots"
  ON sponsor_slots FOR ALL
  USING (is_admin());

-- ============================================================
-- VOLUNTEER_ASSIGNMENTS
-- ============================================================

ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Volunteers can read own assignments"
  ON volunteer_assignments FOR SELECT
  USING (auth.uid() = volunteer_id OR is_admin());

CREATE POLICY "Admins can manage volunteer assignments"
  ON volunteer_assignments FOR ALL
  USING (is_admin());

-- ============================================================
-- STREAM_SESSIONS
-- ============================================================

ALTER TABLE stream_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read stream sessions"
  ON stream_sessions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage stream sessions"
  ON stream_sessions FOR ALL
  USING (is_admin());

-- ============================================================
-- MEDIA
-- ============================================================

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read visible media"
  ON media FOR SELECT
  USING (is_visible = true OR is_admin());

CREATE POLICY "Admins can manage media"
  ON media FOR ALL
  USING (is_admin());
