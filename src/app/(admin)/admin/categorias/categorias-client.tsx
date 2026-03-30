"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/categories";
import type { Category } from "@/types";

export function CategoriasClient({
  categories,
}: {
  categories: Category[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setDialogOpen(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = editing
        ? await updateCategory(editing.id, formData)
        : await createCategory(formData);

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(editing ? "Categoria actualizada" : "Categoria creada");
        setDialogOpen(false);
        setEditing(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Eliminar esta categoria?")) return;
    startTransition(async () => {
      const result = await deleteCategory(id);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Categoria eliminada");
      }
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          {categories.length} categorias
        </span>
        <Button onClick={openCreate} size="sm">
          <Plus data-icon="inline-start" />
          Nueva categoria
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
            No hay categorias
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-2xl border border-border/60 bg-card/80 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <p className="text-base font-semibold text-foreground break-words">
                    {cat.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {cat.is_team ? "Equipo" : "Individual"}
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground">
                      {cat.slug}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEdit(cat)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(cat.id)}
                    disabled={isPending}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Tam. equipo
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {cat.team_size}
                  </p>
                </div>
                <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Orden
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {cat.sort_order}
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
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tam. equipo</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No hay categorias
                </TableCell>
              </TableRow>
            )}
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {cat.is_team ? "Equipo" : "Individual"}
                  </Badge>
                </TableCell>
                <TableCell>{cat.team_size}</TableCell>
                <TableCell>{cat.sort_order}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEdit(cat)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(cat.id)}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar categoria" : "Nueva categoria"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos de la categoria"
                : "Rellena los datos para crear una nueva categoria"}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            category={editing}
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryForm({
  category,
  onSubmit,
  isPending,
}: {
  category: Category | null;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
}) {
  const [isTeam, setIsTeam] = useState(category?.is_team ?? false);

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cat-name">Nombre</Label>
        <Input
          id="cat-name"
          name="name"
          defaultValue={category?.name ?? ""}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cat-description">Descripcion</Label>
        <Input
          id="cat-description"
          name="description"
          defaultValue={category?.description ?? ""}
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={isTeam}
          onCheckedChange={setIsTeam}
        />
        <Label>Es equipo</Label>
        <input type="hidden" name="is_team" value={isTeam ? "true" : "false"} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="cat-team-size">Tam. equipo</Label>
          <Input
            id="cat-team-size"
            name="team_size"
            type="number"
            min={1}
            defaultValue={category?.team_size ?? 1}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-max-teams">Max equipos</Label>
          <Input
            id="cat-max-teams"
            name="max_teams"
            type="number"
            min={0}
            defaultValue={category?.max_teams ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-sort">Orden</Label>
          <Input
            id="cat-sort"
            name="sort_order"
            type="number"
            defaultValue={category?.sort_order ?? 0}
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : category ? "Actualizar" : "Crear"}
        </Button>
      </DialogFooter>
    </form>
  );
}
