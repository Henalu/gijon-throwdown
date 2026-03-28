"use client";

import { useState, useEffect, useMemo } from "react";
import { useRealtimeHeat } from "@/lib/hooks/use-realtime-heat";
import { Flag } from "lucide-react";

interface OverlayViewProps {
  heatId: string;
  heatStatus: string;
  heatStartedAt: string | null;
  workoutName: string;
  scoreType: string;
  timeCap: number | null;
  lanes: { id: string; lane_number: number; team: { name: string } | null }[];
  initialStates: Record<string, { cumulative: number; is_finished: boolean }>;
}

export function OverlayView({
  heatId,
  heatStatus,
  heatStartedAt,
  workoutName,
  timeCap,
  lanes,
  initialStates,
}: OverlayViewProps) {
  const { laneStates: realtimeStates } = useRealtimeHeat(heatId);

  const laneData = useMemo(() => {
    return lanes.map((lane) => {
      const rt = realtimeStates[lane.id];
      const init = initialStates[lane.id];
      return {
        ...lane,
        cumulative: rt?.cumulative ?? init?.cumulative ?? 0,
        isFinished: rt?.is_finished ?? init?.is_finished ?? false,
      };
    });
  }, [lanes, realtimeStates, initialStates]);

  // Rank by score
  const ranked = useMemo(() => {
    const sorted = [...laneData].sort((a, b) => {
      if (a.isFinished && !b.isFinished) return -1;
      if (!a.isFinished && b.isFinished) return 1;
      return b.cumulative - a.cumulative;
    });
    return sorted;
  }, [laneData]);

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

  // Transparent background for OBS chroma / browser source
  return (
    <div className="min-h-screen bg-transparent p-4 font-mono">
      {/* Timer bar */}
      <div className="flex items-center justify-between mb-3 px-2">
        <span className="text-white/80 text-sm font-bold uppercase">
          {workoutName}
        </span>
        {heatStatus === "active" && heatStartedAt && (
          <span className={`text-2xl font-black ${timeCap && elapsed >= timeCap ? "text-red-400" : "text-brand-green"}`}>
            {formatTime(elapsed)}
          </span>
        )}
      </div>

      {/* Score rows */}
      <div className="space-y-1">
        {ranked.map((lane, index) => (
          <div
            key={lane.id}
            className={`flex items-center justify-between px-4 py-2 rounded-lg transition-all duration-300 ${
              index === 0 && lane.cumulative > 0
                ? "bg-brand-green/20 border border-brand-green/40"
                : "bg-black/60 border border-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-white/40 text-sm w-6 text-right">{index + 1}</span>
              <span className="text-white font-bold text-sm truncate max-w-[180px]">
                {lane.team?.name ?? `Calle ${lane.lane_number}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {lane.isFinished && <Flag size={12} className="text-brand-green" />}
              <span className={`text-2xl font-black tabular-nums ${lane.isFinished ? "text-brand-green" : index === 0 && lane.cumulative > 0 ? "text-brand-green" : "text-white"}`}>
                {lane.cumulative}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
