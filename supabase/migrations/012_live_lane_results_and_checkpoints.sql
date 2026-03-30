-- ============================================================
-- 012_live_lane_results_and_checkpoints.sql
-- Provisional live lane closures and manual checkpoints
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'live_metric_type'
  ) THEN
    CREATE TYPE live_metric_type AS ENUM (
      'reps',
      'calories',
      'weight',
      'rounds',
      'points'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'live_lane_close_reason'
  ) THEN
    CREATE TYPE live_lane_close_reason AS ENUM (
      'completed',
      'time_cap',
      'manual'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS live_lane_results (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  heat_id           UUID NOT NULL REFERENCES heats(id) ON DELETE CASCADE,
  lane_id           UUID NOT NULL REFERENCES lanes(id) ON DELETE CASCADE,
  close_reason      live_lane_close_reason NOT NULL,
  final_value       INT NOT NULL DEFAULT 0,
  final_metric_type live_metric_type NOT NULL DEFAULT 'reps',
  final_elapsed_ms  INT,
  judge_notes       TEXT,
  closed_by         UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  closed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(heat_id, lane_id)
);

CREATE INDEX IF NOT EXISTS idx_live_lane_results_heat_id
  ON live_lane_results(heat_id);

CREATE INDEX IF NOT EXISTS idx_live_lane_results_lane_id
  ON live_lane_results(lane_id);

CREATE INDEX IF NOT EXISTS idx_live_lane_results_close_reason
  ON live_lane_results(close_reason);

CREATE TABLE IF NOT EXISTS live_checkpoints (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  heat_id     UUID NOT NULL REFERENCES heats(id) ON DELETE CASCADE,
  lane_id     UUID NOT NULL REFERENCES lanes(id) ON DELETE CASCADE,
  value       INT NOT NULL DEFAULT 0,
  metric_type live_metric_type NOT NULL DEFAULT 'reps',
  elapsed_ms  INT,
  submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_checkpoints_heat_id
  ON live_checkpoints(heat_id);

CREATE INDEX IF NOT EXISTS idx_live_checkpoints_lane_created
  ON live_checkpoints(lane_id, created_at DESC);

ALTER TABLE live_lane_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read live lane results"
  ON live_lane_results FOR SELECT
  USING (true);

CREATE POLICY "Authorized users can insert live lane results"
  ON live_lane_results FOR INSERT
  WITH CHECK (
    auth.uid() = closed_by
    AND can_operate_live_heat(heat_id)
  );

CREATE POLICY "Operators can update own live lane results"
  ON live_lane_results FOR UPDATE
  USING (
    can_operate_live_heat(heat_id)
  )
  WITH CHECK (
    can_operate_live_heat(heat_id)
  );

CREATE POLICY "Admin-like users can manage live lane results"
  ON live_lane_results FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

CREATE POLICY "Operators can read heat checkpoints"
  ON live_checkpoints FOR SELECT
  USING (
    can_operate_live_heat(heat_id)
    OR is_admin_like()
  );

CREATE POLICY "Authorized users can insert live checkpoints"
  ON live_checkpoints FOR INSERT
  WITH CHECK (
    auth.uid() = submitted_by
    AND can_operate_live_heat(heat_id)
  );

CREATE POLICY "Admin-like users can manage live checkpoints"
  ON live_checkpoints FOR ALL
  USING (is_admin_like())
  WITH CHECK (is_admin_like());

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_lane_results;
