-- ============================================================
-- 001_initial_schema.sql
-- Gijon Throwdown - Competition Live Hub
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'volunteer');
CREATE TYPE heat_status AS ENUM ('pending', 'active', 'finished');
CREATE TYPE wod_type AS ENUM ('for_time', 'amrap', 'emom', 'max_weight', 'chipper', 'custom');
CREATE TYPE score_type AS ENUM ('time', 'reps', 'weight', 'rounds_reps', 'points');
CREATE TYPE sponsor_tier AS ENUM ('title', 'gold', 'silver', 'bronze', 'partner');
CREATE TYPE slot_position AS ENUM (
  'hero_section',
  'leaderboard_header',
  'leaderboard_leader',
  'heat_highlight',
  'stream_overlay',
  'top_split',
  'footer_banner',
  'wod_sponsor'
);
CREATE TYPE live_update_type AS ENUM ('reps', 'calories', 'weight', 'rounds', 'stage_complete', 'finished', 'no_rep');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'live', 'finished');

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'volunteer',
  full_name   TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'volunteer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- EVENT CONFIG (single event, no multi-event)
-- ============================================================

CREATE TABLE event_config (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL DEFAULT 'Gijon Throwdown',
  slug             TEXT NOT NULL UNIQUE DEFAULT 'gijon-throwdown',
  description      TEXT,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date         DATE,
  location         TEXT,
  venue_name       TEXT,
  venue_address    TEXT,
  maps_url         TEXT,
  logo_url         TEXT,
  cover_image_url  TEXT,
  primary_color    TEXT NOT NULL DEFAULT '#3BD4A0',
  secondary_color  TEXT NOT NULL DEFAULT '#0A0A0A',
  stream_url       TEXT,
  rules_url        TEXT,
  faq              JSONB DEFAULT '[]'::jsonb,
  status           event_status NOT NULL DEFAULT 'draft',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_team     BOOLEAN NOT NULL DEFAULT true,
  team_size   INT DEFAULT 2,
  max_teams   INT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TEAMS & ATHLETES
-- ============================================================

CREATE TABLE teams (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  logo_url    TEXT,
  box_name    TEXT,
  country     TEXT DEFAULT 'ES',
  city        TEXT,
  seed_rank   INT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, slug)
);

CREATE INDEX idx_teams_category_id ON teams(category_id);

CREATE TABLE athletes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  photo_url   TEXT,
  instagram   TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_athletes_team_id ON athletes(team_id);

-- ============================================================
-- WORKOUTS (WODs)
-- ============================================================

CREATE TABLE workouts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  wod_type         wod_type NOT NULL DEFAULT 'for_time',
  score_type       score_type NOT NULL DEFAULT 'time',
  time_cap_seconds INT,
  description      TEXT,
  standards        TEXT,
  sort_order       INT NOT NULL DEFAULT 0,
  is_visible       BOOLEAN NOT NULL DEFAULT false,
  higher_is_better BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workout_stages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id   UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  target_value INT,
  unit         TEXT NOT NULL DEFAULT 'reps',
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workout_id, sort_order)
);

CREATE INDEX idx_workout_stages_workout_id ON workout_stages(workout_id);

-- ============================================================
-- HEATS & LANES
-- ============================================================

CREATE TABLE heats (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id  UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  workout_id   UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  heat_number  INT NOT NULL,
  name         TEXT,
  status       heat_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  started_at   TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, workout_id, heat_number)
);

CREATE INDEX idx_heats_category_id ON heats(category_id);
CREATE INDEX idx_heats_workout_id ON heats(workout_id);
CREATE INDEX idx_heats_status ON heats(status);

CREATE TABLE lanes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  heat_id     UUID NOT NULL REFERENCES heats(id) ON DELETE CASCADE,
  team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  lane_number INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(heat_id, lane_number),
  UNIQUE(heat_id, team_id)
);

CREATE INDEX idx_lanes_heat_id ON lanes(heat_id);
CREATE INDEX idx_lanes_team_id ON lanes(team_id);

-- ============================================================
-- SCORES (finalized results per team per workout)
-- ============================================================

CREATE TABLE scores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  workout_id      UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  heat_id         UUID REFERENCES heats(id) ON DELETE SET NULL,
  time_ms         INT,
  reps            INT,
  weight_kg       NUMERIC(6,2),
  rounds          INT,
  remaining_reps  INT,
  points          INT,
  is_rx           BOOLEAN NOT NULL DEFAULT true,
  is_cap          BOOLEAN NOT NULL DEFAULT false,
  penalty_seconds INT DEFAULT 0,
  is_published    BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT,
  submitted_by    UUID REFERENCES profiles(id),
  verified_by     UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, workout_id)
);

CREATE INDEX idx_scores_team_id ON scores(team_id);
CREATE INDEX idx_scores_workout_id ON scores(workout_id);
CREATE INDEX idx_scores_published ON scores(is_published);

-- ============================================================
-- LIVE UPDATES (the realtime core - append-only, HOT table)
-- ============================================================

CREATE TABLE live_updates (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lane_id          UUID NOT NULL REFERENCES lanes(id) ON DELETE CASCADE,
  heat_id          UUID NOT NULL REFERENCES heats(id) ON DELETE CASCADE,
  workout_stage_id UUID REFERENCES workout_stages(id),
  update_type      live_update_type NOT NULL,
  value            INT NOT NULL DEFAULT 0,
  cumulative       INT NOT NULL DEFAULT 0,
  submitted_by     UUID NOT NULL REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_live_updates_heat_id ON live_updates(heat_id);
CREATE INDEX idx_live_updates_lane_id ON live_updates(lane_id);
CREATE INDEX idx_live_updates_heat_created ON live_updates(heat_id, created_at DESC);

-- ============================================================
-- SPONSORS
-- ============================================================

CREATE TABLE sponsors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  logo_url    TEXT NOT NULL,
  website_url TEXT,
  tier        sponsor_tier NOT NULL DEFAULT 'partner',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sponsor_slots (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  position   slot_position NOT NULL,
  label      TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  priority   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sponsor_id, position)
);

CREATE INDEX idx_sponsor_slots_position ON sponsor_slots(position);

-- ============================================================
-- VOLUNTEERS & ASSIGNMENTS
-- ============================================================

CREATE TABLE volunteer_assignments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  volunteer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  heat_id      UUID NOT NULL REFERENCES heats(id) ON DELETE CASCADE,
  lane_id      UUID REFERENCES lanes(id),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(volunteer_id, heat_id)
);

CREATE INDEX idx_vol_assignments_volunteer ON volunteer_assignments(volunteer_id);
CREATE INDEX idx_vol_assignments_heat ON volunteer_assignments(heat_id);

-- ============================================================
-- STREAM SESSIONS
-- ============================================================

CREATE TABLE stream_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      TEXT NOT NULL,
  youtube_url TEXT,
  is_live    BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMPTZ,
  ended_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- MEDIA GALLERY
-- ============================================================

CREATE TABLE media (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url           TEXT NOT NULL,
  thumbnail_url TEXT,
  media_type    TEXT NOT NULL DEFAULT 'image',
  caption       TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  is_visible    BOOLEAN NOT NULL DEFAULT true,
  uploaded_by   UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ENABLE REALTIME on live_updates
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.heats;
