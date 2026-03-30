"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MailPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { AthletesClient, type AthleteAdminRow } from "./athletes-client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTeam, deleteTeam, updateTeam } from "@/lib/actions/teams";
import {
  convertTeamRegistration,
  inviteTeamRegistrationAthletes,
  reviewTeamRegistration,
} from "@/lib/actions/registrations";
import type {
  Category,
  RegistrationStatus,
  Team,
  TeamRegistration,
  TeamRegistrationMember,
  UserRole,
} from "@/types";

type TeamWithCategory = Team & {
  categories: { name: string } | null;
};

type TeamRegistrationWithDetails = TeamRegistration & {
  categories: { name: string } | null;
  team_registration_members: (TeamRegistrationMember & {
    linked_profile_id: string | null;
    linked_profile_role: UserRole | null;
    linked_profile_setup_completed_at: string | null;
  })[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: RegistrationStatus) {
  switch (status) {
    case "approved":
      return {
        label: "Aprobada",
        className: "border-brand-green/30 text-brand-green",
      };
    case "rejected":
      return {
        label: "Rechazada",
        className: "border-red-500/30 text-red-400",
      };
    case "pending":
    default:
      return {
        label: "Pendiente",
        className: "border-yellow-500/30 text-yellow-500",
      };
  }
}

function getAccountBadge(member: TeamRegistrationWithDetails["team_registration_members"][number]) {
  if (!member.linked_profile_id) {
    return {
      label: "Sin cuenta",
      className: "border-white/12 text-muted-foreground",
    };
  }

  if (member.linked_profile_setup_completed_at) {
    return {
      label: "Cuenta activa",
      className: "border-brand-green/30 text-brand-green",
    };
  }

  return {
    label: "Invitada",
    className: "border-brand-cyan/30 text-brand-cyan",
  };
}

export function EquiposClient({
  teams,
  athletes,
  categories,
  registrations,
}: {
  teams: TeamWithCategory[];
  athletes: AthleteAdminRow[];
  categories: Category[];
  registrations: TeamRegistrationWithDetails[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamWithCategory | null>(null);
  const [filter, setFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [notesById, setNotesById] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      registrations.map((registration) => [
        registration.id,
        registration.admin_notes ?? "",
      ]),
    ),
  );

  const filteredTeams = useMemo(() => {
    if (filter === "all") return teams;
    return teams.filter((team) => team.category_id === filter);
  }, [teams, filter]);

  const pendingRegistrations = registrations.filter(
    (registration) => registration.status === "pending",
  ).length;
  const convertedRegistrations = registrations.filter(
    (registration) => registration.converted_team_id,
  ).length;
  const mobilePreinscriptionSummary =
    pendingRegistrations > 0
      ? `${pendingRegistrations} pendientes por revisar`
      : convertedRegistrations > 0
        ? `${convertedRegistrations} preinscripciones ya convertidas`
        : "Sin preinscripciones pendientes ahora mismo";

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
        router.refresh();
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
        router.refresh();
      }
    });
  }

  function handleReview(id: string, status: RegistrationStatus) {
    startTransition(async () => {
      const result = await reviewTeamRegistration({
        id,
        status,
        adminNotes: notesById[id] ?? "",
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(
        status === "approved"
          ? "Preinscripcion aprobada"
          : status === "rejected"
            ? "Preinscripcion rechazada"
            : "Preinscripcion actualizada",
      );
      router.refresh();
    });
  }

  function handleConvert(id: string) {
    startTransition(async () => {
      const result = await convertTeamRegistration({ id });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Preinscripcion convertida en equipo confirmado");
      router.refresh();
    });
  }

  function handleInviteAthletes(id: string) {
    startTransition(async () => {
      const result = await inviteTeamRegistrationAthletes({ id });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `Invitaciones listas. Nuevas: ${result.invitedCount}, enlazadas: ${result.linkedCount}, omitidas: ${result.skippedCount}.`,
      );
      router.refresh();
    });
  }

  return (
    <>
      <Tabs
        defaultValue="confirmados"
        className="flex-col gap-4 md:flex-row md:items-start md:gap-6"
      >
        <TabsList
          className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl border border-border/60 bg-card/80 p-1 md:sticky md:top-6 md:flex md:w-[15rem] md:flex-col md:items-stretch md:justify-start md:gap-2 md:rounded-[1.75rem] md:p-2"
        >
          <TabsTrigger
            value="confirmados"
            className="min-h-11 rounded-xl px-2 py-2 text-center text-sm leading-tight whitespace-normal md:min-h-[4.5rem] md:w-full md:justify-start md:px-4 md:py-4 md:text-left md:after:hidden"
          >
            <span>Confirmados</span>
          </TabsTrigger>
          <TabsTrigger
            value="atletas"
            className="min-h-11 rounded-xl px-2 py-2 text-center text-sm leading-tight whitespace-normal md:min-h-[4.5rem] md:w-full md:justify-start md:px-4 md:py-4 md:text-left md:after:hidden"
          >
            <span>Atletas</span>
          </TabsTrigger>
          <TabsTrigger
            value="preinscripciones"
            className="min-h-11 rounded-xl px-2 py-2 text-center text-sm leading-tight whitespace-normal md:min-h-[4.5rem] md:w-full md:justify-start md:px-4 md:py-4 md:text-left md:after:hidden"
          >
            <span className="md:hidden">Preins.</span>
            <span className="hidden md:inline">
              Preinscripciones
              {pendingRegistrations > 0
                ? ` (${pendingRegistrations})`
                : convertedRegistrations > 0
                  ? ` (${convertedRegistrations} convertidas)`
                  : ""}
            </span>
          </TabsTrigger>
        </TabsList>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3 md:hidden">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Preinscripciones
            </p>
            <p className="mt-1 text-sm text-foreground">{mobilePreinscriptionSummary}</p>
          </div>

        <TabsContent value="confirmados" className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <Select
                value={filter}
                onValueChange={(value) => {
                  if (value) setFilter(value);
                }}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue>
                    {(value) =>
                      value === "all"
                        ? "Todas las categorias"
                        : categories.find((category) => category.id === value)?.name ??
                          "Todas las categorias"
                    }
                  </SelectValue>
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
                {filteredTeams.length} equipos
              </span>
            </div>
            <Button onClick={openCreate} size="sm" className="w-full sm:w-auto">
              <Plus data-icon="inline-start" />
              Nuevo equipo
            </Button>
          </div>

          <div className="space-y-3 md:hidden">
            {filteredTeams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
                No hay equipos confirmados para este filtro.
              </div>
            ) : (
              filteredTeams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-2xl border border-border/60 bg-card/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <p className="text-base font-semibold text-foreground break-words">
                        {team.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          {team.categories?.name ?? "Sin categoria"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
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
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Box
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground break-words">
                        {team.box_name ?? "-"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/60 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Ciudad
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground break-words">
                        {team.city ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-background/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Box</th>
                    <th className="px-4 py-3 font-medium">Ciudad</th>
                    <th className="px-4 py-3 font-medium">Categoria</th>
                    <th className="px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        No hay equipos confirmados para este filtro.
                      </td>
                    </tr>
                  )}
                  {filteredTeams.map((team) => (
                    <tr
                      key={team.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">{team.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {team.box_name ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {team.city ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {team.categories?.name ?? "Sin categoria"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="atletas" className="min-w-0 flex-1 space-y-4">
          <AthletesClient
            athletes={athletes}
            categories={categories}
            teams={teams}
            onRefresh={() => router.refresh()}
          />
        </TabsContent>

        <TabsContent value="preinscripciones" className="min-w-0 flex-1 space-y-4">
          {registrations.length > 0 ? (
            registrations.map((registration) => {
              const statusBadge = getStatusLabel(registration.status);
              const accountReadyCount = registration.team_registration_members.filter(
                (member) => member.linked_profile_id,
              ).length;

              return (
                <div
                  key={registration.id}
                  className="rounded-2xl border border-border/60 bg-card/80 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:justify-between">
                    <div className="min-w-0 space-y-3 xl:max-w-[24rem]">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-foreground break-words">
                          {registration.team_name}
                        </p>
                        <Badge variant="outline" className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                        {registration.converted_team_id && (
                          <Badge
                            variant="outline"
                            className="border-brand-cyan/30 text-brand-cyan"
                          >
                            Equipo creado
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          Categoria: {registration.categories?.name ?? "Sin categoria"}
                        </p>
                        <p>Responsable de contacto (Atleta 1): {registration.leader_name}</p>
                        <p className="break-all">
                          Email de contacto: {registration.leader_email}
                        </p>
                        <p>Enviada: {formatDate(registration.created_at)}</p>
                        {registration.converted_at && (
                          <p>Convertida: {formatDate(registration.converted_at)}</p>
                        )}
                        {registration.converted_team_id && (
                          <p>Cuentas atleta: {accountReadyCount}/4</p>
                        )}
                      </div>
                    </div>

                    <div className="grid min-w-0 flex-1 gap-4 lg:grid-cols-[1fr_0.9fr]">
                      <div className="space-y-3 rounded-[1.3rem] bg-background/60 p-4">
                        <p className="text-sm font-semibold text-white">
                          Integrantes
                        </p>
                        <div className="space-y-2">
                          {registration.team_registration_members
                            .slice()
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((member, index) => (
                              <div
                                key={member.id}
                                className="rounded-[1rem] bg-black/20 px-3 py-3"
                              >
                                {(() => {
                                  const accountBadge = getAccountBadge(member);

                                  return (
                                    <>
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                        <div className="min-w-0">
                                          <p className="text-sm font-medium text-white break-words">
                                            {index === 0
                                              ? `1. ${member.full_name} - Responsable`
                                              : `${index + 1}. ${member.full_name}`}
                                          </p>
                                          <p className="mt-1 text-xs text-muted-foreground break-all">
                                            {member.email} |{" "}
                                            {member.gender === "male" ? "Chico" : "Chica"} |{" "}
                                            {member.shirt_size}
                                          </p>
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className={accountBadge.className}
                                        >
                                          {accountBadge.label}
                                        </Badge>
                                      </div>
                                    </>
                                  );
                                })()}
                                {member.converted_athlete_id && (
                                  <p className="mt-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-brand-cyan">
                                    Atleta creado y vinculado
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                      <div className="min-w-0 space-y-3 rounded-[1.3rem] bg-background/60 p-4">
                        <p className="text-sm font-semibold text-white">
                          Revision interna
                        </p>
                        <Textarea
                          value={notesById[registration.id] ?? ""}
                          onChange={(event) =>
                            setNotesById((current) => ({
                              ...current,
                              [registration.id]: event.target.value,
                            }))
                          }
                          placeholder="Notas internas para la revision"
                        />
                        <div className="flex flex-wrap gap-2">
                          {!registration.converted_team_id ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleConvert(registration.id)}
                              disabled={isPending}
                            >
                              Confirmar y crear equipo
                            </Button>
                          ) : accountReadyCount < 4 ? (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleInviteAthletes(registration.id)}
                              disabled={isPending}
                            >
                              <MailPlus data-icon="inline-start" />
                              Invitar atletas
                            </Button>
                          ) : (
                            <Button type="button" size="sm" variant="outline" disabled>
                              Cuentas listas
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReview(registration.id, "rejected")}
                            disabled={isPending}
                          >
                            Rechazar
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleReview(registration.id, "pending")}
                            disabled={isPending}
                          >
                            Dejar pendiente
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
              No hay preinscripciones publicas de equipos.
            </p>
          )}
        </TabsContent>
        </div>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar equipo" : "Nuevo equipo"}</DialogTitle>
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
        <Select
          value={categoryId}
          onValueChange={(value) => {
            if (value) setCategoryId(value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona categoria">
              {(value) =>
                categories.find((category) => category.id === value)?.name ??
                "Selecciona categoria"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
