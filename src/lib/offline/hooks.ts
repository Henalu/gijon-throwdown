"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { db } from "./db";
import {
  enqueueLiveUpdate,
  enqueueCheckpoint,
  enqueueLaneClose,
  getOutboxStats,
} from "./outbox";
import {
  getConnectionStatus,
  onConnectionChange,
  startConnectionMonitor,
} from "./connection";
import {
  drain,
  onSyncStateChange,
  startSyncEngine,
  stopSyncEngine,
  type SyncState,
} from "./sync-engine";
import type { LiveLaneCloseReason, LiveMetricType } from "@/types";

/* ------------------------------------------------------------------ */
/*  useConnectionStatus                                                */
/* ------------------------------------------------------------------ */

let monitorStarted = false;

function subscribeConnection(callback: () => void) {
  if (!monitorStarted) {
    startConnectionMonitor(5_000);
    monitorStarted = true;
  }
  return onConnectionChange(callback);
}

export function useConnectionStatus() {
  return useSyncExternalStore(
    subscribeConnection,
    getConnectionStatus,
    () => true, // SSR snapshot
  );
}

/* ------------------------------------------------------------------ */
/*  useSyncStatus                                                      */
/* ------------------------------------------------------------------ */

export function useSyncStatus() {
  const [state, setState] = useState<SyncState>({ phase: "idle" });
  const [stats, setStats] = useState({ pending: 0, syncing: 0, failed: 0, total: 0 });

  useEffect(() => {
    startSyncEngine();
    const unsub = onSyncStateChange((s) => {
      setState(s);
      void getOutboxStats().then(setStats);
    });
    // Get initial stats
    void getOutboxStats().then(setStats);
    return () => {
      unsub();
      stopSyncEngine();
    };
  }, []);

  const triggerSync = useCallback(() => void drain(), []);

  return { state, stats, triggerSync };
}

/* ------------------------------------------------------------------ */
/*  useOfflineScoring                                                  */
/*  Wraps scoring actions to write to IndexedDB + outbox instead of    */
/*  calling server actions directly.                                   */
/* ------------------------------------------------------------------ */

export function useOfflineScoring(heatId: string) {
  const online = useConnectionStatus();

  /** Submit a rep/metric increment. Updates local state + enqueues for sync. */
  const submitUpdate = useCallback(
    async (params: {
      laneId: string;
      updateType: string;
      value: number;
      cumulative: number;
      workoutStageId?: string;
    }) => {
      // Update local lane state
      await db.laneStates.put({
        laneId: params.laneId,
        heatId,
        cumulative: params.cumulative,
        metric: params.updateType as LiveMetricType,
        isFinished: false,
        closeReason: null,
        finalValue: null,
        finalElapsedMs: null,
        judgeNotes: null,
        lastUpdatedAt: Date.now(),
      });

      // Enqueue for server sync
      await enqueueLiveUpdate({
        heatId,
        laneId: params.laneId,
        updateType: params.updateType,
        value: params.value,
        cumulative: params.cumulative,
        workoutStageId: params.workoutStageId,
      });

      // If online, try to drain immediately
      if (online) void drain();
    },
    [heatId, online],
  );

  /** Save a checkpoint. */
  const saveCheckpoint = useCallback(
    async (params: {
      laneId: string;
      value: number;
      metricType: LiveMetricType;
      elapsedMs: number | null;
    }) => {
      await enqueueCheckpoint({
        heatId,
        laneId: params.laneId,
        value: params.value,
        metricType: params.metricType,
        elapsedMs: params.elapsedMs,
      });

      if (online) void drain();
    },
    [heatId, online],
  );

  /** Close a lane with final result. */
  const closeLane = useCallback(
    async (params: {
      laneId: string;
      closeReason: LiveLaneCloseReason;
      finalValue: number;
      finalMetricType: LiveMetricType;
      finalElapsedMs: number | null;
      judgeNotes?: string;
    }) => {
      // Update local lane state to finished
      await db.laneStates.put({
        laneId: params.laneId,
        heatId,
        cumulative: params.finalValue,
        metric: params.finalMetricType,
        isFinished: true,
        closeReason: params.closeReason,
        finalValue: params.finalValue,
        finalElapsedMs: params.finalElapsedMs,
        judgeNotes: params.judgeNotes ?? null,
        lastUpdatedAt: Date.now(),
      });

      await enqueueLaneClose({
        heatId,
        laneId: params.laneId,
        closeReason: params.closeReason,
        finalValue: params.finalValue,
        finalMetricType: params.finalMetricType,
        finalElapsedMs: params.finalElapsedMs,
        judgeNotes: params.judgeNotes,
      });

      if (online) void drain();
    },
    [heatId, online],
  );

  return { submitUpdate, saveCheckpoint, closeLane };
}
