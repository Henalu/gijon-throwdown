"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MailPlus, Pencil, UserRound, Users } from "lucide-react";
import { invitePersonAccount, updatePersonDetails } from "@/lib/actions/people";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getProfileRoleLabel } from "@/lib/auth/permissions";
import type { Person, Profile, RegistrationMemberGender } from "@/types";

type PersonRow = Person & {
  profile: Pick<
    Profile,
    "id" | "email" | "role" | "is_judge" | "is_active" | "setup_completed_at"
  > | null;
  athlete: {
    id: string;
    teamName: string | null;
    categoryName: string | null;
  } | null;
  participationSummary: {
    totalEditions: number;
    latestEditionLabel: string | null;
    roles: Array<"athlete" | "volunteer" | "staff">;
  };
};

function PersonForm({
  initialValues,
  isPending,
  onSubmit,
}: {
  initialValues: {
    id: string;
    fullName: string;
    primaryEmail: string;
    gender: RegistrationMemberGender | null;
    shirtSize: string;
    dietaryRestrictions: string;
    notes: string;
  };
  isPending: boolean;
  onSubmit: (values: {
    id: string;
    fullName: string;
    primaryEmail: string;
    gender: RegistrationMemberGender | null;
    shirtSize: string;
    dietaryRestrictions: string;
    notes: string;
  }) => void;
}) {
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [primaryEmail, setPrimaryEmail] = useState(initialValues.primaryEmail);
  const [gender, setGender] = useState<RegistrationMemberGender | null>(
    initialValues.gender,
  );
  const [shirtSize, setShirtSize] = useState(initialValues.shirtSize);
  const [dietaryRestrictions, setDietaryRestrictions] = useState(
    initialValues.dietaryRestrictions,
  );
  const [notes, setNotes] = useState(initialValues.notes);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          id: initialValues.id,
          fullName,
          primaryEmail,
          gender,
          shirtSize,
          dietaryRestrictions,
          notes,
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="person-full-name">Nombre completo</Label>
        <Input
          id="person-full-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="person-email">Email principal</Label>
        <Input
          id="person-email"
          type="email"
          value={primaryEmail}
          onChange={(event) => setPrimaryEmail(event.target.value)}
          placeholder="persona@email.com"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Genero</Label>
          <Select
            value={gender ?? "none"}
            onValueChange={(value) => {
              setGender(value === "none" ? null : (value as RegistrationMemberGender));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin definir</SelectItem>
              <SelectItem value="male">Chico</SelectItem>
              <SelectItem value="female">Chica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="person-shirt">Talla</Label>
          <Input
            id="person-shirt"
            value={shirtSize}
            onChange={(event) => setShirtSize(event.target.value)}
            placeholder="M"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="person-dietary">Restricciones alimentarias</Label>
        <Textarea
          id="person-dietary"
          value={dietaryRestrictions}
          onChange={(event) => setDietaryRestrictions(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="person-notes">Notas</Label>
        <Textarea
          id="person-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PeopleClient({ people }: { people: PersonRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editingPerson, setEditingPerson] = useState<PersonRow | null>(null);
  const [invitingPerson, setInvitingPerson] = useState<PersonRow | null>(null);
  const [inviteRole, setInviteRole] = useState<"athlete" | "volunteer">("athlete");
  const [isPending, startTransition] = useTransition();

  const filteredPeople = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return people.filter((person) => {
      if (!normalizedQuery) return true;

      return (
        person.full_name.toLowerCase().includes(normalizedQuery) ||
        (person.primary_email ?? "").toLowerCase().includes(normalizedQuery) ||
        (person.athlete?.teamName ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
  }, [people, query]);

  const totals = useMemo(
    () => ({
      total: people.length,
      withAccount: people.filter((person) => person.profile).length,
      athletes: people.filter((person) => person.athlete).length,
      withHistory: people.filter(
        (person) => person.participationSummary.totalEditions > 0,
      ).length,
    }),
    [people],
  );

  function handleUpdate(values: {
    id: string;
    fullName: string;
    primaryEmail: string;
    gender: RegistrationMemberGender | null;
    shirtSize: string;
    dietaryRestrictions: string;
    notes: string;
  }) {
    startTransition(async () => {
      const result = await updatePersonDetails(values);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Persona actualizada");
      setEditingPerson(null);
      router.refresh();
    });
  }

  function handleInvite() {
    if (!invitingPerson) return;

    startTransition(async () => {
      const result = await invitePersonAccount({
        personId: invitingPerson.id,
        role: inviteRole,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(
        result.invited ? "Invitacion enviada" : "Cuenta reutilizada y enlazada",
      );
      setInvitingPerson(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} />
            Personas
          </div>
          <p className="mt-3 text-3xl font-black text-foreground">{totals.total}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserRound size={16} />
            Con cuenta
          </div>
          <p className="mt-3 text-3xl font-black text-foreground">
            {totals.withAccount}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} />
            Atletas vinculados
          </div>
          <p className="mt-3 text-3xl font-black text-foreground">
            {totals.athletes}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} />
            Con continuidad
          </div>
          <p className="mt-3 text-3xl font-black text-foreground">
            {totals.withHistory}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
        <div className="space-y-2">
          <Label htmlFor="people-search">Buscar</Label>
          <Input
            id="people-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre, email o equipo"
          />
        </div>

        <div className="mt-6 space-y-3">
          {filteredPeople.map((person) => (
            <div
              key={person.id}
              className="rounded-2xl border border-border/60 bg-background/70 p-4"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-foreground">
                      {person.full_name}
                    </p>
                    {person.profile ? (
                      <Badge variant="outline" className="border-brand-green/30 text-brand-green">
                        {getProfileRoleLabel(person.profile)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        Sin cuenta
                      </Badge>
                    )}
                    {person.athlete && (
                      <Badge variant="outline" className="border-brand-cyan/30 text-brand-cyan">
                        Atleta confirmado
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{person.primary_email ?? "Sin email principal"}</p>
                    {person.athlete && (
                      <p>
                        Equipo: {person.athlete.teamName ?? "Sin equipo"}{" "}
                        {person.athlete.categoryName
                          ? `- ${person.athlete.categoryName}`
                          : ""}
                      </p>
                    )}
                    {person.shirt_size && <p>Talla: {person.shirt_size}</p>}
                    {person.participationSummary.totalEditions > 0 && (
                      <p>
                        Ediciones: {person.participationSummary.totalEditions}
                        {person.participationSummary.latestEditionLabel
                          ? ` - Ultima ${person.participationSummary.latestEditionLabel}`
                          : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPerson(person)}
                  >
                    <Pencil data-icon="inline-start" />
                    Editar
                  </Button>
                  {!person.profile && person.primary_email && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setInviteRole(person.athlete ? "athlete" : "volunteer");
                        setInvitingPerson(person);
                      }}
                    >
                      <MailPlus data-icon="inline-start" />
                      Invitar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredPeople.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 px-4 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No hay personas que coincidan con la busqueda actual.
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={editingPerson !== null}
        onOpenChange={(open) => {
          if (!open) setEditingPerson(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar persona</DialogTitle>
            <DialogDescription>
              Ajusta los datos canónicos que reutilizará el sistema en accesos,
              atletas y conversiones futuras.
            </DialogDescription>
          </DialogHeader>

          {editingPerson && (
            <PersonForm
              initialValues={{
                id: editingPerson.id,
                fullName: editingPerson.full_name,
                primaryEmail: editingPerson.primary_email ?? "",
                gender: editingPerson.gender,
                shirtSize: editingPerson.shirt_size ?? "",
                dietaryRestrictions: editingPerson.dietary_restrictions ?? "",
                notes: editingPerson.notes ?? "",
              }}
              isPending={isPending}
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={invitingPerson !== null}
        onOpenChange={(open) => {
          if (!open) setInvitingPerson(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invitar cuenta</DialogTitle>
            <DialogDescription>
              Esto crea o reutiliza una cuenta auth enlazada a la persona
              seleccionada.
            </DialogDescription>
          </DialogHeader>

          {invitingPerson && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">{invitingPerson.full_name}</p>
                <p className="mt-1 text-muted-foreground">
                  {invitingPerson.primary_email ?? "Sin email"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Rol de la cuenta</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value) => {
                    if (value === "athlete" || value === "volunteer") {
                      setInviteRole(value);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="athlete">Atleta</SelectItem>
                    <SelectItem value="volunteer">Voluntario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" onClick={handleInvite} disabled={isPending}>
                  {isPending ? "Procesando..." : "Invitar cuenta"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
