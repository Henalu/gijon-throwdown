"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LiveUpdate } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface LaneState {
  lane_id: string;
  cumulative: number;
  last_update_type: string;
  is_finished: boolean;
  last_updated_at: string;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function buildLaneStates(updates: LiveUpdate[]): Record<string, LaneState> {
  const states: Record<string, LaneState> = {};

  // updates are ordered by created_at asc, so the last one per lane wins
  for (const u of updates) {
    states[u.lane_id] = {
      lane_id: u.lane_id,
      cumulative: u.cumulative,
      last_update_type: u.update_type,
      is_finished: u.update_type === "finished",
      last_updated_at: u.created_at,
    };
  }

  return states;
}

function applyUpdate(
  prev: Record<string, LaneState>,
  update: LiveUpdate,
): Record<string, LaneState> {
  return {
    ...prev,
    [update.lane_id]: {
      lane_id: update.lane_id,
      cumulative: update.cumulative,
      last_update_type: update.update_type,
      is_finished: update.update_type === "finished",
      last_updated_at: update.created_at,
    },
  };
}

// ------------------------------------------------------------------
// Hook
// ------------------------------------------------------------------

export function useRealtimeHeat(heatId: string): {
  laneStates: Record<string, LaneState>;
  isConnected: boolean;
  lastUpdate: LiveUpdate | null;
} {
  const supabaseRef = useRef(createClient());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [laneStates, setLaneStates] = useState<Record<string, LaneState>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<LiveUpdate | null>(null);

  // ---- Fetch full state from DB ----
  const fetchFullState = useCallback(async () => {
    const { data, error } = await supabaseRef.current
      .from("live_updates")
      .select("*")
      .eq("heat_id", heatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[useRealtimeHeat] fetch error:", error.message);
      return;
    }

    const updates = data as LiveUpdate[];
    setLaneStates(buildLaneStates(updates));

    if (updates.length > 0) {
      setLastUpdate(updates[updates.length - 1]);
    }
  }, [heatId]);

  // ---- Polling fallback ----
  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // already polling
    pollingRef.current = setInterval(() => {
      fetchFullState();
    }, 3000);
  }, [fetchFullState]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // ---- Main effect ----
  useEffect(() => {
    const supabase = supabaseRef.current;

    // Initial fetch
    fetchFullState();

    // Subscribe to realtime
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
          setLaneStates((prev) => applyUpdate(prev, update));
          setLastUpdate(update);
        },
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          stopPolling();
          // Re-fetch to close any gap between initial fetch and subscription
          fetchFullState();
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

    // Cleanup
    return () => {
      stopPolling();
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [heatId, fetchFullState, startPolling, stopPolling]);

  return { laneStates, isConnected, lastUpdate };
}
