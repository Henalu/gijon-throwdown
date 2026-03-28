"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Flag, Minus, Plus, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  initialLaneStates: Record<
    string,
    { cumulative: number; is_finished: boolean; update_type: string }
  >;
  userId: string;
}

type MetricType = "reps" | "calories" | "weight" | "rounds";

interface OptimisticLaneState {
  cumulative?: number;
  isFinished?: boolean;
  updatedAt: number;
}

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
    scoreType === "weight"
      ? "weight"
      : scoreType === "rounds_reps"
        ? "rounds"
        : "reps"
  );
  const [optimisticLaneStates, setOptimisticLaneStates] = useState<
    Record<string, OptimisticLaneState>
  >({});

  const { laneStates, isConnected } = useRealtimeHeat(heatId);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{
    lane_id: string;
    value: number;
    cumulative: number;
    type: string;
  } | null>(null);

  const getLaneState = useCallback(
    (laneId: string) => {
      const initialState = initialLaneStates[laneId];
      const realtimeState = laneStates[laneId];
      const optimisticState = optimisticLaneStates[laneId];
      const realtimeTimestamp = realtimeState
        ? new Date(realtimeState.last_updated_at).getTime()
        : 0;
      const optimisticTimestamp = optimisticState?.updatedAt ?? 0;

      if (optimisticState && optimisticTimestamp >= realtimeTimestamp) {
        return {
          cumulative:
            optimisticState.cumulative ??
            realtimeState?.cumulative ??
            initialState?.cumulative ??
            0,
          isFinished:
            optimisticState.isFinished ??
            realtimeState?.is_finished ??
            initialState?.is_finished ??
            false,
        };
      }

      return {
        cumulative: realtimeState?.cumulative ?? initialState?.cumulative ?? 0,
        isFinished: realtimeState?.is_finished ?? initialState?.is_finished ?? false,
      };
    },
    [initialLaneStates, laneStates, optimisticLaneStates]
  );

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
      const currentLaneState = getLaneState(laneId);
      if (currentLaneState.isFinished) return;

      const newValue = Math.max(0, currentLaneState.cumulative + delta);

      setOptimisticLaneStates((prev) => ({
        ...prev,
        [laneId]: {
          ...prev[laneId],
          cumulative: newValue,
          updatedAt: Date.now(),
        },
      }));

      pendingRef.current = {
        lane_id: laneId,
        value: delta,
        cumulative: newValue,
        type: metric,
      };

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        flushPending();
      }, 300);
    },
    [flushPending, getLaneState, metric]
  );

  const handleFinish = useCallback(
    async (laneId: string) => {
      const currentLaneState = getLaneState(laneId);
      if (currentLaneState.isFinished) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      await flushPending();

      const result = await markLaneFinished(laneId, heatId);
      if ("error" in result) {
        toast.error("Error: " + result.error);
      } else {
        setOptimisticLaneStates((prev) => ({
          ...prev,
          [laneId]: {
            ...prev[laneId],
            cumulative: currentLaneState.cumulative,
            isFinished: true,
            updatedAt: Date.now(),
          },
        }));
        toast.success("Calle finalizada");
      }
    },
    [flushPending, getLaneState, heatId]
  );

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (heatStatus !== "active" || !heatStartedAt) return;
    const start = new Date(heatStartedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [heatStatus, heatStartedAt]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  if (!selectedLane) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/voluntario" className="p-2 -ml-2">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold">
              {workoutName} - Heat {heatNumber}
            </h1>
            <p className="text-xs text-muted-foreground">{categoryName}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Selecciona tu calle:</p>
        <div className="grid grid-cols-2 gap-3">
          {lanes.map((lane) => (
            <button
              key={lane.id}
              onClick={() => setSelectedLane(lane)}
              className="rounded-xl border-2 border-border bg-card p-6 text-center transition-colors active:scale-[0.97] hover:border-brand-green/60"
            >
              <p className="text-3xl font-black text-brand-green">
                {lane.lane_number}
              </p>
              <p className="mt-1 font-bold text-foreground">
                {lane.team?.name ?? "---"}
              </p>
              <p className="text-xs text-muted-foreground">
                {lane.team?.box_name ?? ""}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const selectedLaneState = getLaneState(selectedLane.id);
  const isFinished = selectedLaneState.isFinished;
  const currentScore = selectedLaneState.cumulative;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
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
            <Badge className="border-brand-green/30 bg-brand-green/20 text-xs text-brand-green">
              Conectado
            </Badge>
          ) : (
            <Badge className="border-yellow-500/30 bg-yellow-500/20 text-xs text-yellow-500">
              Reconectando...
            </Badge>
          )}
          {heatStatus === "active" && (
            <Badge className="border-red-500/30 bg-red-500/20 text-xs text-red-400 animate-pulse-live">
              <Radio size={10} className="mr-1" />
              LIVE
            </Badge>
          )}
        </div>
      </div>

      {heatStatus === "active" && heatStartedAt && (
        <div className="py-2 text-center">
          <p
            className={`font-mono text-2xl font-bold ${
              timeCap && elapsed >= timeCap ? "text-red-400" : "text-brand-green"
            }`}
          >
            {formatTime(elapsed)}
            {timeCap ? ` / ${formatTime(timeCap)}` : ""}
          </p>
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center">
        {isFinished ? (
          <div className="space-y-3 text-center">
            <Flag size={48} className="mx-auto text-brand-green" />
            <p className="text-6xl font-black tabular-nums text-brand-green">
              {currentScore}
            </p>
            <p className="text-muted-foreground">Finalizado</p>
          </div>
        ) : (
          <>
            <p
              className="animate-score-pop text-7xl font-black leading-none tabular-nums text-foreground sm:text-[8rem]"
              key={currentScore}
            >
              {currentScore}
            </p>
            <p className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">
              {metricLabels[metric]}
            </p>
          </>
        )}
      </div>

      {!isFinished && (
        <div className="space-y-3 pb-4">
          <div className="flex justify-center gap-2">
            {(Object.keys(metricLabels) as MetricType[]).map((metricOption) => (
              <button
                key={metricOption}
                onClick={() => setMetric(metricOption)}
                className={`rounded-lg px-4 py-2 text-xs font-bold uppercase transition-colors ${
                  metric === metricOption
                    ? "bg-brand-green text-black"
                    : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {metricLabels[metricOption]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <button
              onClick={() => handleScore(selectedLane.id, -5)}
              className="flex h-16 min-h-[3.5rem] items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-lg font-bold text-red-400 transition-transform active:scale-95"
            >
              <Minus size={16} className="mr-1" />5
            </button>
            <button
              onClick={() => handleScore(selectedLane.id, -1)}
              className="flex h-16 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-lg font-bold text-red-400 transition-transform active:scale-95"
            >
              <Minus size={16} className="mr-1" />1
            </button>
            <button
              onClick={() => handleScore(selectedLane.id, 1)}
              className="flex h-16 items-center justify-center rounded-xl border border-brand-green/30 bg-brand-green/10 text-lg font-bold text-brand-green transition-transform active:scale-95"
            >
              <Plus size={16} className="mr-1" />1
            </button>
            <button
              onClick={() => handleScore(selectedLane.id, 5)}
              className="flex h-16 items-center justify-center rounded-xl border border-brand-green/30 bg-brand-green/10 text-lg font-bold text-brand-green transition-transform active:scale-95"
            >
              <Plus size={16} className="mr-1" />5
            </button>
          </div>

          <button
            onClick={() => handleFinish(selectedLane.id)}
            className="flex h-14 min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-xl bg-brand-green text-lg font-bold text-black transition-transform active:scale-[0.97]"
          >
            <Flag size={20} />
            Finalizar Calle
          </button>
        </div>
      )}
    </div>
  );
}
