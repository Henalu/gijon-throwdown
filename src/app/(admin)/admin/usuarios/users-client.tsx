"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { MailPlus, Pencil, ShieldCheck, UserCog, Users } from "lucide-react";
import { inviteInternalUser, updateInternalUser } from "@/lib/actions/admin-users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProfileRoleLabel } from "@/lib/auth/permissions";
import type { UserRole } from "@/types";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_judge: boolean;
  can_validate_scores: boolean;
  invited_at: string | null;
  setup_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

type UserRoleFilter = "all" | "judge" | UserRole;

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "superadmin", label: "Superadmin" },
  { value: "admin", label: "Admin" },
  { value: "volunteer", label: "Voluntario" },
  { value: "athlete", label: "Athlete" },
];

function getSetupLabel(user: UserRow) {
  if (user.setup_completed_at) {
    return { label: "Activa", className: "border-brand-green/30 text-brand-green" };
  }

  if (user.invited_at) {
    return { label: "Pendiente", className: "border-yellow-500/30 text-yellow-500" };
  }

  return { label: "Sin iniciar", className: "border-border text-muted-foreground" };
}

function UserForm({
  initialValues,
  submitLabel,
  onSubmit,
  isPending,
}: {
  initialValues: {
    email?: string;
    fullName: string;
    role: UserRole;
    isJudge: boolean;
    canValidateScores: boolean;
    isActive: boolean;
  };
  submitLabel: string;
  onSubmit: (values: {
    email?: string;
    fullName: string;
    role: UserRole;
    isJudge: boolean;
    canValidateScores: boolean;
    isActive: boolean;
  }) => void;
  isPending: boolean;
}) {
  const [email, setEmail] = useState(initialValues.email ?? "");
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [role, setRole] = useState<UserRole>(initialValues.role);
  const [isJudge, setIsJudge] = useState(initialValues.isJudge);
  const [canValidateScores, setCanValidateScores] = useState(
    initialValues.canValidateScores,
  );
  const [isActive, setIsActive] = useState(initialValues.isActive);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          email: initialValues.email !== undefined ? email : undefined,
          fullName,
          role,
          isJudge,
          canValidateScores,
          isActive,
        });
      }}
      className="space-y-4"
    >
      {initialValues.email !== undefined && (
        <div className="space-y-2">
          <Label htmlFor="user-email">Email</Label>
          <Input
            id="user-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="staff@gijonthrowdown.es"
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="user-full-name">Nombre completo</Label>
        <Input
          id="user-full-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Nombre y apellidos"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Rol</Label>
        <Select
          value={role}
          onValueChange={(value) => {
            const nextRole = value as UserRole;
            setRole(nextRole);
            if (nextRole !== "volunteer") {
              setIsJudge(false);
            }
            if (nextRole !== "admin") {
              setCanValidateScores(false);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-3 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="accent-brand-green"
          />
          Usuario activo
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-3 text-sm">
          <input
            type="checkbox"
            checked={isJudge}
            onChange={(event) => setIsJudge(event.target.checked)}
            className="accent-brand-green"
            disabled={role !== "volunteer"}
          />
          Perfil juez
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-3 text-sm">
          <input
            type="checkbox"
            checked={canValidateScores}
            onChange={(event) => setCanValidateScores(event.target.checked)}
            className="accent-brand-green"
            disabled={role !== "admin"}
          />
          Puede validar scores
        </label>
      </div>

      <DialogFooter className="px-0 pb-0">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? "Guardando..." : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function UsersClient({ users }: { users: UserRow[] }) {
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all");
  const [stateFilter, setStateFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [query, setQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "judge"
          ? user.role === "volunteer" && user.is_judge
          : user.role === roleFilter);
      const matchesState =
        stateFilter === "all" ||
        (stateFilter === "active" ? user.is_active : !user.is_active);
      const matchesQuery =
        !normalizedQuery ||
        user.full_name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery);

      return matchesRole && matchesState && matchesQuery;
    });
  }, [query, roleFilter, stateFilter, users]);

  const totals = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.is_active).length,
      judges: users.filter(
        (user) => user.role === "volunteer" && user.is_judge,
      ).length,
      validators: users.filter(
        (user) => user.role === "superadmin" || user.can_validate_scores,
      ).length,
    }),
    [users],
  );

  function handleInvite(values: {
    email?: string;
    fullName: string;
    role: UserRole;
    isJudge: boolean;
    canValidateScores: boolean;
    isActive: boolean;
  }) {
    startTransition(async () => {
      const result = await inviteInternalUser({
        email: values.email ?? "",
        fullName: values.fullName,
        role: values.role,
        isJudge: values.isJudge,
        canValidateScores: values.canValidateScores,
        isActive: values.isActive,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Invitacion enviada");
      setInviteOpen(false);
    });
  }

  function handleUpdate(values: {
    email?: string;
    fullName: string;
    role: UserRole;
    isJudge: boolean;
    canValidateScores: boolean;
    isActive: boolean;
  }) {
    if (!editingUser) return;

    startTransition(async () => {
      const result = await updateInternalUser({
        id: editingUser.id,
        fullName: values.fullName,
        role: values.role,
        isJudge: values.isJudge,
        canValidateScores: values.canValidateScores,
        isActive: values.isActive,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Usuario actualizado");
      setEditingUser(null);
    });
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} />
            Usuarios internos
          </div>
          <p className="mt-3 text-3xl font-black text-foreground">{totals.total}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCog size={16} />
            Activos
          </div>
          <p className="mt-3 text-3xl font-black text-foreground">{totals.active}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck size={16} />
            Jueces
          </div>
          <p className="mt-3 text-3xl font-black text-foreground">
            {totals.judges}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck size={16} />
            Validadores
          </div>
          <p className="mt-3 text-3xl font-black text-foreground">
            {totals.validators}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="user-search">Buscar</Label>
              <Input
                id="user-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nombre o email"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={roleFilter}
                onValueChange={(value) => setRoleFilter(value as UserRoleFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="judge">Juez</SelectItem>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={stateFilter}
                onValueChange={(value) =>
                  setStateFilter(value as "all" | "active" | "inactive")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={() => setInviteOpen(true)}>
            <MailPlus data-icon="inline-start" />
            Invitar usuario
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {filteredUsers.map((user) => {
            const setupBadge = getSetupLabel(user);

            return (
              <div
                key={user.id}
                className="rounded-2xl border border-border/60 bg-background/70 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-foreground">
                        {user.full_name}
                      </p>
                      <Badge variant="outline">
                        {getProfileRoleLabel(user)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          user.is_active
                            ? "border-brand-green/30 text-brand-green"
                            : "border-red-500/30 text-red-400"
                        }
                      >
                        {user.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                      <Badge variant="outline" className={setupBadge.className}>
                        {setupBadge.label}
                      </Badge>
                      {(user.role === "superadmin" || user.can_validate_scores) && (
                        <Badge
                          variant="outline"
                          className="border-brand-cyan/30 text-brand-cyan"
                        >
                          Validador
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Alta:{" "}
                        {new Date(user.created_at).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                    >
                      <Pencil data-icon="inline-start" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No hay usuarios que coincidan con los filtros actuales.
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invitar nuevo usuario</DialogTitle>
            <DialogDescription>
              Se enviara un acceso por email y el usuario completara su setup al
              entrar por primera vez.
            </DialogDescription>
          </DialogHeader>

          <UserForm
            initialValues={{
              email: "",
              fullName: "",
              role: "volunteer",
              isJudge: false,
              canValidateScores: false,
              isActive: true,
            }}
            submitLabel="Enviar invitacion"
            onSubmit={handleInvite}
            isPending={isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editingUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Ajusta rol, capacidad de validacion y estado del acceso operativo.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <UserForm
              initialValues={{
                fullName: editingUser.full_name,
                role: editingUser.role,
                isJudge: editingUser.is_judge,
                canValidateScores: editingUser.can_validate_scores,
                isActive: editingUser.is_active,
              }}
              submitLabel="Guardar cambios"
              onSubmit={handleUpdate}
              isPending={isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
