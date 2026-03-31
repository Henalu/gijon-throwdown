-- ============================================================
-- 013_offline_idempotency_and_lane_locks.sql
-- Idempotency keys for offline-first PWA sync + lane locks
-- ============================================================

-- 1. Add client_event_id to live_updates for idempotent upserts
ALTER TABLE live_updates
  ADD COLUMN IF NOT EXISTS client_event_id UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_live_updates_client_event_id
  ON live_updates(client_event_id)
  WHERE client_event_id IS NOT NULL;

-- 2. Add client_event_id to live_checkpoints for idempotent upserts
ALTER TABLE live_checkpoints
  ADD COLUMN IF NOT EXISTS client_event_id UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_live_checkpoints_client_event_id
  ON live_checkpoints(client_event_id)
  WHERE client_event_id IS NOT NULL;

-- 3. Add client_event_id to live_lane_results for idempotent upserts
ALTER TABLE live_lane_results
  ADD COLUMN IF NOT EXISTS client_event_id UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_live_lane_results_client_event_id
  ON live_lane_results(client_event_id)
  WHERE client_event_id IS NOT NULL;

-- 4. Lane lock columns for single-device scoring
ALTER TABLE lanes
  ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_lanes_locked_by
  ON lanes(locked_by)
  WHERE locked_by IS NOT NULL;
