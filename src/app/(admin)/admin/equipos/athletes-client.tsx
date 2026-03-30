"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { createAthlete, deleteAthlete, updateAthlete } from "@/lib/actions/athletes";
import { Badge } from "@/components/ui/badge";
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
import type {
  Athlete,
  Category,
  RegistrationMemberGender,
  Team,
  UserRole,
} from "@/types";

type TeamWithCategory = Team & {
  categories: { name: string } | null;
};

export type AthleteAdminRow = Athlete & {
  teamName: string | null;
  categoryName: string | null;
  fullName: string;
  email: string | null;
  shirtSize: string | null;
  gender: RegistrationMemberGender | null;
  linkedProfileId: string | null;
  linkedProfileRole: UserRole | null;
  linkedProfileSetupCompletedAt: string | null;
};

export function AthletesClient({
  athletes,
  categories,
  teams,
  onRefresh,
}: {
  athletes: AthleteAdminRow[];
  categories: Category[];
  teams: TeamWithCategory[];
  onRefresh: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<AthleteAdminRow | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredAthletes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return athletes.filter((athlete) => {
      const matchesCategory =
        categoryFilter === "all" ||
        teams.find((team) => team.id === athlete.team_id)?.category_id ===
          categoryFilter;
      const matchesQuery =
        !query ||
        athlete.fullName.toLowerCase().includes(query) ||
        athlete.teamName?.toLowerCase().includes(query) ||
        athlete.email?.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [athletes, categoryFilter, search, teams]);

  function openCreate() {
    setEditingAthlete(null);
    setDialogOpen(true);
  }

  function openEdit(athlete: AthleteAdminRow) {
    setEditingAthlete(athlete);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    if (!confirm("Eliminar este atleta?")) return;
    startTransition(async () => {
      const result = await deleteAthlete(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Atleta eliminado");
      onRefresh();
    });
  }

  function handleSubmit(payload: {
    teamId: string;
    fullName: string;
    email?: string;
    gender: RegistrationMemberGender | null;
    shirtSize?: string;
    instagram?: string;
    photoUrl?: string;
    sortOrder?: number;
  }) {
    startTransition(async () => {
      const result = editingAthlete
        ? await updateAthlete({ id: editingAthlete.id, ...payload })
        : await createAthlete(payload);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(editingAthlete ? "Atleta actualizado" : "Atleta creado");
      setDialogOpen(false);
      setEditingAthlete(null);
      onRefresh();
    });
  }

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Busca por atleta, equipo o email"
            className="w-full sm:w-72"
          />
          <Select
            value={categoryFilter}
            onValueChange={(value) => {
              if (value) setCategoryFilter(value);
            }}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredAthletes.length} atletas
          </span>
        </div>
        <Button onClick={openCreate} size="sm" className="w-full sm:w-auto">
          <Plus data-icon="inline-start" />
          Nuevo atleta
        </Button>
      </div>

      <div className="space-y-3 md:hidden">
        {filteredAthletes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-muted-foreground">
            No hay atletas para este filtro.
          </div>
        ) : (
          filteredAthletes.map((athlete) => (
            <div
              key={athlete.id}
              className="rounded-2xl border border-border/60 bg-card/80 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <p className="text-base font-semibold text-foreground break-words">
                    {athlete.fullName}
                  </p>
                  <p className="text-sm text-muted-foreground break-all">
                    {athlete.email ?? "Sin email"}
                    {athlete.gender
                      ? ` | ${athlete.gender === "male" ? "Chico" : "Chica"}`
                      : ""}
                    {athlete.shirtSize ? ` | Camiseta ${athlete.shirtSize}` : ""}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {athlete.teamName ?? "Sin equipo"}
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground">
                      {athlete.categoryName ?? "Sin categoria"}
                    </Badge>
                    {athlete.linkedProfileId ? (
                      <Badge
                        variant="outline"
                        className={
                          athlete.linkedProfileSetupCompletedAt
                            ? "border-brand-green/30 text-brand-green"
                            : "border-brand-cyan/30 text-brand-cyan"
                        }
                      >
                        {athlete.linkedProfileSetupCompletedAt
                          ? athlete.linkedProfileRole === "athlete"
                            ? "Cuenta activa"
                            : `Cuenta ${athlete.linkedProfileRole}`
                          : "Invitada"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Sin cuenta
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEdit(athlete)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(athlete.id)}
                    disabled={isPending}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border/50 bg-background/60 px-3 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Orden
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {athlete.sort_order}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Atleta</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Orden</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAthletes.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No hay atletas para este filtro.
                </TableCell>
              </TableRow>
            )}
            {filteredAthletes.map((athlete) => (
              <TableRow key={athlete.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{athlete.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {athlete.email ?? "Sin email"}
                      {athlete.gender
                        ? ` | ${athlete.gender === "male" ? "Chico" : "Chica"}`
                        : ""}
                      {athlete.shirtSize ? ` | Camiseta ${athlete.shirtSize}` : ""}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{athlete.teamName ?? "-"}</TableCell>
                <TableCell>{athlete.categoryName ?? "-"}</TableCell>
                <TableCell>
                  {athlete.linkedProfileId ? (
                    <Badge
                      variant="outline"
                      className={
                        athlete.linkedProfileSetupCompletedAt
                          ? "border-brand-green/30 text-brand-green"
                          : "border-brand-cyan/30 text-brand-cyan"
                      }
                    >
                      {athlete.linkedProfileSetupCompletedAt
                        ? athlete.linkedProfileRole === "athlete"
                          ? "Cuenta activa"
                          : `Cuenta ${athlete.linkedProfileRole}`
                        : "Invitada"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Sin cuenta
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{athlete.sort_order}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEdit(athlete)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(athlete.id)}
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingAthlete ? "Editar atleta" : "Nuevo atleta"}
            </DialogTitle>
            <DialogDescription>
              Gestiona la ficha deportiva sin perder el enlace con la persona real.
            </DialogDescription>
          </DialogHeader>
          <AthleteForm
            athlete={editingAthlete}
            teams={teams}
            isPending={isPending}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function AthleteForm({
  athlete,
  teams,
  isPending,
  onSubmit,
}: {
  athlete: AthleteAdminRow | null;
  teams: TeamWithCategory[];
  isPending: boolean;
  onSubmit: (payload: {
    teamId: string;
    fullName: string;
    email?: string;
    gender: RegistrationMemberGender | null;
    shirtSize?: string;
    instagram?: string;
    photoUrl?: string;
    sortOrder?: number;
  }) => void;
}) {
  const [teamId, setTeamId] = useState(athlete?.team_id ?? "");
  const [gender, setGender] = useState<"male" | "female" | "none">(
    athlete?.gender ?? "none",
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        onSubmit({
          teamId,
          fullName: String(formData.get("full_name") ?? ""),
          email: String(formData.get("email") ?? ""),
          gender: gender === "none" ? null : gender,
          shirtSize: String(formData.get("shirt_size") ?? ""),
          instagram: String(formData.get("instagram") ?? ""),
          photoUrl: String(formData.get("photo_url") ?? ""),
          sortOrder: Number(formData.get("sort_order") ?? 0),
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="athlete-team">Equipo</Label>
        <Select
          value={teamId}
          onValueChange={(value) => {
            if (value) setTeamId(value);
          }}
        >
          <SelectTrigger id="athlete-team" className="w-full">
            <SelectValue placeholder="Selecciona equipo" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name} | {team.categories?.name ?? "Sin categoria"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="athlete-full-name">Nombre completo</Label>
        <Input
          id="athlete-full-name"
          name="full_name"
          defaultValue={athlete?.fullName ?? ""}
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="athlete-email">Email</Label>
          <Input
            id="athlete-email"
            name="email"
            type="email"
            defaultValue={athlete?.email ?? ""}
            placeholder="opcional@equipo.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Genero</Label>
          <Select
            value={gender}
            onValueChange={(value) => setGender(value as typeof gender)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin indicar</SelectItem>
              <SelectItem value="male">Chico</SelectItem>
              <SelectItem value="female">Chica</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="athlete-shirt-size">Talla camiseta</Label>
          <Input
            id="athlete-shirt-size"
            name="shirt_size"
            defaultValue={athlete?.shirtSize ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="athlete-sort-order">Orden</Label>
          <Input
            id="athlete-sort-order"
            name="sort_order"
            type="number"
            min={0}
            defaultValue={athlete?.sort_order ?? 0}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="athlete-instagram">Instagram</Label>
          <Input
            id="athlete-instagram"
            name="instagram"
            defaultValue={athlete?.instagram ?? ""}
            placeholder="@handle"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="athlete-photo-url">Foto URL</Label>
          <Input
            id="athlete-photo-url"
            name="photo_url"
            type="url"
            defaultValue={athlete?.photo_url ?? ""}
            placeholder="https://..."
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending || !teamId}>
          <UserRound data-icon="inline-start" />
          {isPending ? "Guardando..." : athlete ? "Actualizar atleta" : "Crear atleta"}
        </Button>
      </DialogFooter>
    </form>
  );
}
