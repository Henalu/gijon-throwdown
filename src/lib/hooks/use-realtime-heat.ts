"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  LiveLaneCloseReason,
  LiveLaneResult,
  LiveMetricType,
  LiveUpdate,
} from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface HeatLiveSnapshotRow {
  lane_id: string;
  update_type: string | null;
  cumulative: number | null;
  last_updated: string | null;
}

export interface LaneState {
  lane_id: string;
  cumulative: number;
  last_update_type: string;
  is_finished: boolean;
  last_updated_at: string;
  close_reason: LiveLaneCloseReason | null;
  final_metric_type: LiveMetricType | null;
  final_elapsed_ms: number | null;
  judge_notes: string | null;
  closed_at: string | null;
}

function applyLaneResultToState(
  base: LaneState | undefined,
  result: LiveLaneResult,
): LaneState {
  return {
    ...base,
    lane_id: result.lane_id,
    cumulative: result.final_value,
    last_update_type: result.final_metric_type,
    is_finished: true,
    last_updated_at: result.updated_at,
    close_reason: result.close_reason,
    final_metric_type: result.final_metric_type,
    final_elapsed_ms: result.final_elapsed_ms,
    judge_notes: result.judge_notes,
    closed_at: result.closed_at,
  };
}

function buildLaneStates(
  snapshots: HeatLiveSnapshotRow[],
  results: LiveLaneResult[],
): Record<string, LaneState> {
  const states: Record<string, LaneState> = {};

  for (const snapshot of snapshots) {
    if (!snapshot.last_updated) {
      continue;
    }

    states[snapshot.lane_id] = {
      lane_id: snapshot.lane_id,
      cumulative: snapshot.cumulative ?? 0,
      last_update_type: snapshot.update_type ?? "reps",
      is_finished: false,
      last_updated_at: snapshot.last_updated,
      close_reason: null,
      final_metric_type: null,
      final_elapsed_ms: null,
      judge_notes: null,
      closed_at: null,
    };
  }

  for (const result of results) {
    states[result.lane_id] = applyLaneResultToState(states[result.lane_id], result);
  }

  return states;
}

function applyLiveUpdate(
  prev: Record<string, LaneState>,
  update: LiveUpdate,
): Record<string, LaneState> {
  const existing = prev[update.lane_id];
  if (existing?.close_reason) {
    return prev;
  }

  return {
    ...prev,
    [update.lane_id]: {
      lane_id: update.lane_id,
      cumulative: update.cumulative,
      last_update_type: update.update_type,
      is_finished: false,
      last_updated_at: update.created_at,
      close_reason: null,
      final_metric_type: null,
      final_elapsed_ms: null,
      judge_notes: null,
      closed_at: null,
    },
  };
}

function applyLaneResult(
  prev: Record<string, LaneState>,
  result: LiveLaneResult,
): Record<string, LaneState> {
  return {
    ...prev,
    [result.lane_id]: applyLaneResultToState(prev[result.lane_id], result),
  };
}

export function useRealtimeHeat(
  heatId: string,
  initialHeatStatus?: string,
): {
  laneStates: Record<string, LaneState>;
  isConnected: boolean;
  lastUpdate: LiveUpdate | null;
  heatStatus: string;
} {
  const supabaseRef = useRef(createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [laneStates, setLaneStates] = useState<Record<string, LaneState>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<LiveUpdate | null>(null);
  const [heatStatus, setHeatStatus] = useState(initialHeatStatus ?? "pending");

  const fetchCurrentState = useCallback(async () => {
    const [{ data: snapshots, error: snapshotsError }, { data: results, error: resultsError }, { data: heat, error: heatError }] =
      await Promise.all([
        supabaseRef.current
          .rpc("get_heat_live_state", {
            p_heat_id: heatId,
          }),
        supabaseRef.current
          .from("live_lane_results")
          .select("*")
          .eq("heat_id", heatId),
        supabaseRef.current
          .from("heats")
          .select("status")
          .eq("id", heatId)
          .maybeSingle(),
      ]);

    if (snapshotsError) {
      console.error("[useRealtimeHeat] snapshot fetch error:", snapshotsError.message);
      return;
    }

    if (resultsError) {
      console.error("[useRealtimeHeat] results fetch error:", resultsError.message);
      return;
    }

    if (heatError) {
      console.error("[useRealtimeHeat] heat fetch error:", heatError.message);
      return;
    }

    const liveSnapshots = ((snapshots ?? []) as HeatLiveSnapshotRow[]).map((snapshot) => ({
      ...snapshot,
      update_type: snapshot.update_type ?? "reps",
    }));
    const liveResults = (results ?? []) as LiveLaneResult[];

    setLaneStates(buildLaneStates(liveSnapshots, liveResults));
    setHeatStatus(heat?.status ?? initialHeatStatus ?? "pending");
  }, [heatId, initialHeatStatus]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => {
      fetchCurrentState();
    }, 3000);
  }, [fetchCurrentState]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`live-heat-${heatId}`)
      .on<LiveUpdate>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_updates",
          filter: `heat_id=eq.${heatId}`,
        },
        (payload) => {
          const update = payload.new as LiveUpdate;
          setLaneStates((prev) => applyLiveUpdate(prev, update));
          setLastUpdate(update);
        },
      )
      .on<LiveLaneResult>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_lane_results",
          filter: `heat_id=eq.${heatId}`,
        },
        (payload) => {
          const result = payload.new as LiveLaneResult;
          if (!result) return;
          setLaneStates((prev) => applyLaneResult(prev, result));
        },
      )
      .on<{ status: string }>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "heats",
          filter: `id=eq.${heatId}`,
        },
        (payload) => {
          const updatedHeat = payload.new as { status: string };
          if (updatedHeat?.status) {
            setHeatStatus(updatedHeat.status);
          }
        },
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          stopPolling();
          void fetchCurrentState();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(
            "[useRealtimeHeat] channel error, falling back to polling",
            err,
          );
          setIsConnected(false);
          startPolling();
        } else if (status === "CLOSED") {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      stopPolling();
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [heatId, fetchCurrentState, startPolling, stopPolling]);

  return { laneStates, isConnected, lastUpdate, heatStatus };
}
