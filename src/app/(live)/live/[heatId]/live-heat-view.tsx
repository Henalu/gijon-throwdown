"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Flag, Radio, Trophy } from "lucide-react";
import { useRealtimeHeat } from "@/lib/hooks/use-realtime-heat";
import {
  formatElapsedMs,
  getPublicLaneResultLabel,
} from "@/lib/live-scoring";

interface LaneInfo {
  id: string;
  lane_number: number;
  team: {
    id: string;
    name: string;
    box_name: string | null;
    logo_url: string | null;
  } | null;
}

interface LiveHeatViewProps {
  heatId: string;
  heatNumber: number;
  heatStatus: string;
  heatStartedAt: string | null;
  workoutName: string;
  workoutType: string;
  scoreType: string;
  timeCap: number | null;
  categoryName: string;
  lanes: LaneInfo[];
  initialLaneStates: Record<
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

const scoreLabel: Record<string, string> = {
  reps: "REPS",
  time: "TIEMPO",
  weight: "KG",
  rounds_reps: "RONDAS",
  points: "PTS",
  calories: "CAL",
};

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function LiveHeatView({
  heatId,
  heatNumber,
  heatStatus,
  heatStartedAt,
  workoutName,
  workoutType,
  scoreType,
  timeCap,
  categoryName,
  lanes,
  initialLaneStates,
}: LiveHeatViewProps) {
  const {
    laneStates: realtimeStates,
    isConnected,
    heatStatus: liveHeatStatus,
  } = useRealtimeHeat(heatId, heatStatus);

  const laneData = useMemo(() => {
    return lanes.map((lane) => {
      const rt = realtimeStates[lane.id];
      const init = initialLaneStates[lane.id];
      return {
        ...lane,
        cumulative: rt?.cumulative ?? init?.cumulative ?? 0,
        isFinished: rt?.is_finished ?? init?.is_finished ?? false,
        closeReason: rt?.close_reason ?? init?.close_reason ?? null,
        finalElapsedMs: rt?.final_elapsed_ms ?? init?.final_elapsed_ms ?? null,
      };
    });
  }, [initialLaneStates, lanes, realtimeStates]);

  const ranked = useMemo(() => {
    const sorted = [...laneData].sort((a, b) => {
      if (scoreType === "time" || workoutType === "for_time") {
        const aCompleted = a.closeReason === "completed";
        const bCompleted = b.closeReason === "completed";

        if (aCompleted !== bCompleted) return aCompleted ? -1 : 1;

        if (aCompleted && bCompleted) {
          return (a.finalElapsedMs ?? Number.MAX_SAFE_INTEGER) -
            (b.finalElapsedMs ?? Number.MAX_SAFE_INTEGER);
        }

        return b.cumulative - a.cumulative;
      }

      if (a.isFinished !== b.isFinished) return a.isFinished ? -1 : 1;
      return b.cumulative - a.cumulative;
    });

    return sorted.map((lane, index) => ({ ...lane, rank: index + 1 }));
  }, [laneData, scoreType, workoutType]);

  const leader = ranked[0];

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (liveHeatStatus !== "active" || !heatStartedAt) return;
    const start = new Date(heatStartedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [heatStartedAt, liveHeatStatus]);

  const gridCols =
    lanes.length <= 4
      ? "grid-cols-2 md:grid-cols-4"
      : lanes.length <= 6
        ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        : "grid-cols-2 md:grid-cols-4";

  return (
    <div className="min-h-screen bg-[#050505] p-4 text-white md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black uppercase tracking-tighter md:text-5xl">
              {workoutName}
            </h1>
            {liveHeatStatus === "active" && (
              <Badge className="animate-pulse-live border-red-500/30 bg-red-500/20 text-sm text-red-400">
                <Radio size={14} className="mr-1" />
                EN VIVO
              </Badge>
            )}
            {liveHeatStatus === "finished" && (
              <Badge className="border-blue-500/30 bg-blue-500/20 text-sm text-blue-400">
                FINALIZADO
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-white/50">
            {categoryName} | Heat {heatNumber}
          </p>
        </div>

        <div className="text-right">
          {heatStartedAt && (
            <p
              className={`font-mono text-4xl font-black md:text-6xl ${
                timeCap && elapsed >= timeCap ? "text-red-400" : "text-brand-green"
              }`}
            >
              {formatTimer(Math.min(elapsed, timeCap ?? elapsed))}
            </p>
          )}
          {timeCap && (
            <p className="text-xs font-mono text-white/30">CAP {formatTimer(timeCap)}</p>
          )}
          <div className="mt-1 flex items-center justify-end gap-1">
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-brand-green" : "animate-pulse bg-yellow-500"
              }`}
            />
            <span className="text-[10px] text-white/30">
              {isConnected ? "LIVE" : "RECONNECTING"}
            </span>
          </div>
        </div>
      </div>

      <div className={`grid ${gridCols} gap-4`}>
        {ranked.map((lane) => {
          const isLeader = leader && lane.id === leader.id && lane.cumulative > 0;
          const showFinalTime =
            (scoreType === "time" || workoutType === "for_time") &&
            lane.closeReason === "completed" &&
            lane.finalElapsedMs != null;

          return (
            <div
              key={lane.id}
              className={`relative flex min-h-[18rem] flex-col items-center justify-center rounded-2xl p-6 transition-all duration-300 ${
                lane.isFinished
                  ? "border-2 border-brand-green/40 bg-brand-green/10"
                  : isLeader
                    ? "border-2 border-brand-green/30 bg-brand-green/5"
                    : "border border-white/10 bg-white/5"
              }`}
            >
              <div className="absolute left-4 top-3 text-sm font-mono text-white/20">
                #{lane.lane_number}
              </div>

              {isLeader && !lane.isFinished && (
                <div className="absolute right-4 top-3">
                  <Trophy size={16} className="text-brand-green" />
                </div>
              )}

              {lane.isFinished && (
                <div className="absolute right-4 top-3 flex items-center gap-2">
                  <Flag size={16} className="text-brand-green" />
                  <span className="text-[10px] uppercase tracking-[0.24em] text-white/40">
                    {getPublicLaneResultLabel(lane.closeReason as never)}
                  </span>
                </div>
              )}

              <p className="mb-2 w-full truncate text-center text-sm font-bold text-white/70">
                {lane.team?.name ?? "---"}
              </p>

              <p
                className={`font-black tabular-nums transition-all duration-200 ${
                  showFinalTime ? "text-4xl md:text-6xl" : "text-6xl md:text-8xl"
                } ${
                  lane.isFinished || isLeader ? "text-brand-green" : "text-white"
                }`}
              >
                {showFinalTime ? formatElapsedMs(lane.finalElapsedMs) : lane.cumulative}
              </p>

              <p className="mt-1 text-[10px] uppercase tracking-widest text-white/30">
                {showFinalTime
                  ? "TIEMPO FINAL"
                  : scoreLabel[scoreType] || "REPS"}
              </p>

              {lane.team?.box_name && (
                <p className="mt-2 w-full truncate text-center text-[10px] text-white/20">
                  {lane.team.box_name}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-white/10">
          Gijon Throwdown
        </p>
      </div>
    </div>
  );
}
