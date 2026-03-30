"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createWorkout,
  updateWorkout,
  deleteWorkout,
  toggleWorkoutVisibility,
} from "@/lib/actions/wods";
import type { Workout, WodType, ScoreType } from "@/types";

const WOD_TYPES: { value: WodType; label: string }[] = [
  { value: "for_time", label: "For Time" },
  { value: "amrap", label: "AMRAP" },
  { value: "emom", label: "EMOM" },
  { value: "max_weight", label: "Max Weight" },
  { value: "chipper", label: "Chipper" },
  { value: "custom", label: "Custom" },
];

const SCORE_TYPES: { value: ScoreType; label: string }[] = [
  { value: "time", label: "Tiempo" },
  { value: "reps", label: "Repeticiones" },
  { value: "weight", label: "Peso" },
  { value: "rounds_reps", label: "Rondas + Reps" },
  { value: "points", label: "Puntos" },
];

function formatTimeCap(seconds: number | null): string {
  if (!seconds) return "-";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}:${String(sec).padStart(2, "0")}` : `${min} min`;
}

export function WodsClient({ workouts }: { workouts: Workout[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Workout | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(wod: Workout) {
    setEditing(wod);
    setDialogOpen(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateWorkout(editing.id, formData)
        : await createWorkout(formData);

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(editing ? "WOD actualizado" : "WOD creado");
        setDialogOpen(false);
        setEditing(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Eliminar este WOD?")) return;
    startTransition(async () => {
      const result = await deleteWorkout(id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("WOD eliminado");
      }
    });
  }

  function handleToggleVisibility(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleWorkoutVisibility(id, !current);
      if ("error" in result) {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          {workouts.length} workouts
        </span>
        <Button onClick={openCreate} size="sm" className="w-full sm:w-auto">
          <Plus data-icon="inline-start" />
          Nuevo WOD
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {workouts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
            No hay workouts
          </div>
        ) : (
          workouts.map((wod) => (
            <div
              key={wod.id}
              className="rounded-2xl border border-border/60 bg-card/80 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <p className="text-base font-semibold text-foreground break-words">
                    {wod.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{wod.wod_type}</Badge>
                    <Badge variant="secondary">{wod.score_type}</Badge>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEdit(wod)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(wod.id)}
                    disabled={isPending}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Time cap
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {formatTimeCap(wod.time_cap_seconds)}
                  </p>
                </div>
                <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Visible
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {wod.is_visible ? "Publicado" : "Oculto"}
                    </p>
                  </div>
                  <Switch
                    checked={wod.is_visible}
                    onCheckedChange={() =>
                      handleToggleVisibility(wod.id, wod.is_visible)
                    }
                    size="sm"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Time Cap</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workouts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No hay workouts
                </TableCell>
              </TableRow>
            )}
            {workouts.map((wod) => (
              <TableRow key={wod.id}>
                <TableCell className="font-medium">{wod.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{wod.wod_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{wod.score_type}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTimeCap(wod.time_cap_seconds)}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={wod.is_visible}
                    onCheckedChange={() =>
                      handleToggleVisibility(wod.id, wod.is_visible)
                    }
                    size="sm"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEdit(wod)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(wod.id)}
                      disabled={isPending}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar WOD" : "Nuevo WOD"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos del workout"
                : "Define un nuevo workout para la competicion"}
            </DialogDescription>
          </DialogHeader>
          <WodForm
            workout={editing}
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function WodForm({
  workout,
  onSubmit,
  isPending,
}: {
  workout: Workout | null;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}) {
  const [wodType, setWodType] = useState<string>(workout?.wod_type ?? "for_time");
  const [scoreType, setScoreType] = useState<string>(
    workout?.score_type ?? "time"
  );
  const [isVisible, setIsVisible] = useState(workout?.is_visible ?? true);
  const [higherIsBetter, setHigherIsBetter] = useState(
    workout?.higher_is_better ?? false
  );

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="wod_type" value={wodType} />
      <input type="hidden" name="score_type" value={scoreType} />
      <input type="hidden" name="is_visible" value={isVisible ? "true" : "false"} />
      <input
        type="hidden"
        name="higher_is_better"
        value={higherIsBetter ? "true" : "false"}
      />

      <div className="space-y-1.5">
        <Label htmlFor="wod-name">Nombre</Label>
        <Input
          id="wod-name"
          name="name"
          defaultValue={workout?.name ?? ""}
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Tipo de WOD</Label>
          <Select value={wodType} onValueChange={(v) => { if (v) setWodType(v); }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WOD_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de score</Label>
          <Select value={scoreType} onValueChange={(v) => { if (v) setScoreType(v); }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCORE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wod-timecap">Time Cap (segundos)</Label>
        <Input
          id="wod-timecap"
          name="time_cap_seconds"
          type="number"
          min={0}
          defaultValue={workout?.time_cap_seconds ?? ""}
          placeholder="Ej: 720 para 12 minutos"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wod-desc">Descripcion</Label>
        <Textarea
          id="wod-desc"
          name="description"
          defaultValue={workout?.description ?? ""}
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wod-standards">Standards</Label>
        <Textarea
          id="wod-standards"
          name="standards"
          defaultValue={workout?.standards ?? ""}
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-2">
          <Switch checked={isVisible} onCheckedChange={setIsVisible} size="sm" />
          <Label>Visible</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={higherIsBetter}
            onCheckedChange={setHigherIsBetter}
            size="sm"
          />
          <Label>Mayor es mejor</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : workout ? "Actualizar" : "Crear"}
        </Button>
      </DialogFooter>
    </form>
  );
}
