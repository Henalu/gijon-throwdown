import Dexie, { type EntityTable } from "dexie";
import type { LiveLaneCloseReason, LiveMetricType } from "@/types";

/* ------------------------------------------------------------------ */
/*  Heat context — cached when a judge opens a heat                    */
/* ------------------------------------------------------------------ */

export interface CachedHeatContext {
  heatId: string;
  heatNumber: number;
  heatStatus: string;
  heatStartedAt: string | null;
  workoutName: string;
  workoutType: string;
  scoreType: string;
  timeCap: number | null;
  categoryName: string;
  lanes: {
    id: string;
    lane_number: number;
    team: { id: string; name: string; box_name: string | null } | null;
  }[];
  cachedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Lane state — local source of truth while offline                   */
/* ------------------------------------------------------------------ */

export interface CachedLaneState {
  laneId: string;
  heatId: string;
  cumulative: number;
  metric: LiveMetricType;
  isFinished: boolean;
  closeReason: LiveLaneCloseReason | null;
  finalValue: number | null;
  finalElapsedMs: number | null;
  judgeNotes: string | null;
  lastUpdatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Outbox event — pending events queued for sync                      */
/* ------------------------------------------------------------------ */

export type OutboxEventType = "live_update" | "checkpoint" | "lane_close";
export type OutboxStatus = "pending" | "syncing" | "synced" | "failed";

export interface OutboxEvent {
  id: string;
  heatId: string;
  laneId: string;
  type: OutboxEventType;
  payload: Record<string, unknown>;
  createdAt: number;
  status: OutboxStatus;
  attempts: number;
  lastAttemptAt: number | null;
  serverAck: boolean;
  errorMessage: string | null;
}

/* ------------------------------------------------------------------ */
/*  Database                                                           */
/* ------------------------------------------------------------------ */

const db = new Dexie("GijonThrowdownJudge") as Dexie & {
  heatContexts: EntityTable<CachedHeatContext, "heatId">;
  laneStates: EntityTable<CachedLaneState, "laneId">;
  outbox: EntityTable<OutboxEvent, "id">;
};

db.version(1).stores({
  heatContexts: "heatId",
  laneStates: "laneId, heatId",
  outbox: "id, [heatId+laneId], status, createdAt",
});

export { db };
