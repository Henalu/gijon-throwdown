"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Zap, Send, Pencil, Calculator, Eye, EyeOff } from "lucide-react";
import {
  finalizeHeat,
  updateScore,
  publishScores,
  unpublishScores,
  calculatePoints,
} from "@/lib/actions/scores";

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
  workouts: { id: string; name: string }[];
}

function formatScore(score: ScoreRow): string {
  const parts: string[] = [];
  if (score.time_ms != null) {
    const secs = score.time_ms / 1000;
    const m = Math.floor(secs / 60);
    const s = (secs % 60).toFixed(1);
    parts.push(`${m}:${s.padStart(4, "0")}`);
  }
  if (score.reps != null) parts.push(`${score.reps} reps`);
  if (score.weight_kg != null) parts.push(`${score.weight_kg} kg`);
  if (score.rounds != null) {
    parts.push(`${score.rounds}R${score.remaining_reps ? `+${score.remaining_reps}` : ""}`);
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
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateScore(score.id, formData);
    setLoading(false);
    if ("error" in result) toast.error(result.error);
    else {
      toast.success("Score actualizado");
      onDone();
    }
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
          <Input name="weight_kg" type="number" step="0.1" defaultValue={score.weight_kg ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Rondas</Label>
          <Input name="rounds" type="number" defaultValue={score.rounds ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Reps restantes</Label>
          <Input name="remaining_reps" type="number" defaultValue={score.remaining_reps ?? ""} />
        </div>
        <div className="space-y-2">
          <Label>Penalizacion (s)</Label>
          <Input name="penalty_seconds" type="number" defaultValue={score.penalty_seconds ?? 0} />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_rx" value="true" defaultChecked={score.is_rx} className="accent-brand-green" />
          RX
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_cap" value="true" defaultChecked={score.is_cap} className="accent-brand-green" />
          CAP
        </label>
      </div>
      <div className="space-y-2">
        <Label>Notas</Label>
        <Input name="notes" defaultValue={score.notes ?? ""} />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-brand-green text-black hover:bg-brand-green/90">
        {loading ? "Guardando..." : "Actualizar Score"}
      </Button>
    </form>
  );
}

export function PuntuacionesClient({
  scores,
  heats,
  workouts,
}: PuntuacionesClientProps) {
  const [editingScore, setEditingScore] = useState<ScoreRow | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const finishedHeats = heats.filter((h) => h.status === "finished");
  const heatsWithScores = new Set(scores.filter((s) => s.heat_id).map((s) => s.heat_id));
  const finalizableHeats = finishedHeats.filter((h) => !heatsWithScores.has(h.id));

  // Group scores by heat_id
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
    if ("error" in result) toast.error(result.error);
    else toast.success("Scores generados");
  }

  async function handlePublish(heatId: string) {
    setLoading(`publish-${heatId}`);
    const result = await publishScores(heatId);
    setLoading(null);
    if ("error" in result) toast.error(result.error);
    else toast.success("Scores publicados");
  }

  async function handleUnpublish(heatId: string) {
    setLoading(`unpublish-${heatId}`);
    const result = await unpublishScores(heatId);
    setLoading(null);
    if ("error" in result) toast.error(result.error);
    else toast.success("Scores despublicados");
  }

  async function handleCalculatePoints(workoutId: string) {
    setLoading(`points-${workoutId}`);
    const result = await calculatePoints(workoutId);
    setLoading(null);
    if ("error" in result) toast.error(result.error);
    else toast.success("Puntos calculados");
  }

  return (
    <>
      {/* Finalize pending heats */}
      {finalizableHeats.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-card border border-yellow-500/30">
          <p className="text-sm font-bold text-yellow-500 mb-3">
            <Zap size={14} className="inline mr-1" />
            Heats finalizados sin scores
          </p>
          <div className="space-y-2">
            {finalizableHeats.map((heat) => (
              <div key={heat.id} className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  {(heat.workout as unknown as { name: string } | null)?.name} - Heat #{heat.heat_number}
                  <span className="text-muted-foreground ml-2">
                    ({(heat.category as unknown as { name: string } | null)?.name})
                  </span>
                </span>
                <Button
                  size="sm"
                  onClick={() => handleFinalize(heat.id)}
                  disabled={loading === `finalize-${heat.id}`}
                  className="bg-yellow-500 text-black hover:bg-yellow-500/90"
                >
                  <Zap size={14} className="mr-1" />
                  {loading === `finalize-${heat.id}` ? "Generando..." : "Generar Scores"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculate points per workout */}
      {workouts.length > 0 && scores.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {workouts.map((w) => (
            <Button
              key={w.id}
              variant="outline"
              size="sm"
              onClick={() => handleCalculatePoints(w.id)}
              disabled={loading === `points-${w.id}`}
            >
              <Calculator size={14} className="mr-1" />
              Calcular puntos: {w.name}
            </Button>
          ))}
        </div>
      )}

      {/* Scores grouped by heat */}
      {scores.length > 0 ? (
        <div className="space-y-6">
          {Array.from(scoresByHeat.entries()).map(([heatId, heatScores]) => {
            const heat = heats.find((h) => h.id === heatId);
            const allPublished = heatScores.every((s) => s.is_published);
            const anyPublished = heatScores.some((s) => s.is_published);

            return (
              <div key={heatId} className="rounded-xl border border-border overflow-hidden">
                {/* Heat header */}
                <div className="flex items-center justify-between p-4 bg-muted/50">
                  <div>
                    <p className="font-bold text-foreground text-sm">
                      {heat
                        ? `${(heat.workout as unknown as { name: string } | null)?.name} - Heat #${heat.heat_number}`
                        : "Scores manuales"}
                    </p>
                    {heat && (
                      <p className="text-xs text-muted-foreground">
                        {(heat.category as unknown as { name: string } | null)?.name}
                      </p>
                    )}
                  </div>
                  {heatId !== "manual" && (
                    <div className="flex items-center gap-2">
                      {allPublished ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnpublish(heatId)}
                          disabled={!!loading}
                        >
                          <EyeOff size={14} className="mr-1" />
                          Despublicar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handlePublish(heatId)}
                          disabled={!!loading}
                          className="bg-brand-green text-black hover:bg-brand-green/90"
                        >
                          <Send size={14} className="mr-1" />
                          {anyPublished ? "Publicar todos" : "Publicar"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Score rows */}
                <div className="divide-y divide-border">
                  {heatScores.map((score) => (
                    <div
                      key={score.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-bold text-foreground text-sm">
                            {(score.team as unknown as { name: string } | null)?.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {formatScore(score)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {score.is_rx && (
                          <Badge variant="outline" className="text-xs border-brand-green/40 text-brand-green">
                            RX
                          </Badge>
                        )}
                        {score.is_cap && (
                          <Badge variant="outline" className="text-xs border-orange-500/40 text-orange-500">
                            CAP
                          </Badge>
                        )}
                        {score.points != null && (
                          <Badge variant="outline" className="text-xs border-brand-cyan/40 text-brand-cyan">
                            {score.points} pts
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            score.is_published
                              ? "border-brand-green/40 text-brand-green text-xs"
                              : "text-muted-foreground text-xs"
                          }
                        >
                          {score.is_published ? (
                            <>
                              <Eye size={10} className="mr-1" />
                              Pub
                            </>
                          ) : (
                            "Borrador"
                          )}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingScore(score)}
                        >
                          <Pencil size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          No hay puntuaciones. Se generaran al finalizar heats.
        </p>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingScore} onOpenChange={(open) => { if (!open) setEditingScore(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Editar Score - {(editingScore?.team as unknown as { name: string } | null)?.name}
            </DialogTitle>
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
