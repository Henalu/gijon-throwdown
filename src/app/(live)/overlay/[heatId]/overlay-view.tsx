"use client";

import { useEffect, useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { useRealtimeHeat } from "@/lib/hooks/use-realtime-heat";
import {
  formatElapsedMs,
  getPublicLaneResultLabel,
} from "@/lib/live-scoring";

interface OverlayViewProps {
  heatId: string;
  heatStatus: string;
  heatStartedAt: string | null;
  workoutName: string;
  scoreType: string;
  timeCap: number | null;
  lanes: { id: string; lane_number: number; team: { name: string } | null }[];
  initialStates: Record<
    string,
    {
      cumulative: number;
      is_finished: boolean;
      close_reason: string | null;
      final_metric_type: string | null;
      final_elapsed_ms: number | null;
    }
  >;
}

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function OverlayView({
  heatId,
  heatStatus,
  heatStartedAt,
  workoutName,
  scoreType,
  timeCap,
  lanes,
  initialStates,
}: OverlayViewProps) {
  const { laneStates: realtimeStates, heatStatus: liveHeatStatus } = useRealtimeHeat(
    heatId,
    heatStatus,
  );

  const laneData = useMemo(() => {
    return lanes.map((lane) => {
      const rt = realtimeStates[lane.id];
      const init = initialStates[lane.id];
      return {
        ...lane,
        cumulative: rt?.cumulative ?? init?.cumulative ?? 0,
        isFinished: rt?.is_finished ?? init?.is_finished ?? false,
        closeReason: rt?.close_reason ?? init?.close_reason ?? null,
        finalElapsedMs: rt?.final_elapsed_ms ?? init?.final_elapsed_ms ?? null,
      };
    });
  }, [initialStates, lanes, realtimeStates]);

  const ranked = useMemo(() => {
    return [...laneData].sort((a, b) => {
      if (scoreType === "time") {
        const aCompleted = a.closeReason === "completed";
        const bCompleted = b.closeReason === "completed";
        if (aCompleted !== bCompleted) return aCompleted ? -1 : 1;
        if (aCompleted && bCompleted) {
          return (a.finalElapsedMs ?? Number.MAX_SAFE_INTEGER) -
            (b.finalElapsedMs ?? Number.MAX_SAFE_INTEGER);
        }
      }

      if (a.isFinished !== b.isFinished) return a.isFinished ? -1 : 1;
      return b.cumulative - a.cumulative;
    });
  }, [laneData, scoreType]);

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (liveHeatStatus !== "active" || !heatStartedAt) return;
    const start = new Date(heatStartedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [heatStartedAt, liveHeatStatus]);

  return (
    <div className="min-h-screen bg-transparent p-4 font-mono">
      <div className="mb-3 flex items-center justify-between px-2">
        <span className="text-sm font-bold uppercase text-white/80">
          {workoutName}
        </span>
        {heatStartedAt && (
          <span
            className={`text-2xl font-black ${
              timeCap && elapsed >= timeCap ? "text-red-400" : "text-brand-green"
            }`}
          >
            {formatTimer(Math.min(elapsed, timeCap ?? elapsed))}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {ranked.map((lane, index) => {
          const showFinalTime =
            scoreType === "time" &&
            lane.closeReason === "completed" &&
            lane.finalElapsedMs != null;

          return (
            <div
              key={lane.id}
              className={`flex items-center justify-between rounded-lg px-4 py-2 transition-all duration-300 ${
                index === 0 && lane.cumulative > 0
                  ? "border border-brand-green/40 bg-brand-green/20"
                  : "border border-white/10 bg-black/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-right text-sm text-white/40">
                  {index + 1}
                </span>
                <span className="max-w-[180px] truncate text-sm font-bold text-white">
                  {lane.team?.name ?? `Calle ${lane.lane_number}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {lane.isFinished && <Flag size={12} className="text-brand-green" />}
                <span
                  className={`text-2xl font-black tabular-nums ${
                    lane.isFinished ||
                    (index === 0 && lane.cumulative > 0)
                      ? "text-brand-green"
                      : "text-white"
                  }`}
                >
                  {showFinalTime ? formatElapsedMs(lane.finalElapsedMs) : lane.cumulative}
                </span>
                {lane.isFinished && (
                  <span className="text-[10px] uppercase tracking-[0.22em] text-white/35">
                    {getPublicLaneResultLabel(lane.closeReason as never)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
