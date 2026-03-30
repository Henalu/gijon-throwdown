"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calculator,
  Eye,
  EyeOff,
  Pencil,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  calculatePoints,
  finalizeHeat,
  publishScores,
  unpublishScores,
  updateScore,
  validateHeat,
} from "@/lib/actions/scores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  verified_by: string | null;
  verified_at: string | null;
  team: { name: string; category_id: string } | null;
  workout: { name: string; score_type: string } | null;
}

interface LiveSummaryRow {
  lane_id: string;
  lane_number: number;
  team_name: string;
  cumulative: number;
  last_update_type: string;
  is_finished: boolean;
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

function ScoreEditForm({
  score,
  onDone,
}: {
  score: ScoreRow;
  onDone: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await updateScore(score.id, formData);

    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success("Score actualizado");
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Tiempo (ms)</Label>
          <Input name="time_ms" type="number" defaultValue={score.time_ms ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Reps</Label>
          <Input name="reps" type="number" defaultValue={score.reps ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Peso (kg)</Label>
          <Input
            name="weight_kg"
            type="number"
            step="0.1"
            defaultValue={score.weight_kg ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label>Rondas</Label>
          <Input name="rounds" type="number" defaultValue={score.rounds ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Reps restantes</Label>
          <Input
            name="remaining_reps"
            type="number"
            defaultValue={score.remaining_reps ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label>Penalizacion (s)</Label>
          <Input
            name="penalty_seconds"
            type="number"
            defaultValue={score.penalty_seconds ?? 0}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_rx"
            value="true"
            defaultChecked={score.is_rx}
            className="accent-brand-green"
          />
          RX
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_cap"
            value="true"
            defaultChecked={score.is_cap}
            className="accent-brand-green"
          />
          CAP
        </label>
      </div>

      <div className="space-y-2">
        <Label>Notas</Label>
        <Input name="notes" defaultValue={score.notes ?? ""} />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-green text-black hover:bg-brand-green/90"
      >
        {loading ? "Guardando..." : "Guardar correcciones"}
      </Button>
    </form>
  );
}

export function ValidationDetailClient({
  heat,
  scores,
  liveSummary,
}: {
  heat: {
    id: string;
    heat_number: number;
    status: string;
    scheduled_at: string | null;
    started_at: string | null;
    finished_at: string | null;
    category_name: string;
    workout_id: string;
    workout_name: string;
  };
  scores: ScoreRow[];
  liveSummary: LiveSummaryRow[];
}) {
  const router = useRouter();
  const [editingScore, setEditingScore] = useState<ScoreRow | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const allValidated =
    scores.length > 0 && scores.every((score) => Boolean(score.verified_at));
  const allPublished = scores.length > 0 && scores.every((score) => score.is_published);

  async function runAction(
    key: string,
    action: () => Promise<{ error: string } | { success: true }>,
    successMessage: string,
  ) {
    setLoadingAction(key);
    const result = await action();
    setLoadingAction(null);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(successMessage);
    router.refresh();
  }

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-4">
          <Link
            href="/admin/validacion"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Volver a la cola de validacion
          </Link>

          <div className="rounded-[1.75rem] border border-border/60 bg-card/80 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-green/80">
                  Validacion oficial
                </p>
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  {heat.workout_name} - Heat #{heat.heat_number}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {heat.category_name} ·{" "}
                  {heat.scheduled_at
                    ? new Date(heat.scheduled_at).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Sin hora programada"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {scores.length === 0 && heat.status === "finished" && (
                  <Button
                    onClick={() =>
                      runAction(
                        "finalize",
                        () => finalizeHeat(heat.id),
                        "Borrador generado",
                      )
                    }
                    disabled={loadingAction === "finalize"}
                    className="bg-yellow-500 text-black hover:bg-yellow-500/90"
                  >
                    <Zap data-icon="inline-start" />
                    {loadingAction === "finalize" ? "Generando..." : "Generar borrador"}
                  </Button>
                )}

                {scores.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() =>
                        runAction(
                          "validate",
                          () => validateHeat(heat.id),
                          "Heat validado",
                        )
                      }
                      disabled={loadingAction === "validate"}
                    >
                      <ShieldCheck data-icon="inline-start" />
                      {loadingAction === "validate" ? "Validando..." : "Validar heat"}
                    </Button>

                    {allPublished ? (
                      <Button
                        variant="outline"
                        onClick={() =>
                          runAction(
                            "unpublish",
                            () => unpublishScores(heat.id),
                            "Scores despublicados",
                          )
                        }
                        disabled={loadingAction === "unpublish"}
                      >
                        <EyeOff data-icon="inline-start" />
                        Despublicar
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          runAction(
                            "publish",
                            () => publishScores(heat.id),
                            "Scores publicados",
                          )
                        }
                        disabled={loadingAction === "publish" || !allValidated}
                        className="bg-brand-green text-black hover:bg-brand-green/90"
                      >
                        <Eye data-icon="inline-start" />
                        Publicar
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={() =>
                        runAction(
                          "points",
                          () => calculatePoints(heat.workout_id),
                          "Puntos recalculados",
                        )
                      }
                      disabled={loadingAction === "points" || !allPublished}
                    >
                      <Calculator data-icon="inline-start" />
                      Calcular puntos
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={
                  allPublished
                    ? "border-brand-green/30 text-brand-green"
                    : "text-muted-foreground"
                }
              >
                {allPublished ? "Publicado" : "Sin publicar"}
              </Badge>
              <Badge
                variant="outline"
                className={
                  allValidated
                    ? "border-brand-cyan/30 text-brand-cyan"
                    : "text-muted-foreground"
                }
              >
                {allValidated ? "Validado" : "Pendiente de validacion"}
              </Badge>
            </div>
          </div>
        </div>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Resumen provisional live
            </h2>
            <p className="text-sm text-muted-foreground">
              Vista de apoyo basada en las ultimas entradas recibidas por lane.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {liveSummary.map((lane) => (
              <div
                key={lane.lane_id}
                className="rounded-2xl border border-border/60 bg-card/80 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    Lane {lane.lane_number}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {lane.is_finished ? "Finalizado" : "En curso"}
                  </Badge>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">
                  {lane.team_name}
                </p>
                <p className="mt-4 text-4xl font-black tabular-nums text-foreground">
                  {lane.cumulative}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {lane.last_update_type.replaceAll("_", " ")}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Scores oficiales
            </h2>
            <p className="text-sm text-muted-foreground">
              Corrige aqui lo necesario antes de validar y publicar.
            </p>
          </div>

          {scores.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80">
              <div className="divide-y divide-border">
                {scores.map((score) => (
                  <div
                    key={score.id}
                    className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {score.team?.name}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {formatScore(score)}
                      </p>
                      {score.notes && (
                        <p className="text-xs text-muted-foreground">
                          Nota: {score.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {score.is_rx && (
                        <Badge
                          variant="outline"
                          className="border-brand-green/30 text-brand-green"
                        >
                          RX
                        </Badge>
                      )}
                      {score.is_cap && (
                        <Badge
                          variant="outline"
                          className="border-orange-500/30 text-orange-500"
                        >
                          CAP
                        </Badge>
                      )}
                      {score.points != null && (
                        <Badge
                          variant="outline"
                          className="border-brand-cyan/30 text-brand-cyan"
                        >
                          {score.points} pts
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={
                          score.verified_at
                            ? "border-brand-cyan/30 text-brand-cyan"
                            : "text-muted-foreground"
                        }
                      >
                        {score.verified_at ? "Validado" : "Borrador"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          score.is_published
                            ? "border-brand-green/30 text-brand-green"
                            : "text-muted-foreground"
                        }
                      >
                        {score.is_published ? "Publicado" : "Oculto"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingScore(score)}
                      >
                        <Pencil data-icon="inline-start" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Todavia no existe borrador oficial para este heat.
              </p>
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={editingScore !== null}
        onOpenChange={(open) => {
          if (!open) setEditingScore(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar score - {editingScore?.team?.name}</DialogTitle>
          </DialogHeader>
          {editingScore && (
            <ScoreEditForm
              score={editingScore}
              onDone={() => setEditingScore(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
