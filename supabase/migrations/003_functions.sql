-- ============================================================
-- 003_functions.sql
-- Database functions for scoring, ranking, and heat finalization
-- ============================================================

-- ============================================================
-- Get latest live state for a heat (snapshot for reconnection)
-- ============================================================

CREATE OR REPLACE FUNCTION get_heat_live_state(p_heat_id UUID)
RETURNS TABLE(
  lane_id UUID,
  lane_number INT,
  team_id UUID,
  team_name TEXT,
  box_name TEXT,
  update_type live_update_type,
  cumulative INT,
  last_updated TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (l.id)
    l.id AS lane_id,
    l.lane_number,
    l.team_id,
    t.name AS team_name,
    t.box_name,
    lu.update_type,
    lu.cumulative,
    lu.created_at AS last_updated
  FROM lanes l
  JOIN teams t ON t.id = l.team_id
  LEFT JOIN live_updates lu ON lu.lane_id = l.id AND lu.heat_id = p_heat_id
  WHERE l.heat_id = p_heat_id
  ORDER BY l.id, lu.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- Finalize heat: auto-generate scores from live_updates
-- ============================================================

CREATE OR REPLACE FUNCTION finalize_heat(p_heat_id UUID, p_admin_id UUID)
RETURNS void AS $$
DECLARE
  v_workout_id UUID;
  v_score_type score_type;
  v_higher_is_better BOOLEAN;
BEGIN
  -- Get workout info for this heat
  SELECT h.workout_id, w.score_type, w.higher_is_better
  INTO v_workout_id, v_score_type, v_higher_is_better
  FROM heats h
  JOIN workouts w ON w.id = h.workout_id
  WHERE h.id = p_heat_id;

  -- Mark heat as finished
  UPDATE heats
  SET status = 'finished', finished_at = now(), updated_at = now()
  WHERE id = p_heat_id;

  -- For each lane, take the latest cumulative value and create a score
  INSERT INTO scores (team_id, workout_id, heat_id, reps, is_published, submitted_by)
  SELECT
    l.team_id,
    v_workout_id,
    p_heat_id,
    COALESCE(
      (SELECT lu.cumulative
       FROM live_updates lu
       WHERE lu.lane_id = l.id AND lu.heat_id = p_heat_id
       ORDER BY lu.created_at DESC
       LIMIT 1),
      0
    ),
    false, -- not published yet, admin reviews first
    p_admin_id
  FROM lanes l
  WHERE l.heat_id = p_heat_id
  ON CONFLICT (team_id, workout_id) DO UPDATE SET
    reps = EXCLUDED.reps,
    heat_id = EXCLUDED.heat_id,
    submitted_by = EXCLUDED.submitted_by,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Calculate leaderboard points after publishing scores
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_workout_points(p_workout_id UUID)
RETURNS void AS $$
DECLARE
  v_total_teams INT;
  v_higher_is_better BOOLEAN;
  v_score_type score_type;
BEGIN
  SELECT w.higher_is_better, w.score_type
  INTO v_higher_is_better, v_score_type
  FROM workouts w WHERE w.id = p_workout_id;

  SELECT COUNT(*) INTO v_total_teams
  FROM scores WHERE workout_id = p_workout_id AND is_published = true;

  -- Assign points based on rank: 1st = total_teams, 2nd = total_teams - 1, etc.
  WITH ranked AS (
    SELECT
      s.id,
      ROW_NUMBER() OVER (
        ORDER BY
          CASE
            WHEN v_score_type = 'time' THEN
              CASE WHEN s.is_cap THEN 999999999
                   ELSE COALESCE(s.time_ms, 999999999) + (COALESCE(s.penalty_seconds, 0) * 1000)
              END
            WHEN v_score_type = 'reps' THEN
              CASE WHEN v_higher_is_better THEN -COALESCE(s.reps, 0)
                   ELSE COALESCE(s.reps, 0)
              END
            WHEN v_score_type = 'weight' THEN -COALESCE(s.weight_kg, 0)::INT
            WHEN v_score_type = 'rounds_reps' THEN
              -(COALESCE(s.rounds, 0) * 10000 + COALESCE(s.remaining_reps, 0))
            ELSE -COALESCE(s.points, 0)
          END
      ) AS rank
    FROM scores s
    WHERE s.workout_id = p_workout_id AND s.is_published = true
  )
  UPDATE scores SET
    points = v_total_teams - ranked.rank + 1,
    updated_at = now()
  FROM ranked
  WHERE scores.id = ranked.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Leaderboard VIEW
-- ============================================================

CREATE OR REPLACE VIEW leaderboard AS
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.box_name,
  t.category_id,
  c.name AS category_name,
  c.slug AS category_slug,
  COALESCE(SUM(s.points), 0)::INT AS total_points,
  RANK() OVER (
    PARTITION BY t.category_id
    ORDER BY COALESCE(SUM(s.points), 0) DESC
  )::INT AS rank
FROM teams t
JOIN categories c ON c.id = t.category_id
LEFT JOIN scores s ON s.team_id = t.id AND s.is_published = true
WHERE t.is_active = true
GROUP BY t.id, t.name, t.box_name, t.category_id, c.name, c.slug;
