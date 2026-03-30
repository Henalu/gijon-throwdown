"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Flag,
  Minus,
  Plus,
  Radio,
  StickyNote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  autoCloseHeatAtCap,
  closeLaneResult,
  saveLiveCheckpoint,
  submitLiveUpdate,
} from "@/lib/actions/live-updates";
import { useRealtimeHeat } from "@/lib/hooks/use-realtime-heat";
import {
  formatElapsedMs,
  getDefaultLiveMetric,
  getElapsedMs,
  getLiveMetricLabel,
} from "@/lib/live-scoring";
import type {
  LiveLaneCloseReason,
  LiveMetricType,
} from "@/types";

interface LaneInfo {
  id: string;
  lane_number: number;
  team: { id: string; name: string; box_name: string | null } | null;
}

interface LaneCheckpoint {
  id: string;
  value: number;
  metric_type: LiveMetricType;
  elapsed_ms: number | null;
  created_at: string;
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
    {
      cumulative: number;
      is_finished: boolean;
      update_type: string;
      close_reason: string | null;
      final_metric_type: LiveMetricType | null;
      final_elapsed_ms: number | null;
      judge_notes: string | null;
      closed_at: string | null;
    }
  >;
  initialCheckpoints: Record<string, LaneCheckpoint[]>;
  userId: string;
}

type MetricType = LiveMetricType;

interface OptimisticLaneState {
  cumulative?: number;
  isFinished?: boolean;
  closeReason?: LiveLaneCloseReason | null;
  finalMetricType?: LiveMetricType | null;
  finalElapsedMs?: number | null;
  judgeNotes?: string | null;
  closedAt?: string | null;
  updatedAt: number;
}

function getMetricOptions(scoreType: string): MetricType[] {
  const defaultMetric = getDefaultLiveMetric(scoreType as never);
  const base: MetricType[] = ["reps", "calories", "weight", "rounds"];

  if (defaultMetric === "points") {
    return ["points", ...base.filter((metric) => metric !== "points")];
  }

  return base;
}

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
  initialCheckpoints,
}: ScoringInterfaceProps) {
  const [selectedLane, setSelectedLane] = useState<LaneInfo | null>(
    lanes.length === 1 ? lanes[0] : null,
  );
  const [metric, setMetric] = useState<MetricType>(
    getDefaultLiveMetric(scoreType as never),
  );
  const [optimisticLaneStates, setOptimisticLaneStates] = useState<
    Record<string, OptimisticLaneState>
  >({});
  const [checkpointsByLane, setCheckpointsByLane] = useState(initialCheckpoints);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [resultNotes, setResultNotes] = useState("");
  const [autoClosing, setAutoClosing] = useState(false);
  const [savingCheckpoint, setSavingCheckpoint] = useState(false);
  const [savingResult, setSavingResult] = useState(false);

  const { laneStates, isConnected, heatStatus: liveHeatStatus } = useRealtimeHeat(
    heatId,
    heatStatus,
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{
    lane_id: string;
    value: number;
    cumulative: number;
    type: string;
  } | null>(null);
  const autoCloseRequestedRef = useRef(false);

  const getLaneState = (laneId: string) => {
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
        closeReason:
          optimisticState.closeReason ??
          realtimeState?.close_reason ??
          (initialState?.close_reason as LiveLaneCloseReason | null) ??
          null,
        finalMetricType:
          optimisticState.finalMetricType ??
          realtimeState?.final_metric_type ??
          initialState?.final_metric_type ??
          null,
        finalElapsedMs:
          optimisticState.finalElapsedMs ??
          realtimeState?.final_elapsed_ms ??
          initialState?.final_elapsed_ms ??
          null,
        judgeNotes:
          optimisticState.judgeNotes ??
          realtimeState?.judge_notes ??
          initialState?.judge_notes ??
          null,
        closedAt:
          optimisticState.closedAt ??
          realtimeState?.closed_at ??
          initialState?.closed_at ??
          null,
      };
    }

    return {
      cumulative: realtimeState?.cumulative ?? initialState?.cumulative ?? 0,
      isFinished: realtimeState?.is_finished ?? initialState?.is_finished ?? false,
      closeReason:
        realtimeState?.close_reason ??
        (initialState?.close_reason as LiveLaneCloseReason | null) ??
        null,
      finalMetricType:
        realtimeState?.final_metric_type ?? initialState?.final_metric_type ?? null,
      finalElapsedMs:
        realtimeState?.final_elapsed_ms ?? initialState?.final_elapsed_ms ?? null,
      judgeNotes: realtimeState?.judge_notes ?? initialState?.judge_notes ?? null,
      closedAt: realtimeState?.closed_at ?? initialState?.closed_at ?? null,
    };
  };

  const flushPending = useCallback(async () => {
    const pending = pendingRef.current;
    if (!pending) return true;
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
      return false;
    }

    return true;
  }, [heatId]);

  const getCurrentElapsedMs = () => getElapsedMs(heatStartedAt) ?? null;
  const currentElapsedMs = getCurrentElapsedMs();
  const capReached =
    timeCap != null &&
    currentElapsedMs != null &&
    currentElapsedMs >= timeCap * 1000;

  useEffect(() => {
    if (
      liveHeatStatus !== "active" ||
      !timeCap ||
      !heatStartedAt ||
      !capReached ||
      autoCloseRequestedRef.current
    ) {
      return;
    }

    autoCloseRequestedRef.current = true;

    void (async () => {
      setAutoClosing(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      await flushPending();

      const result = await autoCloseHeatAtCap(heatId);
      setAutoClosing(false);

      if ("error" in result) {
        toast.error(result.error);
        autoCloseRequestedRef.current = false;
        return;
      }

      if (result.heatClosed) {
        toast.success("El heat se ha cerrado automaticamente al alcanzar el cap");
      }
    })();
  }, [capReached, flushPending, heatId, heatStartedAt, liveHeatStatus, timeCap]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleScore = (laneId: string, delta: number) => {
    const currentLaneState = getLaneState(laneId);
    if (
      currentLaneState.isFinished ||
      liveHeatStatus === "finished" ||
      autoClosing ||
      capReached
    ) {
      return;
    }

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
      void flushPending();
    }, 300);
  };

  const handleSaveCheckpoint = async () => {
    if (!selectedLane) return;
    const laneState = getLaneState(selectedLane.id);
    if (laneState.isFinished || liveHeatStatus === "finished" || autoClosing) {
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    const flushed = await flushPending();
    if (!flushed) return;

    setSavingCheckpoint(true);
    const result = await saveLiveCheckpoint({
      lane_id: selectedLane.id,
      heat_id: heatId,
      value: laneState.cumulative,
      metric_type: metric,
      elapsed_ms: getCurrentElapsedMs(),
    });
    setSavingCheckpoint(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    setCheckpointsByLane((prev) => ({
      ...prev,
      [selectedLane.id]: [
        ...(prev[selectedLane.id] ?? []),
        {
          id: `local-${Date.now()}`,
          value: laneState.cumulative,
          metric_type: metric,
          elapsed_ms: getCurrentElapsedMs(),
          created_at: new Date().toISOString(),
        },
      ],
    }));
    toast.success("Parcial guardado");
  };

  const openResultDialog = () => {
    if (!selectedLane) return;
    const laneState = getLaneState(selectedLane.id);
    setResultNotes(laneState.judgeNotes ?? "");
    setResultDialogOpen(true);
  };

  const handleSaveLaneResult = async () => {
    if (!selectedLane) return;

    const laneState = getLaneState(selectedLane.id);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const flushed = await flushPending();
    if (!flushed) return;

    const effectiveElapsedMs =
      laneState.finalElapsedMs ??
      (capReached && timeCap ? timeCap * 1000 : getCurrentElapsedMs());

    const closeReason: LiveLaneCloseReason =
      laneState.closeReason ??
      (workoutType === "for_time"
        ? capReached && timeCap
          ? "time_cap"
          : "completed"
        : capReached && timeCap
          ? "time_cap"
          : "manual");

    const finalMetricType = laneState.finalMetricType ?? metric;
    const finalValue = laneState.cumulative;

    setSavingResult(true);
    const result = await closeLaneResult({
      lane_id: selectedLane.id,
      heat_id: heatId,
      close_reason: closeReason,
      final_value: finalValue,
      final_metric_type: finalMetricType,
      final_elapsed_ms: effectiveElapsedMs,
      judge_notes: resultNotes,
    });
    setSavingResult(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    setOptimisticLaneStates((prev) => ({
      ...prev,
      [selectedLane.id]: {
        cumulative: finalValue,
        isFinished: true,
        closeReason,
        finalMetricType,
        finalElapsedMs: effectiveElapsedMs,
        judgeNotes: resultNotes.trim() || null,
        closedAt: new Date().toISOString(),
        updatedAt: Date.now(),
      },
    }));
    setResultDialogOpen(false);
    toast.success(
      closeReason === "time_cap" ? "Calle cerrada por cap" : "Calle finalizada",
    );
  };

  const formatTimer = (elapsed: number | null) => {
    if (elapsed == null) return "--:--";
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${String(remaining).padStart(2, "0")}`;
  };

  const metricOptions = getMetricOptions(scoreType);

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
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
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
  const laneCheckpoints = checkpointsByLane[selectedLane.id] ?? [];
  const canEditLive = !isFinished && liveHeatStatus !== "finished" && !autoClosing && !capReached;
  const finishButtonLabel =
    workoutType === "for_time" ? "Finalizar calle" : "Cerrar calle";

  return (
    <>
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
            {liveHeatStatus === "active" ? (
              <Badge className="border-red-500/30 bg-red-500/20 text-xs text-red-400 animate-pulse-live">
                <Radio size={10} className="mr-1" />
                LIVE
              </Badge>
            ) : (
              <Badge className="border-border text-xs text-muted-foreground">
                Heat cerrado
              </Badge>
            )}
          </div>
        </div>

        {heatStartedAt && (
          <div className="py-2 text-center">
            <p
              className={`font-mono text-2xl font-bold ${
                timeCap && capReached ? "text-red-400" : "text-brand-green"
              }`}
            >
              {formatTimer(currentElapsedMs)}
              {timeCap ? ` / ${formatTimer(timeCap * 1000)}` : ""}
            </p>
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          {isFinished ? (
            <div className="space-y-3 text-center">
              <Flag size={48} className="mx-auto text-brand-green" />
              <p className="text-6xl font-black tabular-nums text-brand-green">
                {currentScore}
              </p>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">
                {getLiveMetricLabel(selectedLaneState.finalMetricType ?? metric)}
              </p>
              {selectedLaneState.finalElapsedMs != null && (
                <p className="text-lg font-semibold text-foreground">
                  {formatElapsedMs(selectedLaneState.finalElapsedMs)}
                </p>
              )}
              <Badge variant="outline" className="text-xs">
                {selectedLaneState.closeReason === "time_cap"
                  ? "Cerrada por cap"
                  : selectedLaneState.closeReason === "completed"
                    ? "Completada"
                    : "Cerrada"}
              </Badge>
              {selectedLaneState.judgeNotes && (
                <p className="mx-auto max-w-xl rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-sm text-muted-foreground">
                  {selectedLaneState.judgeNotes}
                </p>
              )}
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
                {getLiveMetricLabel(metric)}
              </p>
              {capReached && (
                <Badge className="border-orange-500/30 bg-orange-500/15 text-orange-400">
                  Time cap alcanzado
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="space-y-3 pb-4">
          <div className="rounded-2xl border border-border/60 bg-card/70 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Parciales
              </p>
              <button
                onClick={() => void handleSaveCheckpoint()}
                disabled={!canEditLive || savingCheckpoint}
                className="rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs font-bold text-brand-cyan disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingCheckpoint ? "Guardando..." : "Guardar parcial"}
              </button>
            </div>
            {laneCheckpoints.length > 0 ? (
              <div className="space-y-2">
                {[...laneCheckpoints].reverse().slice(0, 4).map((checkpoint) => (
                  <div
                    key={checkpoint.id}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm"
                  >
                    <span className="font-mono text-brand-cyan">
                      {formatElapsedMs(checkpoint.elapsed_ms)}
                    </span>
                    <span className="font-semibold text-foreground">
                      {checkpoint.value} {getLiveMetricLabel(checkpoint.metric_type)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Todavia no hay parciales guardados en esta calle.
              </p>
            )}
          </div>

          {!isFinished && (
            <>
              <div className="flex flex-wrap justify-center gap-2">
                {metricOptions.map((metricOption) => (
                  <button
                    key={metricOption}
                    onClick={() => setMetric(metricOption)}
                    disabled={!canEditLive}
                    className={`rounded-lg px-4 py-2 text-xs font-bold uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      metric === metricOption
                        ? "bg-brand-green text-black"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {getLiveMetricLabel(metricOption)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                <button
                  onClick={() => handleScore(selectedLane.id, -5)}
                  disabled={!canEditLive}
                  className="flex h-16 min-h-[3.5rem] items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-lg font-bold text-red-400 transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus size={16} className="mr-1" />5
                </button>
                <button
                  onClick={() => handleScore(selectedLane.id, -1)}
                  disabled={!canEditLive}
                  className="flex h-16 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-lg font-bold text-red-400 transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus size={16} className="mr-1" />1
                </button>
                <button
                  onClick={() => handleScore(selectedLane.id, 1)}
                  disabled={!canEditLive}
                  className="flex h-16 items-center justify-center rounded-xl border border-brand-green/30 bg-brand-green/10 text-lg font-bold text-brand-green transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={16} className="mr-1" />1
                </button>
                <button
                  onClick={() => handleScore(selectedLane.id, 5)}
                  disabled={!canEditLive}
                  className="flex h-16 items-center justify-center rounded-xl border border-brand-green/30 bg-brand-green/10 text-lg font-bold text-brand-green transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={16} className="mr-1" />5
                </button>
              </div>
            </>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={openResultDialog}
              disabled={savingResult || autoClosing}
              className="flex h-14 min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-xl bg-brand-green text-lg font-bold text-black transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Flag size={20} />
              {isFinished ? "Editar observacion" : finishButtonLabel}
            </button>
            <button
              onClick={openResultDialog}
              disabled={savingResult || autoClosing}
              className="flex h-14 min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-card text-sm font-semibold text-foreground transition-transform active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <StickyNote size={18} />
              {selectedLaneState.judgeNotes ? "Actualizar nota" : "Añadir nota"}
            </button>
          </div>
        </div>
      </div>

      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isFinished ? "Observacion final" : finishButtonLabel}
            </DialogTitle>
            <DialogDescription>
              La calle se cerrara con el valor visible ahora mismo y quedara bloqueada
              para edicion normal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Valor final
                </p>
                <p className="mt-1 text-2xl font-black text-foreground">
                  {currentScore}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Tiempo
                </p>
                <p className="mt-1 text-2xl font-black text-foreground">
                  {formatElapsedMs(
                    selectedLaneState.finalElapsedMs ??
                      (capReached && timeCap
                        ? timeCap * 1000
                        : getCurrentElapsedMs()),
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Anotaciones del juez
              </label>
              <Textarea
                value={resultNotes}
                onChange={(event) => setResultNotes(event.target.value)}
                placeholder="Penalizacion, rep pendiente, duda de validacion..."
                rows={5}
              />
            </div>

            <button
              onClick={() => void handleSaveLaneResult()}
              disabled={savingResult}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-green font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Flag size={18} />
              {savingResult ? "Guardando..." : "Guardar cierre provisional"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
