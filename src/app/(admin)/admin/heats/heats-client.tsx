"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Play, Square, CheckCircle2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createHeat,
  updateHeatStatus,
  deleteHeat,
  assignLane,
  removeLane,
} from "@/lib/actions/heats";
import type { Category, Workout, HeatStatus } from "@/types";
import type { HeatRow } from "./page";

const STATUS_STYLES: Record<HeatStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  finished: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<HeatStatus, string> = {
  pending: "Pendiente",
  active: "En curso",
  finished: "Finalizado",
};

function formatSchedule(dt: string | null): string {
  if (!dt) return "-";
  return new Date(dt).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HeatsClient({
  heats,
  categories,
  workouts,
  teams,
}: {
  heats: HeatRow[];
  categories: Category[];
  workouts: Workout[];
  teams: { id: string; name: string; category_id: string }[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [laneDialogHeat, setLaneDialogHeat] = useState<HeatRow | null>(null);
  const [isPending, startTransition] = useTransition();

  // Group heats by workout
  const grouped = workouts
    .map((w) => ({
      workout: w,
      heats: heats.filter((h) => h.workout_id === w.id),
    }))
    .filter((g) => g.heats.length > 0);

  // Any heats for workouts that don't exist in workouts list
  const orphanHeats = heats.filter(
    (h) => !workouts.some((w) => w.id === h.workout_id)
  );

  function handleCreateHeat(formData: FormData) {
    startTransition(async () => {
      const result = await createHeat(formData);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Heat creado");
        setCreateOpen(false);
      }
    });
  }

  function handleStatusChange(id: string, status: HeatStatus) {
    startTransition(async () => {
      const result = await updateHeatStatus(id, status);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Heat marcado como ${STATUS_LABELS[status].toLowerCase()}`);
      }
    });
  }

  function handleDeleteHeat(id: string) {
    if (!confirm("Eliminar este heat?")) return;
    startTransition(async () => {
      const result = await deleteHeat(id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Heat eliminado");
      }
    });
  }

  function handleAssignLane(formData: FormData) {
    startTransition(async () => {
      const result = await assignLane(formData);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Lane asignado");
      }
    });
  }

  function handleRemoveLane(id: string) {
    startTransition(async () => {
      const result = await removeLane(id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Lane eliminado");
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {heats.length} heats
        </span>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus data-icon="inline-start" />
          Nuevo heat
        </Button>
      </div>

      {grouped.length === 0 && orphanHeats.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No hay heats todavia. Crea uno para empezar.
        </p>
      )}

      <div className="space-y-8">
        {grouped.map(({ workout, heats: wHeats }) => (
          <div key={workout.id}>
            <h2 className="text-lg font-semibold mb-3">{workout.name}</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {wHeats.map((heat) => (
                <HeatCard
                  key={heat.id}
                  heat={heat}
                  isPending={isPending}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteHeat}
                  onOpenLaneDialog={setLaneDialogHeat}
                  onRemoveLane={handleRemoveLane}
                />
              ))}
            </div>
          </div>
        ))}

        {orphanHeats.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Otros</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {orphanHeats.map((heat) => (
                <HeatCard
                  key={heat.id}
                  heat={heat}
                  isPending={isPending}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteHeat}
                  onOpenLaneDialog={setLaneDialogHeat}
                  onRemoveLane={handleRemoveLane}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Heat Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo heat</DialogTitle>
            <DialogDescription>
              Crea una nueva serie para un workout
            </DialogDescription>
          </DialogHeader>
          <CreateHeatForm
            categories={categories}
            workouts={workouts}
            onSubmit={handleCreateHeat}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Assign Lane Dialog */}
      <Dialog
        open={laneDialogHeat !== null}
        onOpenChange={(open) => {
          if (!open) setLaneDialogHeat(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Asignar lane</DialogTitle>
            <DialogDescription>
              Heat #{laneDialogHeat?.heat_number} -{" "}
              {laneDialogHeat?.workouts?.name}
            </DialogDescription>
          </DialogHeader>
          {laneDialogHeat && (
            <AssignLaneForm
              heat={laneDialogHeat}
              teams={teams}
              onSubmit={handleAssignLane}
              isPending={isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function HeatCard({
  heat,
  isPending,
  onStatusChange,
  onDelete,
  onOpenLaneDialog,
  onRemoveLane,
}: {
  heat: HeatRow;
  isPending: boolean;
  onStatusChange: (id: string, status: HeatStatus) => void;
  onDelete: (id: string) => void;
  onOpenLaneDialog: (heat: HeatRow) => void;
  onRemoveLane: (id: string) => void;
}) {
  const status = heat.status as HeatStatus;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Heat #{heat.heat_number}
          </CardTitle>
          <Badge className={STATUS_STYLES[status]}>
            {STATUS_LABELS[status]}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{heat.categories?.name ?? "Sin cat."}</span>
          <span>-</span>
          <span>{formatSchedule(heat.scheduled_at)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Lanes */}
        <div className="space-y-1">
          {heat.lanes.length === 0 && (
            <p className="text-xs text-muted-foreground">Sin lanes asignados</p>
          )}
          {heat.lanes
            .sort((a, b) => a.lane_number - b.lane_number)
            .map((lane) => (
              <div
                key={lane.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  <span className="text-muted-foreground mr-2">
                    L{lane.lane_number}
                  </span>
                  {lane.teams?.name ?? "Sin equipo"}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onRemoveLane(lane.id)}
                  disabled={isPending}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-border">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onOpenLaneDialog(heat)}
            disabled={isPending}
          >
            <UserPlus data-icon="inline-start" />
            Lane
          </Button>
          {status === "pending" && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onStatusChange(heat.id, "active")}
              disabled={isPending}
              className="text-green-500"
            >
              <Play data-icon="inline-start" />
              Iniciar
            </Button>
          )}
          {status === "active" && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onStatusChange(heat.id, "finished")}
              disabled={isPending}
            >
              <CheckCircle2 data-icon="inline-start" />
              Finalizar
            </Button>
          )}
          {status === "finished" && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onStatusChange(heat.id, "pending")}
              disabled={isPending}
            >
              <Square data-icon="inline-start" />
              Reset
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onDelete(heat.id)}
            disabled={isPending}
            className="text-destructive ml-auto"
          >
            <Trash2 data-icon="inline-start" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateHeatForm({
  categories,
  workouts,
  onSubmit,
  isPending,
}: {
  categories: Category[];
  workouts: Workout[];
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [workoutId, setWorkoutId] = useState("");

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="workout_id" value={workoutId} />

      <div className="space-y-1.5">
        <Label>Categoria</Label>
        <Select value={categoryId} onValueChange={(v) => { if (v) setCategoryId(v); }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Workout</Label>
        <Select value={workoutId} onValueChange={(v) => { if (v) setWorkoutId(v); }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona workout" />
          </SelectTrigger>
          <SelectContent>
            {workouts.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="heat-number">Numero de heat</Label>
        <Input
          id="heat-number"
          name="heat_number"
          type="number"
          min={1}
          defaultValue={1}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="heat-schedule">Hora programada</Label>
        <Input
          id="heat-schedule"
          name="scheduled_at"
          type="datetime-local"
        />
      </div>

      <DialogFooter>
        <Button
          type="submit"
          disabled={isPending || !categoryId || !workoutId}
        >
          {isPending ? "Creando..." : "Crear"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function AssignLaneForm({
  heat,
  teams,
  onSubmit,
  isPending,
}: {
  heat: HeatRow;
  teams: { id: string; name: string; category_id: string }[];
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}) {
  const [teamId, setTeamId] = useState("");

  // Filter teams by same category, exclude already assigned
  const assignedTeamIds = new Set(heat.lanes.map((l) => l.team_id));
  const availableTeams = teams.filter(
    (t) => t.category_id === heat.category_id && !assignedTeamIds.has(t.id)
  );

  const nextLane =
    heat.lanes.length > 0
      ? Math.max(...heat.lanes.map((l) => l.lane_number)) + 1
      : 1;

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="heat_id" value={heat.id} />
      <input type="hidden" name="team_id" value={teamId} />

      <div className="space-y-1.5">
        <Label>Equipo</Label>
        <Select value={teamId} onValueChange={(v) => { if (v) setTeamId(v); }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona equipo" />
          </SelectTrigger>
          <SelectContent>
            {availableTeams.length === 0 && (
              <SelectItem value="_none" disabled>
                No hay equipos disponibles
              </SelectItem>
            )}
            {availableTeams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lane-number">Numero de lane</Label>
        <Input
          id="lane-number"
          name="lane_number"
          type="number"
          min={1}
          defaultValue={nextLane}
          required
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending || !teamId}>
          {isPending ? "Asignando..." : "Asignar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
