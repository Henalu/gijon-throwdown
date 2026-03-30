"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Flag,
  Info,
  MonitorPlay,
  Radio,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRealtimeHeat } from "@/lib/hooks/use-realtime-heat";
import {
  formatElapsedMs,
  getPublicLaneResultLabel,
} from "@/lib/live-scoring";
import type { WorkoutStage } from "@/types";

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
  workoutDescription: string | null;
  workoutStandards: string | null;
  workoutType: string;
  scoreType: string;
  timeCap: number | null;
  workoutStages: WorkoutStage[];
  streamEmbedUrl: string | null;
  streamTitle: string | null;
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

type ViewMode = "leaderboard" | "combined";

const scoreLabel: Record<string, string> = {
  reps: "REPS",
  time: "TIEMPO",
  weight: "KG",
  rounds_reps: "RONDAS",
  points: "PTS",
  calories: "CAL",
};

const wodTypeLabel: Record<string, string> = {
  for_time: "For Time",
  amrap: "AMRAP",
  emom: "EMOM",
  max_weight: "Max Weight",
  chipper: "Chipper",
  custom: "Custom",
};

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatStageTarget(stage: WorkoutStage) {
  if (stage.target_value == null) return null;
  return `${stage.target_value} ${stage.unit}`.trim();
}

function InfoChip({
  active,
  onClick,
  icon,
  label,
  disabled = false,
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-brand-green/50 bg-brand-green/12 text-brand-green"
          : "border-white/12 bg-white/[0.03] text-white/72 hover:bg-white/[0.06]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function LiveHeatView({
  heatId,
  heatNumber,
  heatStatus,
  heatStartedAt,
  workoutName,
  workoutDescription,
  workoutStandards,
  workoutType,
  scoreType,
  timeCap,
  workoutStages,
  streamEmbedUrl,
  streamTitle,
  categoryName,
  lanes,
  initialLaneStates,
}: LiveHeatViewProps) {
  const {
    laneStates: realtimeStates,
    isConnected,
    heatStatus: liveHeatStatus,
  } = useRealtimeHeat(heatId, heatStatus);
  const [viewMode, setViewMode] = useState<ViewMode>("leaderboard");
  const [wodInfoOpen, setWodInfoOpen] = useState(false);

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
  const isTimedView = scoreType === "time" || workoutType === "for_time";
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
      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
      : lanes.length <= 6
        ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
        : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4";

  return (
    <>
      <div className="min-h-screen bg-[#050505] text-white">
        <div className="mx-auto max-w-[1600px] p-4 md:p-6 xl:p-8">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-white/12 bg-white/[0.04] text-xs text-white/78">
                  {categoryName} | Heat {heatNumber}
                </Badge>
                {liveHeatStatus === "active" && (
                  <Badge className="animate-pulse-live border-red-500/30 bg-red-500/20 text-xs text-red-400">
                    <Radio size={12} className="mr-1" />
                    EN VIVO
                  </Badge>
                )}
                {liveHeatStatus === "finished" && (
                  <Badge className="border-blue-500/30 bg-blue-500/20 text-xs text-blue-400">
                    FINALIZADO
                  </Badge>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="max-w-[16ch] break-words text-[clamp(2.15rem,9vw,4.8rem)] font-black uppercase leading-[0.9] tracking-[-0.08em] text-white">
                  {workoutName}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/56 sm:text-base">
                  Sigue el desarrollo del heat en directo, cambia entre ranking puro
                  o vista combinada y consulta el WOD sin salir de pantalla.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <InfoChip
                    active={viewMode === "leaderboard"}
                    onClick={() => setViewMode("leaderboard")}
                    icon={<BarChart3 size={14} />}
                    label="Leaderboard"
                  />
                  <InfoChip
                    active={viewMode === "combined"}
                    onClick={() => setViewMode("combined")}
                    icon={<MonitorPlay size={14} />}
                    label="Vídeo + live"
                  />
                  <InfoChip
                    onClick={() => setWodInfoOpen(true)}
                    icon={<Info size={14} />}
                    label="Info WOD"
                  />
                </div>

                {viewMode === "combined" && (
                  <p className="text-xs uppercase tracking-[0.22em] text-white/38">
                    {streamEmbedUrl
                      ? "Vídeo sincronizado con leaderboard en vivo"
                      : "Modo combinado disponible sin señal configurada"}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                    Tiempo oficial
                  </p>
                  {heatStartedAt ? (
                    <p
                      className={`mt-2 font-mono text-[clamp(2.6rem,14vw,4.8rem)] font-black leading-none ${
                        timeCap && elapsed >= timeCap
                          ? "text-red-400"
                          : "text-brand-green"
                      }`}
                    >
                      {formatTimer(Math.min(elapsed, timeCap ?? elapsed))}
                    </p>
                  ) : (
                    <p className="mt-2 font-mono text-4xl font-black leading-none text-white/22">
                      --:--
                    </p>
                  )}
                </div>

                <div className="shrink-0 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-white/72">
                  {isConnected ? "LIVE" : "Reconectando"}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/34">
                  {timeCap ? `Cap ${formatTimer(timeCap)}` : "Sin time cap"}
                </p>
                <div className="flex items-center gap-2 text-xs text-white/42">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isConnected ? "bg-brand-green" : "animate-pulse bg-yellow-500"
                    }`}
                  />
                  {isConnected ? "Conectado" : "Reconectando stream de datos"}
                </div>
              </div>
            </div>
          </div>

          {viewMode === "combined" ? (
            <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(20rem,0.95fr)] xl:items-start">
              <section className="space-y-4">
                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4">
                    <div>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                        Emisión
                      </p>
                      <p className="mt-2 text-lg font-medium text-white">
                        {streamTitle ?? "Vídeo del heat"}
                      </p>
                    </div>
                    <MonitorPlay className="text-brand-green" size={18} />
                  </div>

                  {streamEmbedUrl ? (
                    <div className="aspect-video bg-black">
                      <iframe
                        src={streamEmbedUrl}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={streamTitle ?? "Vídeo del heat"}
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-[radial-gradient(circle_at_top,_rgba(80,195,166,0.12),_transparent_50%),linear-gradient(180deg,#080b08,#050505)] px-6 text-center">
                      <MonitorPlay size={38} className="text-brand-green/70" />
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-white">
                          No hay vídeo configurado ahora mismo
                        </p>
                        <p className="max-w-xl text-sm leading-6 text-white/54">
                          El modo combinado sigue disponible, pero no hay una señal pública
                          embebida en este momento. El leaderboard live continúa actualizándose.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <aside className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] xl:sticky xl:top-4">
                <div className="border-b border-white/10 px-4 py-4">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                    Leaderboard live
                  </p>
                  <p className="mt-2 text-lg font-medium text-white">
                    Ranking dinámico del heat
                  </p>
                </div>

                <div className="space-y-2 p-3">
                  {ranked.map((lane, index) => {
                    const showFinalTime =
                      isTimedView &&
                      lane.closeReason === "completed" &&
                      lane.finalElapsedMs != null;

                    return (
                      <div
                        key={lane.id}
                        className={`rounded-[1.2rem] border px-4 py-3 transition-all duration-300 ${
                          index === 0 && lane.cumulative > 0
                            ? "border-brand-green/40 bg-brand-green/12"
                            : "border-white/8 bg-black/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="w-6 text-right text-xs text-white/38">
                                #{lane.rank}
                              </span>
                              <p className="truncate text-sm font-semibold text-white">
                                {lane.team?.name ?? `Calle ${lane.lane_number}`}
                              </p>
                            </div>
                            <p className="mt-1 pl-8 text-[11px] uppercase tracking-[0.2em] text-white/30">
                              Calle {lane.lane_number}
                              {lane.team?.box_name ? ` | ${lane.team.box_name}` : ""}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p
                              className={`font-black tabular-nums ${
                                showFinalTime ? "text-2xl" : "text-3xl"
                              } ${
                                lane.isFinished || (index === 0 && lane.cumulative > 0)
                                  ? "text-brand-green"
                                  : "text-white"
                              }`}
                            >
                              {showFinalTime
                                ? formatElapsedMs(lane.finalElapsedMs)
                                : lane.cumulative}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/34">
                              {showFinalTime
                                ? "TIEMPO FINAL"
                                : scoreLabel[scoreType] || "REPS"}
                            </p>
                          </div>
                        </div>

                        {lane.isFinished && (
                          <div className="mt-3 flex items-center gap-2 border-t border-white/8 pt-3 text-[10px] uppercase tracking-[0.22em] text-white/36">
                            <Flag size={12} className="text-brand-green" />
                            {getPublicLaneResultLabel(lane.closeReason as never)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </aside>
            </div>
          ) : (
            <div className={`mt-6 grid ${gridCols} gap-4`}>
              {ranked.map((lane) => {
                const isLeader = leader && lane.id === leader.id && lane.cumulative > 0;
                const showFinalTime =
                  isTimedView &&
                  lane.closeReason === "completed" &&
                  lane.finalElapsedMs != null;

                return (
                  <div
                    key={lane.id}
                    className={`relative flex min-h-[18rem] flex-col items-center justify-center rounded-[2rem] p-6 transition-all duration-300 ${
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
                      {showFinalTime
                        ? formatElapsedMs(lane.finalElapsedMs)
                        : lane.cumulative}
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
          )}

          <div className="mt-6 text-center">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-white/10">
              Gijon Throwdown
            </p>
          </div>
        </div>
      </div>

      <Dialog open={wodInfoOpen} onOpenChange={setWodInfoOpen}>
        <DialogContent className="max-h-[85vh] overflow-hidden border border-white/10 bg-[#080b08] p-0 text-white ring-white/10 sm:max-w-[min(92vw,42rem)] lg:max-w-[min(90vw,68rem)] xl:max-w-[min(88vw,76rem)]">
          <div className="max-h-[85vh] overflow-y-auto">
            <div className="border-b border-white/10 px-6 py-5 lg:px-8 lg:py-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
                <DialogHeader className="min-w-0 flex-1">
                  <DialogTitle className="break-words text-2xl font-semibold tracking-[-0.04em] text-white lg:text-[2rem] [overflow-wrap:anywhere]">
                  {workoutName}
                  </DialogTitle>
                  <DialogDescription className="max-w-2xl break-words text-white/58 [overflow-wrap:anywhere]">
                  Consulta el detalle del WOD sin abandonar el live del heat.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap gap-2 lg:max-w-[22rem] lg:justify-end">
                <Badge className="border-white/12 bg-white/[0.04] text-white/72">
                  {wodTypeLabel[workoutType] || workoutType}
                </Badge>
                <Badge className="border-white/12 bg-white/[0.04] text-white/72">
                  {scoreLabel[scoreType] || scoreType}
                </Badge>
                {timeCap ? (
                  <Badge className="border-brand-green/25 bg-brand-green/12 text-brand-green">
                    Cap {formatTimer(timeCap)}
                  </Badge>
                ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-6 lg:px-8 lg:py-8 xl:grid-cols-[minmax(0,0.88fr)_minmax(22rem,1.12fr)]">
              <div className="min-w-0 space-y-6">
                <section className="space-y-3">
                  <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/42">
                    Descripción
                  </h3>
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-white/72 lg:p-5">
                    {workoutDescription ? (
                      <p className="whitespace-pre-line break-words [overflow-wrap:anywhere]">
                        {workoutDescription}
                      </p>
                    ) : (
                      <p>No hay descripción publicada todavía para este WOD.</p>
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/42">
                    Reglas y standards
                  </h3>
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-white/72 lg:p-5">
                    {workoutStandards ? (
                      <p className="whitespace-pre-line break-words [overflow-wrap:anywhere]">
                        {workoutStandards}
                      </p>
                    ) : (
                      <p>No hay standards publicados todavía para este WOD.</p>
                    )}
                  </div>
                </section>
              </div>

              <div className="min-w-0 space-y-6">
                <section className="space-y-3">
                  <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/42">
                    Estructura del workout
                  </h3>
                  <div className="space-y-3">
                    {workoutStages.length > 0 ? (
                      workoutStages.map((stage, index) => (
                        <div
                          key={stage.id}
                          className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] p-4 lg:p-5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green/12 text-xs font-black text-brand-green">
                              {index + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold text-white [overflow-wrap:anywhere]">
                                {stage.name}
                              </p>
                              {formatStageTarget(stage) ? (
                                <p className="mt-1 break-words text-xs uppercase tracking-[0.18em] text-brand-green/82 [overflow-wrap:anywhere]">
                                  {formatStageTarget(stage)}
                                </p>
                              ) : null}
                              {stage.description ? (
                                <p className="mt-2 break-words text-sm leading-6 text-white/64 [overflow-wrap:anywhere]">
                                  {stage.description}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-white/54">
                        No hay fases publicadas todavía. La estructura visible por ahora
                        depende de la descripción general del WOD.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
