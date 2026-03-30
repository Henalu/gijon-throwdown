"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MailPlus, ShieldCheck, UserCog, Users } from "lucide-react";
import {
  convertVolunteerApplication,
  reviewVolunteerApplication,
} from "@/lib/actions/registrations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getProfileRoleLabel, isJudgeProfile } from "@/lib/auth/permissions";
import type { RegistrationStatus, UserRole, VolunteerApplication } from "@/types";
import {
  VolunteerAssignmentsClient,
  type AssignmentOptionHeat,
  type AssignmentOptionVolunteer,
  type VolunteerAssignmentRow,
} from "./volunteer-assignments-client";

interface VolunteerRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_judge: boolean;
  can_validate_scores: boolean;
  setup_completed_at: string | null;
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

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function VolunteersClient({
  volunteers,
  applications,
  assignments,
  assignableVolunteers,
  heats,
}: {
  volunteers: VolunteerRow[];
  applications: VolunteerApplication[];
  assignments: VolunteerAssignmentRow[];
  assignableVolunteers: AssignmentOptionVolunteer[];
  heats: AssignmentOptionHeat[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notesById, setNotesById] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      applications.map((application) => [
        application.id,
        application.admin_notes ?? "",
      ]),
    ),
  );

  const totals = useMemo(
    () => ({
      total: volunteers.length,
      active: volunteers.filter((volunteer) => volunteer.is_active).length,
      judges: volunteers.filter(
        (volunteer) =>
          volunteer.role === "volunteer" && volunteer.is_judge,
      ).length,
      pendingApplications: applications.filter(
        (application) => application.status === "pending",
      ).length,
      convertedApplications: applications.filter(
        (application) => application.converted_person_id,
      ).length,
      assignments: assignments.length,
    }),
    [applications, assignments.length, volunteers],
  );

  function handleReview(id: string, status: RegistrationStatus) {
    startTransition(async () => {
      const result = await reviewVolunteerApplication({
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
          ? "Solicitud aprobada"
          : status === "rejected"
            ? "Solicitud rechazada"
            : "Solicitud actualizada",
      );
      router.refresh();
    });
  }

  function handleConvert(id: string) {
    startTransition(async () => {
      const result = await convertVolunteerApplication({ id });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(
        result.invited
          ? "Solicitud convertida e invitacion enviada"
          : "Solicitud convertida y cuenta enlazada",
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-6">
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} />
            Staff operativo
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
            <Users size={16} />
            Solicitudes pendientes
          </div>
          <p className="mt-3 text-3xl font-black text-foreground">
            {totals.pendingApplications}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MailPlus size={16} />
            Convertidas
          </div>
          <p className="mt-3 text-3xl font-black text-foreground">
            {totals.convertedApplications}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserCog size={16} />
            Asignaciones
          </div>
          <p className="mt-3 text-3xl font-black text-foreground">
            {totals.assignments}
          </p>
        </div>
      </div>

      <Tabs defaultValue="operativos" className="space-y-4">
        <TabsList
          variant="line"
          className="grid w-full gap-2 rounded-2xl border border-border/60 bg-card/80 p-1 md:inline-flex md:w-fit md:border-0 md:bg-transparent md:p-0"
        >
          <TabsTrigger
            value="operativos"
            className="w-full justify-start px-3 py-2 text-left whitespace-normal md:w-auto md:flex-none md:justify-center md:px-1.5 md:py-0.5"
          >
            Operativos
          </TabsTrigger>
          <TabsTrigger
            value="asignaciones"
            className="w-full justify-start px-3 py-2 text-left whitespace-normal md:w-auto md:flex-none md:justify-center md:px-1.5 md:py-0.5"
          >
            Asignaciones
          </TabsTrigger>
          <TabsTrigger
            value="solicitudes"
            className="w-full justify-start px-3 py-2 text-left whitespace-normal md:w-auto md:flex-none md:justify-center md:px-1.5 md:py-0.5"
          >
            Solicitudes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operativos" className="space-y-3">
          {volunteers.length > 0 ? (
            volunteers.map((volunteer) => (
              <div
                key={volunteer.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-bold text-foreground break-words">{volunteer.full_name}</p>
                  <p className="text-xs text-muted-foreground break-all">{volunteer.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isJudgeProfile(volunteer) && (
                    <Badge
                      variant="outline"
                      className="border-brand-cyan/40 text-brand-cyan"
                    >
                      Juez
                    </Badge>
                  )}
                  {(volunteer.role === "superadmin" ||
                    volunteer.can_validate_scores) && (
                    <Badge
                      variant="outline"
                      className="border-brand-cyan/40 text-brand-cyan"
                    >
                      Validador
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="border-brand-green/40 text-brand-green"
                  >
                    {getProfileRoleLabel(volunteer)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      volunteer.is_active
                        ? "border-brand-green/40 text-brand-green"
                        : "text-muted-foreground"
                    }
                  >
                    {volunteer.is_active
                      ? volunteer.setup_completed_at
                        ? "Activo"
                        : "Pendiente"
                      : "Inactivo"}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
              No hay perfiles operativos todavia.
            </p>
          )}
        </TabsContent>

        <TabsContent value="asignaciones" className="space-y-4">
          <VolunteerAssignmentsClient
            assignments={assignments}
            volunteers={assignableVolunteers}
            heats={heats}
          />
        </TabsContent>

        <TabsContent value="solicitudes" className="space-y-4">
          {applications.length > 0 ? (
            applications.map((application) => {
              const statusBadge = getStatusLabel(application.status);

              return (
                <div
                  key={application.id}
                  className="rounded-2xl border border-border/60 bg-card/80 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-foreground break-words">
                          {application.first_name} {application.last_name}
                        </p>
                        <Badge variant="outline" className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                        {application.is_judge && (
                          <Badge
                            variant="outline"
                            className="border-brand-cyan/30 text-brand-cyan"
                          >
                            Juez
                          </Badge>
                        )}
                        {application.converted_person_id && (
                          <Badge
                            variant="outline"
                            className="border-brand-cyan/30 text-brand-cyan"
                          >
                            Convertida
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="break-all">{application.email}</p>
                        <p>Talla: {application.shirt_size}</p>
                        <p>Enviada: {formatDate(application.created_at)}</p>
                        {application.dietary_restrictions && (
                          <p className="break-words">
                            Restricciones: {application.dietary_restrictions}
                          </p>
                        )}
                        {application.converted_at && (
                          <p>Convertida: {formatDate(application.converted_at)}</p>
                        )}
                      </div>
                    </div>

                    <div className="w-full max-w-xl min-w-0 space-y-3">
                      <Textarea
                        value={notesById[application.id] ?? ""}
                        onChange={(event) =>
                          setNotesById((current) => ({
                            ...current,
                            [application.id]: event.target.value,
                          }))
                        }
                        placeholder="Notas internas para la organizacion"
                      />
                      <div className="flex flex-wrap gap-2">
                        {!application.converted_person_id ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleConvert(application.id)}
                            disabled={isPending}
                          >
                            Aprobar y convertir
                          </Button>
                        ) : (
                          <Button type="button" size="sm" variant="outline" disabled>
                            Convertida
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReview(application.id, "rejected")}
                          disabled={isPending}
                        >
                          Rechazar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReview(application.id, "pending")}
                          disabled={isPending}
                        >
                          Dejar pendiente
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
              No hay solicitudes publicas de voluntariado.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
