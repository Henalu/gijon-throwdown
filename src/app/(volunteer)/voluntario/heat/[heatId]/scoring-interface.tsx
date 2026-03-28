"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Radio, Flag, Minus, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { submitLiveUpdate, markLaneFinished } from "@/lib/actions/live-updates";
import { useRealtimeHeat } from "@/lib/hooks/use-realtime-heat";

interface LaneInfo {
  id: string;
  lane_number: number;
  team: { id: string; name: string; box_name: string | null } | null;
}

interface ScoringInterfaceProps {
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
  initialLaneStates: Record<string, { cumulative: number; is_finished: boolean; update_type: string }>;
  userId: string;
}

type MetricType = "reps" | "calories" | "weight" | "rounds";

const metricLabels: Record<MetricType, string> = {
  reps: "Reps",
  calories: "Cal",
  weight: "Kg",
  rounds: "Rondas",
};

export function ScoringInterface({
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
}: ScoringInterfaceProps) {
  const [selectedLane, setSelectedLane] = useState<LaneInfo | null>(
    lanes.length === 1 ? lanes[0] : null
  );
  const [metric, setMetric] = useState<MetricType>(
    scoreType === "weight" ? "weight" : scoreType === "rounds_reps" ? "rounds" : "reps"
  );
  const [localCumulatives, setLocalCumulatives] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const lane of lanes) {
      init[lane.id] = initialLaneStates[lane.id]?.cumulative ?? 0;
    }
    return init;
  });
  const [finishedLanes, setFinishedLanes] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const [laneId, state] of Object.entries(initialLaneStates)) {
      if (state.is_finished) s.add(laneId);
    }
    return s;
  });

  // Realtime subscription
  const { laneStates, isConnected } = useRealtimeHeat(heatId);

  // Sync realtime into local state
  useEffect(() => {
    for (const [laneId, state] of Object.entries(laneStates)) {
      setLocalCumulatives((prev) => ({ ...prev, [laneId]: state.cumulative }));
      if (state.is_finished) {
        setFinishedLanes((prev) => new Set(prev).add(laneId));
      }
    }
  }, [laneStates]);

  // Debounce ref for submission
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ lane_id: string; value: number; cumulative: number; type: string } | null>(null);

  const flushPending = useCallback(async () => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;

    const result = await submitLiveUpdate({
      lane_id: pending.lane_id,
      heat_id: heatId,
      update_type: pending.type,
      value: pending.value,
      cumulative: pending.cumulative,
    });

    if ("error" in result) {
      toast.error("Error al enviar: " + result.error);
    }
  }, [heatId]);

  const handleScore = useCallback(
    (laneId: string, delta: number) => {
      if (finishedLanes.has(laneId)) return;

      setLocalCumulatives((prev) => {
        const newVal = Math.max(0, (prev[laneId] ?? 0) + delta);

        // Set pending update
        pendingRef.current = {
          lane_id: laneId,
          value: delta,
          cumulative: newVal,
          type: metric,
        };

        // Debounce 300ms
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          flushPending();
        }, 300);

        return { ...prev, [laneId]: newVal };
      });
    },
    [metric, finishedLanes, flushPending]
  );

  const handleFinish = useCallback(
    async (laneId: string) => {
      if (finishedLanes.has(laneId)) return;

      // Flush any pending update first
      if (debounceRef.current) clearTimeout(debounceRef.current);
      await flushPending();

      const result = await markLaneFinished(laneId, heatId);
      if ("error" in result) {
        toast.error("Error: " + result.error);
      } else {
        setFinishedLanes((prev) => new Set(prev).add(laneId));
        toast.success("Calle finalizada");
      }
    },
    [heatId, finishedLanes, flushPending]
  );

  // Timer display
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

  // Lane selector view
  if (!selectedLane) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/voluntario" className="p-2 -ml-2">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold">{workoutName} - Heat {heatNumber}</h1>
            <p className="text-xs text-muted-foreground">{categoryName}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Selecciona tu calle:</p>
        <div className="grid grid-cols-2 gap-3">
          {lanes.map((lane) => (
            <button
              key={lane.id}
              onClick={() => setSelectedLane(lane)}
              className="p-6 rounded-xl bg-card border-2 border-border hover:border-brand-green/60 transition-colors active:scale-[0.97] text-center"
            >
              <p className="text-3xl font-black text-brand-green">{lane.lane_number}</p>
              <p className="font-bold text-foreground mt-1">{lane.team?.name ?? "---"}</p>
              <p className="text-xs text-muted-foreground">{lane.team?.box_name ?? ""}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const isFinished = finishedLanes.has(selectedLane.id);
  const currentScore = localCumulatives[selectedLane.id] ?? 0;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedLane(null)} className="p-2 -ml-2">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-sm font-bold">
              Calle {selectedLane.lane_number} - {selectedLane.team?.name}
            </p>
            <p className="text-xs text-muted-foreground">{workoutName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge className="bg-brand-green/20 text-brand-green border-brand-green/30 text-xs">
              Conectado
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs">
              Reconectando...
            </Badge>
          )}
          {heatStatus === "active" && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse-live">
              <Radio size={10} className="mr-1" />
              LIVE
            </Badge>
          )}
        </div>
      </div>

      {/* Timer */}
      {heatStatus === "active" && heatStartedAt && (
        <div className="text-center py-2">
          <p className={`font-mono text-2xl font-bold ${timeCap && elapsed >= timeCap ? "text-red-400" : "text-brand-green"}`}>
            {formatTime(elapsed)}
            {timeCap ? ` / ${formatTime(timeCap)}` : ""}
          </p>
        </div>
      )}

      {/* Score display */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {isFinished ? (
          <div className="text-center space-y-3">
            <Flag size={48} className="mx-auto text-brand-green" />
            <p className="text-6xl font-black text-brand-green tabular-nums">
              {currentScore}
            </p>
            <p className="text-muted-foreground">Finalizado</p>
          </div>
        ) : (
          <>
            <p className="text-[8rem] leading-none font-black text-foreground tabular-nums animate-score-pop" key={currentScore}>
              {currentScore}
            </p>
            <p className="text-muted-foreground text-sm mt-2 uppercase tracking-wider">
              {metricLabels[metric]}
            </p>
          </>
        )}
      </div>

      {/* Controls */}
      {!isFinished && (
        <div className="space-y-3 pb-4">
          {/* Metric selector */}
          <div className="flex justify-center gap-2">
            {(Object.keys(metricLabels) as MetricType[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
                  metric === m
                    ? "bg-brand-green text-black"
                    : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {metricLabels[m]}
              </button>
            ))}
          </div>

          {/* Score buttons */}
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => handleScore(selectedLane.id, -5)}
              className="h-16 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-lg active:scale-95 transition-transform flex items-center justify-center"
            >
              <Minus size={16} className="mr-1" />5
            </button>
            <button
              onClick={() => handleScore(selectedLane.id, -1)}
              className="h-16 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-lg active:scale-95 transition-transform flex items-center justify-center"
            >
              <Minus size={16} className="mr-1" />1
            </button>
            <button
              onClick={() => handleScore(selectedLane.id, 1)}
              className="h-16 rounded-xl bg-brand-green/10 border border-brand-green/30 text-brand-green font-bold text-lg active:scale-95 transition-transform flex items-center justify-center"
            >
              <Plus size={16} className="mr-1" />1
            </button>
            <button
              onClick={() => handleScore(selectedLane.id, 5)}
              className="h-16 rounded-xl bg-brand-green/10 border border-brand-green/30 text-brand-green font-bold text-lg active:scale-95 transition-transform flex items-center justify-center"
            >
              <Plus size={16} className="mr-1" />5
            </button>
          </div>

          {/* Finish button */}
          <button
            onClick={() => handleFinish(selectedLane.id)}
            className="w-full h-14 rounded-xl bg-brand-green text-black font-bold text-lg active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
          >
            <Flag size={20} />
            Finalizar Calle
          </button>
        </div>
      )}
    </div>
  );
}
