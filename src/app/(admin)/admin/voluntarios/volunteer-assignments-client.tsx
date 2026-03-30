"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createVolunteerAssignment,
  deleteVolunteerAssignment,
  updateVolunteerAssignment,
} from "@/lib/actions/volunteer-assignments";
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

export interface AssignmentOptionVolunteer {
  id: string;
  full_name: string;
  email: string;
}

export interface AssignmentOptionLane {
  id: string;
  heat_id: string;
  lane_number: number;
  team_name: string | null;
}

export interface AssignmentOptionHeat {
  id: string;
  heat_number: number;
  status: string;
  is_live_entry_enabled: boolean;
  category_name: string | null;
  workout_name: string | null;
  lanes: AssignmentOptionLane[];
}

export interface VolunteerAssignmentRow {
  id: string;
  volunteer_id: string;
  heat_id: string;
  lane_id: string | null;
  notes: string | null;
  volunteer_name: string | null;
  volunteer_email: string | null;
  heat_number: number | null;
  heat_status: string | null;
  heat_live_enabled: boolean;
  category_name: string | null;
  workout_name: string | null;
  lane_number: number | null;
  team_name: string | null;
}

function getHeatLabel(heat: AssignmentOptionHeat) {
  return `${heat.workout_name ?? "WOD"} | Heat ${heat.heat_number} | ${heat.category_name ?? "Sin categoria"}`;
}

export function VolunteerAssignmentsClient({
  assignments,
  volunteers,
  heats,
}: {
  assignments: VolunteerAssignmentRow[];
  volunteers: AssignmentOptionVolunteer[];
  heats: AssignmentOptionHeat[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<VolunteerAssignmentRow | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const totalLiveReady = useMemo(
    () => heats.filter((heat) => heat.is_live_entry_enabled).length,
    [heats],
  );

  function openCreate() {
    setEditingAssignment(null);
    setDialogOpen(true);
  }

  function openEdit(assignment: VolunteerAssignmentRow) {
    setEditingAssignment(assignment);
    setDialogOpen(true);
  }

  function handleDelete(assignment: VolunteerAssignmentRow) {
    if (!confirm("Eliminar esta asignacion?")) return;
    startTransition(async () => {
      const result = await deleteVolunteerAssignment({
        id: assignment.id,
        heatId: assignment.heat_id,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Asignacion eliminada");
      router.refresh();
    });
  }

  function handleSubmit(payload: {
    volunteerId: string;
    heatId: string;
    laneId?: string;
    notes?: string;
  }) {
    startTransition(async () => {
      const result = editingAssignment
        ? await updateVolunteerAssignment({ id: editingAssignment.id, ...payload })
        : await createVolunteerAssignment(payload);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(editingAssignment ? "Asignacion actualizada" : "Asignacion creada");
      setDialogOpen(false);
      setEditingAssignment(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          {assignments.length} asignaciones | {totalLiveReady} heats abiertos para live
        </span>
        <Button onClick={openCreate} size="sm">
          <Plus data-icon="inline-start" />
          Nueva asignacion
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
            No hay asignaciones todavia.
          </div>
        ) : (
          assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-2xl border border-border/60 bg-card/80 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground break-words">
                    {assignment.volunteer_name ?? "Sin voluntario"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground break-all">
                    {assignment.volunteer_email ?? ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(assignment)}>
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(assignment)}
                    disabled={isPending}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Heat
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground break-words">
                    {assignment.workout_name ?? "WOD"} | Heat {assignment.heat_number ?? "-"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground break-words">
                    {assignment.category_name ?? "Sin categoria"} |{" "}
                    {assignment.heat_live_enabled ? "Live habilitado" : "Live cerrado"}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Calle
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground break-words">
                      {assignment.lane_number
                        ? `Lane ${assignment.lane_number}${assignment.team_name ? ` | ${assignment.team_name}` : ""}`
                        : "Sin calle"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Notas
                    </p>
                    <p className="mt-1 text-sm text-foreground break-words">
                      {assignment.notes ?? "-"}
                    </p>
                  </div>
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
              <TableHead>Voluntario</TableHead>
              <TableHead>Heat</TableHead>
              <TableHead>Calle</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay asignaciones todavia.
                </TableCell>
              </TableRow>
            )}
            {assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">
                      {assignment.volunteer_name ?? "Sin voluntario"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.volunteer_email ?? ""}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">
                      {assignment.workout_name ?? "WOD"} | Heat {assignment.heat_number ?? "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.category_name ?? "Sin categoria"} |{" "}
                      {assignment.heat_live_enabled ? "Live habilitado" : "Live cerrado"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {assignment.lane_number
                    ? `Lane ${assignment.lane_number}${assignment.team_name ? ` | ${assignment.team_name}` : ""}`
                    : "Sin calle"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {assignment.notes ?? "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => openEdit(assignment)}>
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(assignment)}
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
            <DialogTitle>
              {editingAssignment ? "Editar asignacion" : "Nueva asignacion"}
            </DialogTitle>
            <DialogDescription>
              Enlaza voluntarios con heats y, si hace falta, con una calle concreta.
            </DialogDescription>
          </DialogHeader>
          <AssignmentForm
            assignment={editingAssignment}
            heats={heats}
            volunteers={volunteers}
            isPending={isPending}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function AssignmentForm({
  assignment,
  heats,
  volunteers,
  isPending,
  onSubmit,
}: {
  assignment: VolunteerAssignmentRow | null;
  heats: AssignmentOptionHeat[];
  volunteers: AssignmentOptionVolunteer[];
  isPending: boolean;
  onSubmit: (payload: {
    volunteerId: string;
    heatId: string;
    laneId?: string;
    notes?: string;
  }) => void;
}) {
  const [volunteerId, setVolunteerId] = useState<string>(
    assignment?.volunteer_id ?? "",
  );
  const [heatId, setHeatId] = useState<string>(assignment?.heat_id ?? "");
  const [laneId, setLaneId] = useState<string>(assignment?.lane_id ?? "none");

  const selectedHeat = heats.find((heat) => heat.id === heatId);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSubmit({
          volunteerId,
          heatId,
          laneId: laneId === "none" ? "" : laneId,
          notes: String(formData.get("notes") ?? ""),
        });
      }}
    >
      <div className="space-y-1.5">
        <Label>Voluntario</Label>
        <Select value={volunteerId} onValueChange={(value) => value && setVolunteerId(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona voluntario" />
          </SelectTrigger>
          <SelectContent>
            {volunteers.map((volunteer) => (
              <SelectItem key={volunteer.id} value={volunteer.id}>
                {volunteer.full_name} | {volunteer.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Heat</Label>
        <Select value={heatId} onValueChange={(value) => value && setHeatId(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona heat" />
          </SelectTrigger>
          <SelectContent>
            {heats.map((heat) => (
              <SelectItem key={heat.id} value={heat.id}>
                {getHeatLabel(heat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Calle</Label>
        <Select
          value={laneId}
          onValueChange={(value) => setLaneId(value ?? "none")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Opcional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin calle concreta</SelectItem>
            {(selectedHeat?.lanes ?? []).map((lane) => (
              <SelectItem key={lane.id} value={lane.id}>
                Lane {lane.lane_number}
                {lane.team_name ? ` | ${lane.team_name}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="assignment-notes">Notas</Label>
        <Input
          id="assignment-notes"
          name="notes"
          defaultValue={assignment?.notes ?? ""}
          placeholder="Observaciones operativas"
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending || !volunteerId || !heatId}>
          {isPending
            ? "Guardando..."
            : assignment
              ? "Actualizar asignacion"
              : "Crear asignacion"}
        </Button>
      </DialogFooter>
    </form>
  );
}
