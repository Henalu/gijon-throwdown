"use client";

import { useState, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createTeam, updateTeam, deleteTeam } from "@/lib/actions/teams";
import type { Category, Team } from "@/types";

type TeamWithCategory = Team & {
  categories: { name: string } | null;
};

export function EquiposClient({
  teams,
  categories,
}: {
  teams: TeamWithCategory[];
  categories: Category[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamWithCategory | null>(null);
  const [filter, setFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "all") return teams;
    return teams.filter((t) => t.category_id === filter);
  }, [teams, filter]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(team: TeamWithCategory) {
    setEditing(team);
    setDialogOpen(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateTeam(editing.id, formData)
        : await createTeam(formData);

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(editing ? "Equipo actualizado" : "Equipo creado");
        setDialogOpen(false);
        setEditing(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Eliminar este equipo?")) return;
    startTransition(async () => {
      const result = await deleteTeam(id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Equipo eliminado");
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(v) => { if (v) setFilter(v); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filtered.length} equipos
          </span>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus data-icon="inline-start" />
          Nuevo equipo
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Box</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No hay equipos
              </TableCell>
            </TableRow>
          )}
          {filtered.map((team) => (
            <TableRow key={team.id}>
              <TableCell className="font-medium">{team.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {team.box_name ?? "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {team.city ?? "-"}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {team.categories?.name ?? "Sin categoria"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEdit(team)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(team.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar equipo" : "Nuevo equipo"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos del equipo"
                : "Rellena los datos para registrar un nuevo equipo"}
            </DialogDescription>
          </DialogHeader>
          <TeamForm
            team={editing}
            categories={categories}
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function TeamForm({
  team,
  categories,
  onSubmit,
  isPending,
}: {
  team: TeamWithCategory | null;
  categories: Category[];
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}) {
  const [categoryId, setCategoryId] = useState(team?.category_id ?? "");

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="category_id" value={categoryId} />

      <div className="space-y-1.5">
        <Label htmlFor="team-name">Nombre</Label>
        <Input
          id="team-name"
          name="name"
          defaultValue={team?.name ?? ""}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Categoria</Label>
        <Select value={categoryId} onValueChange={(v) => { if (v) setCategoryId(v); }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="team-box">Box</Label>
          <Input
            id="team-box"
            name="box_name"
            defaultValue={team?.box_name ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="team-city">Ciudad</Label>
          <Input
            id="team-city"
            name="city"
            defaultValue={team?.city ?? ""}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending || !categoryId}>
          {isPending ? "Guardando..." : team ? "Actualizar" : "Crear"}
        </Button>
      </DialogFooter>
    </form>
  );
}
