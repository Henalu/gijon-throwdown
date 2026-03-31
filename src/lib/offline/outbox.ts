/* ------------------------------------------------------------------ */
/*  Outbox — local queue of events pending sync to the server          */
/* ------------------------------------------------------------------ */

import { db, type OutboxEvent, type OutboxEventType } from "./db";

/** Generate a simple UUID v4. */
function uuid(): string {
  return crypto.randomUUID();
}

export async function enqueue(
  event: Omit<OutboxEvent, "id" | "status" | "attempts" | "lastAttemptAt" | "serverAck" | "errorMessage">,
): Promise<string> {
  const id = uuid();
  await db.outbox.add({
    ...event,
    id,
    status: "pending",
    attempts: 0,
    lastAttemptAt: null,
    serverAck: false,
    errorMessage: null,
  });
  return id;
}

/** Get all pending events for a heat+lane, oldest first. */
export async function getPendingForLane(heatId: string, laneId: string) {
  return db.outbox
    .where({ heatId, laneId, status: "pending" })
    .sortBy("createdAt");
}

/** Get all pending events across all lanes, oldest first. */
export async function getAllPending() {
  return db.outbox
    .where("status")
    .equals("pending")
    .sortBy("createdAt");
}

/** Count of events in each status. */
export async function getOutboxStats() {
  const pending = await db.outbox.where("status").equals("pending").count();
  const syncing = await db.outbox.where("status").equals("syncing").count();
  const failed = await db.outbox.where("status").equals("failed").count();
  return { pending, syncing, failed, total: pending + syncing + failed };
}

/** Mark an event as currently being synced. */
export async function markSyncing(id: string) {
  await db.outbox.update(id, {
    status: "syncing",
    lastAttemptAt: Date.now(),
  });
}

/** Mark an event as successfully synced. */
export async function markSynced(id: string) {
  await db.outbox.update(id, {
    status: "synced",
    serverAck: true,
  });
}

/** Mark an event as failed with error detail. */
export async function markFailed(id: string, errorMessage: string) {
  const event = await db.outbox.get(id);
  if (!event) return;
  await db.outbox.update(id, {
    status: "failed",
    attempts: event.attempts + 1,
    lastAttemptAt: Date.now(),
    errorMessage,
  });
}

/** Return a pending event to the queue for retry. */
export async function markRetry(id: string) {
  const event = await db.outbox.get(id);
  if (!event) return;
  await db.outbox.update(id, {
    status: "pending",
    attempts: event.attempts + 1,
    lastAttemptAt: Date.now(),
  });
}

/** Clean up old synced events (keep last N hours). */
export async function purgeSynced(olderThanMs = 4 * 60 * 60 * 1000) {
  const cutoff = Date.now() - olderThanMs;
  await db.outbox
    .where("status")
    .equals("synced")
    .filter((e) => e.createdAt < cutoff)
    .delete();
}

/** Enqueue a live_update event. */
export async function enqueueLiveUpdate(params: {
  heatId: string;
  laneId: string;
  updateType: string;
  value: number;
  cumulative: number;
  workoutStageId?: string;
}) {
  return enqueue({
    heatId: params.heatId,
    laneId: params.laneId,
    type: "live_update" as OutboxEventType,
    payload: {
      lane_id: params.laneId,
      heat_id: params.heatId,
      update_type: params.updateType,
      value: params.value,
      cumulative: params.cumulative,
      workout_stage_id: params.workoutStageId ?? null,
    },
    createdAt: Date.now(),
  });
}

/** Enqueue a checkpoint event. */
export async function enqueueCheckpoint(params: {
  heatId: string;
  laneId: string;
  value: number;
  metricType: string;
  elapsedMs: number | null;
}) {
  return enqueue({
    heatId: params.heatId,
    laneId: params.laneId,
    type: "checkpoint" as OutboxEventType,
    payload: {
      lane_id: params.laneId,
      heat_id: params.heatId,
      value: params.value,
      metric_type: params.metricType,
      elapsed_ms: params.elapsedMs,
    },
    createdAt: Date.now(),
  });
}

/** Enqueue a lane close event. */
export async function enqueueLaneClose(params: {
  heatId: string;
  laneId: string;
  closeReason: string;
  finalValue: number;
  finalMetricType: string;
  finalElapsedMs: number | null;
  judgeNotes?: string;
}) {
  return enqueue({
    heatId: params.heatId,
    laneId: params.laneId,
    type: "lane_close" as OutboxEventType,
    payload: {
      lane_id: params.laneId,
      heat_id: params.heatId,
      close_reason: params.closeReason,
      final_value: params.finalValue,
      final_metric_type: params.finalMetricType,
      final_elapsed_ms: params.finalElapsedMs,
      judge_notes: params.judgeNotes ?? null,
    },
    createdAt: Date.now(),
  });
}
