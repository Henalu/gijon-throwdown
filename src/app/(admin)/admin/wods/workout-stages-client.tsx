"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createWorkoutStage, deleteWorkoutStage, updateWorkoutStage } from "@/lib/actions/workout-stages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { Workout, WorkoutStage } from "@/types";

export type WorkoutStageRow = WorkoutStage & {
  workoutName: string | null;
};

export function WorkoutStagesClient({
  stages,
  workouts,
}: {
  stages: WorkoutStageRow[];
  workouts: Workout[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<WorkoutStageRow | null>(null);
  const [workoutFilter, setWorkoutFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filteredStages = useMemo(() => {
    if (workoutFilter === "all") return stages;
    return stages.filter((stage) => stage.workout_id === workoutFilter);
  }, [stages, workoutFilter]);

  const selectedWorkoutName = useMemo(() => {
    if (workoutFilter === "all") return null;
    return workouts.find((workout) => workout.id === workoutFilter)?.name ?? null;
  }, [workoutFilter, workouts]);

  const summaryLabel = selectedWorkoutName
    ? `${filteredStages.length} de ${stages.length} stages en ${selectedWorkoutName}`
    : `${stages.length} stages`;

  const emptyMessage =
    stages.length === 0
      ? "No hay stages definidos."
      : selectedWorkoutName
        ? `No hay stages para ${selectedWorkoutName}.`
        : "No hay stages para este WOD.";

  function openCreate() {
    setEditingStage(null);
    setDialogOpen(true);
  }

  function openEdit(stage: WorkoutStageRow) {
    setEditingStage(stage);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm("Eliminar este stage?")) return;
    startTransition(async () => {
      const result = await deleteWorkoutStage(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Stage eliminado");
      router.refresh();
    });
  }

  function handleSubmit(payload: {
    workoutId: string;
    name: string;
    description?: string;
    targetValue?: number | null;
    unit: string;
    sortOrder?: number;
  }) {
    startTransition(async () => {
      const result = editingStage
        ? await updateWorkoutStage({ id: editingStage.id, ...payload })
        : await createWorkoutStage(payload);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(editingStage ? "Stage actualizado" : "Stage creado");
      setDialogOpen(false);
      setEditingStage(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="stage-workout-filter">Filtrar por WOD</Label>
            <Select
              value={workoutFilter}
              onValueChange={(value) => {
                if (value) setWorkoutFilter(value);
              }}
            >
              <SelectTrigger id="stage-workout-filter" className="w-full sm:w-72">
                <SelectValue>
                  {(value) =>
                    value === "all"
                      ? "Todos los WODs"
                      : workouts.find((workout) => workout.id === value)?.name ??
                        "Todos los WODs"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los WODs</SelectItem>
                {workouts.map((workout) => (
                  <SelectItem key={workout.id} value={workout.id}>
                    {workout.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">{summaryLabel}</span>
        </div>
        <Button onClick={openCreate} size="sm" className="w-full sm:w-auto">
          <Plus data-icon="inline-start" />
          Nuevo stage
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {filteredStages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          filteredStages.map((stage) => (
            <div
              key={stage.id}
              className="rounded-2xl border border-border/60 bg-card/80 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {stage.workoutName ?? "-"}
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground break-words">
                    {stage.name}
                  </p>
                  {stage.description && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground break-words">
                      {stage.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(stage)}>
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(stage.id)}
                    disabled={isPending}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Unidad
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {stage.unit}
                  </p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Objetivo
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {stage.target_value ?? "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Orden
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {stage.sort_order}
                  </p>
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
              <TableHead>WOD</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStages.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {filteredStages.map((stage) => (
              <TableRow key={stage.id}>
                <TableCell>{stage.workoutName ?? "-"}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{stage.name}</p>
                    {stage.description && (
                      <p className="text-xs text-muted-foreground">{stage.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{stage.unit}</TableCell>
                <TableCell>{stage.target_value ?? "-"}</TableCell>
                <TableCell>{stage.sort_order}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => openEdit(stage)}>
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(stage.id)}
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
            <DialogTitle>{editingStage ? "Editar stage" : "Nuevo stage"}</DialogTitle>
            <DialogDescription>
              Define o ajusta las etapas de un WOD para live y detalle publico.
            </DialogDescription>
          </DialogHeader>
          <WorkoutStageForm
            stage={editingStage}
            workouts={workouts}
            isPending={isPending}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function WorkoutStageForm({
  stage,
  workouts,
  isPending,
  onSubmit,
}: {
  stage: WorkoutStageRow | null;
  workouts: Workout[];
  isPending: boolean;
  onSubmit: (payload: {
    workoutId: string;
    name: string;
    description?: string;
    targetValue?: number | null;
    unit: string;
    sortOrder?: number;
  }) => void;
}) {
  const [workoutId, setWorkoutId] = useState(stage?.workout_id ?? "");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSubmit({
          workoutId,
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
          targetValue: formData.get("target_value")
            ? Number(formData.get("target_value"))
            : null,
          unit: String(formData.get("unit") ?? ""),
          sortOrder: Number(formData.get("sort_order") ?? 0),
        });
      }}
    >
      <div className="space-y-1.5">
        <Label>WOD</Label>
        <Select value={workoutId} onValueChange={(value) => value && setWorkoutId(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona WOD">
              {(value) =>
                workouts.find((workout) => workout.id === value)?.name ??
                "Selecciona WOD"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false}>
            {workouts.map((workout) => (
              <SelectItem key={workout.id} value={workout.id}>
                {workout.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="stage-name">Nombre</Label>
        <Input id="stage-name" name="name" defaultValue={stage?.name ?? ""} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="stage-description">Descripcion</Label>
        <Textarea
          id="stage-description"
          name="description"
          defaultValue={stage?.description ?? ""}
          rows={3}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="stage-target">Objetivo</Label>
          <Input
            id="stage-target"
            name="target_value"
            type="number"
            defaultValue={stage?.target_value ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stage-unit">Unidad</Label>
          <Input id="stage-unit" name="unit" defaultValue={stage?.unit ?? ""} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stage-order">Orden</Label>
          <Input
            id="stage-order"
            name="sort_order"
            type="number"
            min={0}
            defaultValue={stage?.sort_order ?? 0}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending || !workoutId}>
          {isPending ? "Guardando..." : stage ? "Actualizar stage" : "Crear stage"}
        </Button>
      </DialogFooter>
    </form>
  );
}
