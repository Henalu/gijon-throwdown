/* ------------------------------------------------------------------ */
/*  Sync Engine                                                        */
/*  Drains the outbox queue when the device is online.                 */
/*  Processes events FIFO, one at a time per lane to avoid races.      */
/* ------------------------------------------------------------------ */

import {
  submitLiveUpdate,
  saveLiveCheckpoint,
  closeLaneResult,
} from "@/lib/actions/live-updates";
import type { LiveLaneCloseReason, LiveMetricType } from "@/types";
import { getConnectionStatus, onConnectionChange } from "./connection";
import type { OutboxEvent } from "./db";
import {
  getAllPending,
  markSyncing,
  markSynced,
  markFailed,
  markRetry,
  purgeSynced,
} from "./outbox";

export type SyncState =
  | { phase: "idle" }
  | { phase: "syncing"; synced: number; total: number }
  | { phase: "done"; synced: number; failed: number }
  | { phase: "offline" };

type SyncListener = (state: SyncState) => void;

const MAX_ATTEMPTS = 10;
const listeners = new Set<SyncListener>();
let running = false;
let stopRequested = false;
let unsubConnection: (() => void) | null = null;

function notify(state: SyncState) {
  for (const fn of listeners) fn(state);
}

export function onSyncStateChange(fn: SyncListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

async function dispatchEvent(
  event: OutboxEvent,
): Promise<{ ok: boolean; transient: boolean; message?: string }> {
  const p = event.payload as Record<string, unknown>;
  const clientEventId = event.id; // outbox id doubles as idempotency key

  try {
    if (event.type === "live_update") {
      const result = await submitLiveUpdate({
        lane_id: p.lane_id as string,
        heat_id: p.heat_id as string,
        update_type: p.update_type as string,
        value: p.value as number,
        cumulative: p.cumulative as number,
        workout_stage_id: (p.workout_stage_id as string) || undefined,
        client_event_id: clientEventId,
      });
      if ("error" in result) {
        // Heat/lane already closed — permanent failure
        return { ok: false, transient: false, message: result.error };
      }
      return { ok: true, transient: false };
    }

    if (event.type === "checkpoint") {
      const result = await saveLiveCheckpoint({
        lane_id: p.lane_id as string,
        heat_id: p.heat_id as string,
        value: p.value as number,
        metric_type: p.metric_type as LiveMetricType,
        elapsed_ms: p.elapsed_ms as number | null,
        client_event_id: clientEventId,
      });
      if ("error" in result) {
        return { ok: false, transient: false, message: result.error };
      }
      return { ok: true, transient: false };
    }

    if (event.type === "lane_close") {
      const result = await closeLaneResult({
        lane_id: p.lane_id as string,
        heat_id: p.heat_id as string,
        close_reason: p.close_reason as LiveLaneCloseReason,
        final_value: p.final_value as number,
        final_metric_type: p.final_metric_type as LiveMetricType,
        final_elapsed_ms: p.final_elapsed_ms as number | null,
        judge_notes: (p.judge_notes as string) || undefined,
        client_event_id: clientEventId,
      });
      if ("error" in result) {
        return { ok: false, transient: false, message: result.error };
      }
      return { ok: true, transient: false };
    }

    return { ok: false, transient: false, message: `Unknown event type: ${event.type}` };
  } catch (err) {
    // Network/fetch errors are transient
    return {
      ok: false,
      transient: true,
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}

/** Process all pending events, one at a time in FIFO order. */
export async function drain(): Promise<{ synced: number; failed: number }> {
  if (running) return { synced: 0, failed: 0 };
  running = true;
  stopRequested = false;

  let synced = 0;
  let failed = 0;

  try {
    const pending = await getAllPending();
    const total = pending.length;

    if (total === 0) {
      notify({ phase: "idle" });
      return { synced: 0, failed: 0 };
    }

    notify({ phase: "syncing", synced: 0, total });

    // Group by lane to process sequentially per lane
    const byLane = new Map<string, OutboxEvent[]>();
    for (const event of pending) {
      const key = `${event.heatId}:${event.laneId}`;
      const group = byLane.get(key) ?? [];
      group.push(event);
      byLane.set(key, group);
    }

    // Process all lanes (sequentially within each lane, but could parallelize across lanes)
    for (const [, events] of byLane) {
      for (const event of events) {
        if (stopRequested || !getConnectionStatus()) {
          notify({ phase: "offline" });
          return { synced, failed };
        }

        if (event.attempts >= MAX_ATTEMPTS) {
          await markFailed(event.id, "Max attempts reached");
          failed++;
          continue;
        }

        await markSyncing(event.id);
        const result = await dispatchEvent(event);

        if (result.ok) {
          await markSynced(event.id);
          synced++;
        } else if (result.transient) {
          // Put back for retry later
          await markRetry(event.id);
          // Stop processing this lane — connection might be gone
          notify({ phase: "offline" });
          return { synced, failed };
        } else {
          // Permanent failure (validation error, heat closed, etc.)
          await markFailed(event.id, result.message ?? "Permanent error");
          failed++;
        }

        notify({ phase: "syncing", synced, total });
      }
    }

    // Clean up old synced events
    await purgeSynced();

    notify({ phase: "done", synced, failed });
    return { synced, failed };
  } finally {
    running = false;
  }
}

/** Start the sync engine — drains on connection restore. */
export function startSyncEngine() {
  if (typeof window === "undefined") return;

  // Drain immediately if online
  if (getConnectionStatus()) {
    void drain();
  }

  // Drain whenever connection comes back
  unsubConnection = onConnectionChange((online) => {
    if (online && !running) {
      void drain();
    }
  });
}

export function stopSyncEngine() {
  stopRequested = true;
  if (unsubConnection) {
    unsubConnection();
    unsubConnection = null;
  }
}

export function isSyncing() {
  return running;
}
