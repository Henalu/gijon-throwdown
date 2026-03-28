"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Radio, Flag, Trophy } from "lucide-react";
import { useRealtimeHeat } from "@/lib/hooks/use-realtime-heat";

interface LaneInfo {
  id: string;
  lane_number: number;
  team: { id: string; name: string; box_name: string | null; logo_url: string | null } | null;
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
  initialLaneStates: Record<string, { cumulative: number; is_finished: boolean }>;
}

const scoreLabel: Record<string, string> = {
  reps: "REPS",
  time: "TIEMPO",
  weight: "KG",
  rounds_reps: "RONDAS",
  points: "PTS",
  calories: "CAL",
};

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
  // Merge initial state with realtime
  const { laneStates: realtimeStates, isConnected } = useRealtimeHeat(heatId);

  const laneData = useMemo(() => {
    return lanes.map((lane) => {
      const rt = realtimeStates[lane.id];
      const init = initialLaneStates[lane.id];
      const cumulative = rt?.cumulative ?? init?.cumulative ?? 0;
      const isFinished = rt?.is_finished ?? init?.is_finished ?? false;
      return { ...lane, cumulative, isFinished };
    });
  }, [lanes, realtimeStates, initialLaneStates]);

  // Sort by cumulative for ranking (higher = better for most types)
  const ranked = useMemo(() => {
    const sorted = [...laneData].sort((a, b) => {
      // Finished lanes go to top
      if (a.isFinished && !b.isFinished) return -1;
      if (!a.isFinished && b.isFinished) return 1;
      // Then by cumulative
      return b.cumulative - a.cumulative;
    });
    return sorted.map((lane, i) => ({ ...lane, rank: i + 1 }));
  }, [laneData]);

  // Leader
  const leader = ranked[0];

  // Timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (heatStatus !== "active" || !heatStartedAt) return;
    const start = new Date(heatStartedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [heatStatus, heatStartedAt]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // Columns based on lane count
  const gridCols =
    lanes.length <= 4
      ? "grid-cols-2 md:grid-cols-4"
      : lanes.length <= 6
        ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
        : "grid-cols-2 md:grid-cols-4";

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
              {workoutName}
            </h1>
            {heatStatus === "active" && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse-live text-sm">
                <Radio size={14} className="mr-1" />
                EN VIVO
              </Badge>
            )}
            {heatStatus === "finished" && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-sm">
                FINALIZADO
              </Badge>
            )}
          </div>
          <p className="text-white/50 text-sm mt-1">
            {categoryName} | Heat {heatNumber}
          </p>
        </div>

        <div className="text-right">
          {heatStatus === "active" && heatStartedAt && (
            <p className={`font-mono text-4xl md:text-6xl font-black ${timeCap && elapsed >= timeCap ? "text-red-400" : "text-brand-green"}`}>
              {formatTime(elapsed)}
            </p>
          )}
          {timeCap && (
            <p className="text-white/30 text-xs font-mono">
              CAP {formatTime(timeCap)}
            </p>
          )}
          <div className="flex items-center gap-1 justify-end mt-1">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-brand-green" : "bg-yellow-500 animate-pulse"}`} />
            <span className="text-[10px] text-white/30">
              {isConnected ? "LIVE" : "RECONNECTING"}
            </span>
          </div>
        </div>
      </div>

      {/* Lane cards */}
      <div className={`grid ${gridCols} gap-4 flex-1`}>
        {ranked.map((lane) => {
          const isLeader = leader && lane.id === leader.id && lane.cumulative > 0;

          return (
            <div
              key={lane.id}
              className={`relative rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 ${
                lane.isFinished
                  ? "bg-brand-green/10 border-2 border-brand-green/40"
                  : isLeader
                    ? "bg-brand-green/5 border-2 border-brand-green/30"
                    : "bg-white/5 border border-white/10"
              }`}
            >
              {/* Lane number */}
              <div className="absolute top-3 left-4 text-white/20 text-sm font-mono">
                #{lane.lane_number}
              </div>

              {/* Leader indicator */}
              {isLeader && !lane.isFinished && (
                <div className="absolute top-3 right-4">
                  <Trophy size={16} className="text-brand-green" />
                </div>
              )}

              {/* Finished indicator */}
              {lane.isFinished && (
                <div className="absolute top-3 right-4">
                  <Flag size={16} className="text-brand-green" />
                </div>
              )}

              {/* Team name */}
              <p className="text-sm font-bold text-white/70 mb-2 text-center truncate w-full">
                {lane.team?.name ?? "---"}
              </p>

              {/* Score */}
              <p
                className={`text-6xl md:text-8xl font-black tabular-nums transition-all duration-200 ${
                  lane.isFinished
                    ? "text-brand-green"
                    : isLeader
                      ? "text-brand-green"
                      : "text-white"
                }`}
                key={`${lane.id}-${lane.cumulative}`}
              >
                {lane.cumulative}
              </p>

              {/* Score type label */}
              <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">
                {scoreLabel[scoreType] || "REPS"}
              </p>

              {/* Box name */}
              {lane.team?.box_name && (
                <p className="text-[10px] text-white/20 mt-2 truncate w-full text-center">
                  {lane.team.box_name}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer branding */}
      <div className="mt-6 text-center">
        <p className="text-white/10 text-xs font-mono uppercase tracking-[0.3em]">
          Gijon Throwdown
        </p>
      </div>
    </div>
  );
}
