"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { finalizeHeat } from "@/lib/actions/scores";

interface ScoreRow {
  id: string;
  team_id: string;
  workout_id: string;
  heat_id: string | null;
  time_ms: number | null;
  reps: number | null;
  weight_kg: number | null;
  rounds: number | null;
  remaining_reps: number | null;
  points: number | null;
  is_rx: boolean;
  is_cap: boolean;
  penalty_seconds: number;
  is_published: boolean;
  notes: string | null;
  verified_at: string | null;
  team: { name: string; category_id: string } | null;
  workout: { name: string; score_type: string } | null;
}

interface HeatRow {
  id: string;
  heat_number: number;
  status: string;
  workout: { name: string } | null;
  category: { name: string } | null;
}

interface PuntuacionesClientProps {
  scores: ScoreRow[];
  heats: HeatRow[];
}

function formatScore(score: ScoreRow): string {
  const parts: string[] = [];

  if (score.time_ms != null) {
    const secs = score.time_ms / 1000;
    const minutes = Math.floor(secs / 60);
    const seconds = (secs % 60).toFixed(1);
    parts.push(`${minutes}:${seconds.padStart(4, "0")}`);
  }

  if (score.reps != null) parts.push(`${score.reps} reps`);
  if (score.weight_kg != null) parts.push(`${score.weight_kg} kg`);
  if (score.rounds != null) {
    parts.push(
      `${score.rounds}R${score.remaining_reps ? `+${score.remaining_reps}` : ""}`,
    );
  }

  return parts.join(" | ") || "Sin datos";
}

export function PuntuacionesClient({
  scores,
  heats,
}: PuntuacionesClientProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const finishedHeats = heats.filter((heat) => heat.status === "finished");
  const heatsWithScores = new Set(
    scores.filter((score) => score.heat_id).map((score) => score.heat_id),
  );
  const finalizableHeats = finishedHeats.filter(
    (heat) => !heatsWithScores.has(heat.id),
  );

  const scoresByHeat = new Map<string, ScoreRow[]>();
  for (const score of scores) {
    const key = score.heat_id ?? "manual";
    const group = scoresByHeat.get(key) ?? [];
    group.push(score);
    scoresByHeat.set(key, group);
  }

  async function handleFinalize(heatId: string) {
    setLoading(`finalize-${heatId}`);
    const result = await finalizeHeat(heatId);
    setLoading(null);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success("Borrador generado");
  }

  return (
    <>
      {finalizableHeats.length > 0 && (
        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-card p-4">
          <p className="mb-3 text-sm font-bold text-yellow-500">
            <Zap size={14} className="mr-1 inline" />
            Heats finalizados sin borrador
          </p>
          <div className="space-y-2">
            {finalizableHeats.map((heat) => (
              <div key={heat.id} className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground">
                  {(heat.workout as { name: string } | null)?.name} - Heat #
                  {heat.heat_number}
                  <span className="ml-2 text-muted-foreground">
                    ({(heat.category as { name: string } | null)?.name})
                  </span>
                </span>
                <Button
                  size="sm"
                  onClick={() => handleFinalize(heat.id)}
                  disabled={loading === `finalize-${heat.id}`}
                  className="bg-yellow-500 text-black hover:bg-yellow-500/90"
                >
                  <Zap size={14} className="mr-1" />
                  {loading === `finalize-${heat.id}` ? "Generando..." : "Generar"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {scores.length > 0 ? (
        <div className="space-y-6">
          {Array.from(scoresByHeat.entries()).map(([heatId, heatScores]) => {
            const heat = heats.find((candidate) => candidate.id === heatId);
            const allPublished = heatScores.every((score) => score.is_published);
            const allValidated = heatScores.every((score) => Boolean(score.verified_at));

            return (
              <div
                key={heatId}
                className="overflow-hidden rounded-xl border border-border"
              >
                <div className="flex items-center justify-between bg-muted/50 p-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {heat
                        ? `${(heat.workout as { name: string } | null)?.name} - Heat #${heat.heat_number}`
                        : "Scores manuales"}
                    </p>
                    {heat && (
                      <p className="text-xs text-muted-foreground">
                        {(heat.category as { name: string } | null)?.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        allPublished
                          ? "border-brand-green/30 text-brand-green"
                          : allValidated
                            ? "border-brand-cyan/30 text-brand-cyan"
                            : "border-orange-500/30 text-orange-500"
                      }
                    >
                      {allPublished
                        ? "Publicado"
                        : allValidated
                          ? "Validado"
                          : "Borrador"}
                    </Badge>
                    {heatId !== "manual" && (
                      <Link
                        href={`/admin/validacion/${heatId}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        <ShieldCheck size={14} className="mr-1" />
                        Revisar
                        <ArrowRight size={14} className="ml-1" />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {heatScores.map((score) => (
                    <div
                      key={score.id}
                      className="flex items-center justify-between gap-4 p-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {(score.team as { name: string } | null)?.name}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {formatScore(score)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {score.is_rx && (
                          <Badge
                            variant="outline"
                            className="border-brand-green/40 text-brand-green"
                          >
                            RX
                          </Badge>
                        )}
                        {score.is_cap && (
                          <Badge
                            variant="outline"
                            className="border-orange-500/40 text-orange-500"
                          >
                            CAP
                          </Badge>
                        )}
                        {score.points != null && (
                          <Badge
                            variant="outline"
                            className="border-brand-cyan/40 text-brand-cyan"
                          >
                            {score.points} pts
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            score.verified_at
                              ? "border-brand-cyan/40 text-brand-cyan"
                              : "text-muted-foreground"
                          }
                        >
                          {score.verified_at ? "Validado" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-8 text-center text-muted-foreground">
          No hay puntuaciones. Se generaran al finalizar heats.
        </p>
      )}
    </>
  );
}
