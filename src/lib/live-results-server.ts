import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getDefaultLiveMetric,
  getElapsedMs,
} from "@/lib/live-scoring";
import type {
  LiveLaneCloseReason,
  LiveLaneResult,
  LiveMetricType,
  ScoreType,
  WodType,
} from "@/types";

export interface HeatLiveContext {
  id: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  is_live_entry_enabled: boolean;
  workout: {
    id: string;
    wod_type: WodType | string;
    score_type: ScoreType | string;
    time_cap_seconds: number | null;
  } | null;
  lanes: Array<{
    id: string;
    lane_number: number;
    team_id: string;
  }>;
}

export interface LatestLaneSnapshot {
  lane_id: string;
  cumulative: number;
  metric_type: LiveMetricType;
  created_at: string;
}

function getSingleRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function normalizeMetricType(
  updateType: string | null | undefined,
  scoreType: ScoreType | string,
): LiveMetricType {
  switch (updateType) {
    case "reps":
    case "calories":
    case "weight":
    case "rounds":
    case "points":
      return updateType;
    default:
      return getDefaultLiveMetric(scoreType as ScoreType);
  }
}

export async function fetchHeatLiveContext(
  supabase: SupabaseClient,
  heatId: string,
): Promise<HeatLiveContext | null> {
  const { data: heat, error } = await supabase
    .from("heats")
    .select(
      `
        id,
        status,
        started_at,
        finished_at,
        is_live_entry_enabled,
        workout:workouts(id, wod_type, score_type, time_cap_seconds),
        lanes(id, lane_number, team_id)
      `,
    )
    .eq("id", heatId)
    .maybeSingle();

  if (error || !heat) {
    return null;
  }

  return {
    id: heat.id,
    status: heat.status,
    started_at: heat.started_at,
    finished_at: heat.finished_at,
    is_live_entry_enabled: heat.is_live_entry_enabled,
    workout: getSingleRelation(heat.workout) as HeatLiveContext["workout"],
    lanes: ((heat.lanes as Array<{
      id: string;
      lane_number: number;
      team_id: string;
    }> | null) ?? []),
  };
}

export async function ensureLaneBelongsToHeat(
  supabase: SupabaseClient,
  laneId: string,
  heatId: string,
) {
  const { data: lane } = await supabase
    .from("lanes")
    .select("id")
    .eq("id", laneId)
    .eq("heat_id", heatId)
    .maybeSingle();

  return lane;
}

export async function fetchLatestLaneSnapshots(
  supabase: SupabaseClient,
  heatId: string,
  scoreType: ScoreType | string,
): Promise<Record<string, LatestLaneSnapshot>> {
  const { data, error } = await supabase
    .from("live_updates")
    .select("lane_id, cumulative, update_type, created_at")
    .eq("heat_id", heatId)
    .order("lane_id")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const snapshots: Record<string, LatestLaneSnapshot> = {};

  for (const row of data ?? []) {
    if (!snapshots[row.lane_id]) {
      snapshots[row.lane_id] = {
        lane_id: row.lane_id,
        cumulative: row.cumulative,
        metric_type: normalizeMetricType(row.update_type, scoreType),
        created_at: row.created_at,
      };
    }
  }

  return snapshots;
}

export async function fetchHeatLaneResults(
  supabase: SupabaseClient,
  heatId: string,
): Promise<Record<string, LiveLaneResult>> {
  const { data, error } = await supabase
    .from("live_lane_results")
    .select("*")
    .eq("heat_id", heatId);

  if (error) {
    throw new Error(error.message);
  }

  const results: Record<string, LiveLaneResult> = {};
  for (const row of (data ?? []) as LiveLaneResult[]) {
    results[row.lane_id] = row;
  }

  return results;
}

export async function closeOpenLanesForHeat(params: {
  supabase: SupabaseClient;
  heat: HeatLiveContext;
  actorId: string;
  closeReason: LiveLaneCloseReason;
  closeHeat?: boolean;
  closedAt?: Date;
}) {
  const { supabase, heat, actorId, closeReason, closeHeat = false } = params;
  const closedAt = params.closedAt ?? new Date();

  const scoreType = heat.workout?.score_type ?? "reps";
  const latestSnapshots = await fetchLatestLaneSnapshots(supabase, heat.id, scoreType);
  const existingResults = await fetchHeatLaneResults(supabase, heat.id);
  const defaultMetric = getDefaultLiveMetric(scoreType as ScoreType);
  const fallbackElapsed = getElapsedMs(heat.started_at, closedAt.getTime());
  const timeCapElapsed = heat.workout?.time_cap_seconds
    ? heat.workout.time_cap_seconds * 1000
    : fallbackElapsed;

  const rows = heat.lanes
    .filter((lane) => !existingResults[lane.id])
    .map((lane) => {
      const snapshot = latestSnapshots[lane.id];

      return {
        heat_id: heat.id,
        lane_id: lane.id,
        close_reason: closeReason,
        final_value: snapshot?.cumulative ?? 0,
        final_metric_type: snapshot?.metric_type ?? defaultMetric,
        final_elapsed_ms:
          closeReason === "time_cap" ? timeCapElapsed ?? null : fallbackElapsed,
        judge_notes: null,
        closed_by: actorId,
        closed_at: closedAt.toISOString(),
        updated_at: closedAt.toISOString(),
      };
    });

  if (rows.length > 0) {
    const { error } = await supabase.from("live_lane_results").insert(rows);
    if (error) {
      throw new Error(error.message);
    }
  }

  if (closeHeat) {
    const { error } = await supabase
      .from("heats")
      .update({
        status: "finished",
        finished_at: closedAt.toISOString(),
        is_live_entry_enabled: false,
      })
      .eq("id", heat.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  return rows.length;
}
