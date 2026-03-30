"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getActiveEditionId,
  upsertAthleteEditionParticipation,
  upsertVolunteerEditionParticipation,
} from "@/lib/editions";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import { isAdminLikeRole } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createUniqueTeamSlug,
  ensureProfileForPerson,
  findOrCreatePerson,
  getProfileByEmail,
  splitFullName,
} from "@/lib/people-registry";
import type {
  RegistrationMemberGender,
  RegistrationStatus,
} from "@/types";

const registrationStatuses = ["pending", "approved", "rejected"] as const;
const memberGenders = ["male", "female"] as const;

const volunteerApplicationSchema = z.object({
  firstName: z.string().trim().min(2, "Necesitamos el nombre"),
  lastName: z.string().trim().min(2, "Necesitamos los apellidos"),
  email: z.string().trim().email("Introduce un email valido"),
  shirtSize: z.string().trim().min(1, "Selecciona una talla"),
  dietaryRestrictions: z.string().trim().max(500).optional(),
  isJudge: z.boolean().default(false),
  consentAccepted: z
    .boolean()
    .refine(
      (value) => value,
      "Necesitamos tu consentimiento para guardar la solicitud",
    ),
});

const teamMemberSchema = z.object({
  fullName: z.string().trim().min(2, "Falta el nombre del atleta"),
  email: z.string().trim().email("Introduce un email valido"),
  shirtSize: z.string().trim().min(1, "Selecciona una talla"),
  gender: z.enum(memberGenders),
});

const teamRegistrationSchema = z
  .object({
    categoryId: z.string().uuid("Selecciona una categoria valida"),
    teamName: z.string().trim().min(2, "Necesitamos el nombre del equipo"),
    consentAccepted: z
      .boolean()
      .refine(
        (value) => value,
        "Necesitamos tu consentimiento para guardar la preinscripcion",
      ),
    members: z
      .array(teamMemberSchema)
      .length(4, "La preinscripcion debe incluir 4 atletas"),
  })
  .superRefine((input, ctx) => {
    const maleCount = input.members.filter(
      (member) => member.gender === "male",
    ).length;
    const femaleCount = input.members.filter(
      (member) => member.gender === "female",
    ).length;

    if (maleCount !== 3 || femaleCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La composicion debe ser de 3 chicos y 1 chica",
        path: ["members"],
      });
    }

    const normalizedEmails = input.members.map((member) =>
      member.email.trim().toLowerCase(),
    );
    if (new Set(normalizedEmails).size !== normalizedEmails.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "No puede haber emails repetidos dentro del equipo",
        path: ["members"],
      });
    }
  });

const reviewSchema = z.object({
  id: z.string().uuid("Registro no valido"),
  status: z.enum(registrationStatuses),
  adminNotes: z.string().trim().max(600).optional(),
});

function getFirstIssueMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Revisa los datos del formulario";
}

function normalizeNotes(notes: string | undefined) {
  const value = notes?.trim();
  return value ? value : null;
}

function revalidateRegistrationSurfaces() {
  revalidatePath("/admin/voluntarios");
  revalidatePath("/admin/equipos");
  revalidatePath("/admin/personas");
}

async function requireAdminActor() {
  const session = await getCurrentSessionProfile();

  if (!session.user || !session.profile) {
    return { ok: false as const, error: "Necesitas iniciar sesion" };
  }

  if (!session.profile.is_active || !isAdminLikeRole(session.profile.role)) {
    return {
      ok: false as const,
      error: "No tienes permisos para revisar registros",
    };
  }

  return {
    ok: true as const,
    user: session.user,
    profile: session.profile,
  };
}

export async function submitVolunteerApplication(input: {
  firstName: string;
  lastName: string;
  email: string;
  shirtSize: string;
  dietaryRestrictions?: string;
  isJudge: boolean;
  consentAccepted: boolean;
}): Promise<{ error: string } | { success: true }> {
  const parsed = volunteerApplicationSchema.safeParse(input);

  if (!parsed.success) {
    return { error: getFirstIssueMessage(parsed.error) };
  }

  const adminClient = createAdminClient();
  const email = parsed.data.email.trim().toLowerCase();

  const { data: existingApplication, error: existingError } = await adminClient
    .from("volunteer_applications")
    .select("id, status")
    .eq("email", email)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message };
  }

  if (existingApplication) {
    return {
      error:
        existingApplication.status === "approved"
          ? "Ya existe una solicitud aprobada para este email"
          : "Ya existe una solicitud pendiente para este email",
    };
  }

  const { error } = await adminClient.from("volunteer_applications").insert({
    first_name: parsed.data.firstName.trim(),
    last_name: parsed.data.lastName.trim(),
    email,
    shirt_size: parsed.data.shirtSize.trim(),
    dietary_restrictions: normalizeNotes(parsed.data.dietaryRestrictions),
    is_judge: parsed.data.isJudge,
    consent_accepted_at: new Date().toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidateRegistrationSurfaces();
  return { success: true };
}

export async function submitTeamRegistration(input: {
  categoryId: string;
  teamName: string;
  consentAccepted: boolean;
  members: Array<{
    fullName: string;
    email: string;
    shirtSize: string;
    gender: RegistrationMemberGender;
  }>;
}): Promise<{ error: string } | { success: true }> {
  const parsed = teamRegistrationSchema.safeParse(input);

  if (!parsed.success) {
    return { error: getFirstIssueMessage(parsed.error) };
  }

  const adminClient = createAdminClient();
  const responsibleMember = parsed.data.members[0];
  const leaderName = responsibleMember.fullName.trim();
  const leaderEmail = responsibleMember.email.trim().toLowerCase();

  const { data: category, error: categoryError } = await adminClient
    .from("categories")
    .select("id, is_team")
    .eq("id", parsed.data.categoryId)
    .maybeSingle();

  if (categoryError) {
    return { error: categoryError.message };
  }

  if (!category) {
    return { error: "La categoria seleccionada ya no esta disponible" };
  }

  if (!category.is_team) {
    return { error: "La categoria seleccionada no admite equipos" };
  }

  const teamName = parsed.data.teamName.trim();
  const [existingByLeader, existingByName] = await Promise.all([
    adminClient
      .from("team_registrations")
      .select("id, status")
      .eq("leader_email", leaderEmail)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    adminClient
      .from("team_registrations")
      .select("id, status")
      .eq("team_name", teamName)
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (existingByLeader.error) {
    return { error: existingByLeader.error.message };
  }

  if (existingByName.error) {
    return { error: existingByName.error.message };
  }

  const existingRegistration = existingByLeader.data ?? existingByName.data;

  if (existingRegistration) {
    return {
      error:
        existingRegistration.status === "approved"
          ? "Ya existe una inscripcion aprobada con esos datos"
          : "Ya existe una preinscripcion pendiente con esos datos",
    };
  }

  const { data: registration, error: registrationError } = await adminClient
    .from("team_registrations")
    .insert({
      category_id: parsed.data.categoryId,
      team_name: teamName,
      leader_name: leaderName,
      leader_email: leaderEmail,
      consent_accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (registrationError || !registration) {
    return {
      error:
        registrationError?.message ??
        "No se pudo guardar la preinscripcion del equipo",
    };
  }

  const membersPayload = parsed.data.members.map((member, index) => ({
    team_registration_id: registration.id,
    full_name: member.fullName.trim(),
    email: member.email.trim().toLowerCase(),
    shirt_size: member.shirtSize.trim(),
    gender: member.gender,
    sort_order: index,
  }));

  const { error: membersError } = await adminClient
    .from("team_registration_members")
    .insert(membersPayload);

  if (membersError) {
    await adminClient
      .from("team_registrations")
      .delete()
      .eq("id", registration.id);
    return { error: membersError.message };
  }

  revalidateRegistrationSurfaces();
  return { success: true };
}

export async function reviewVolunteerApplication(input: {
  id: string;
  status: RegistrationStatus;
  adminNotes?: string;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: getFirstIssueMessage(parsed.error) };
  }

  const status = parsed.data.status;
  const now = new Date().toISOString();
  const adminClient = createAdminClient();
  const { data: existingApplication, error: existingApplicationError } =
    await adminClient
      .from("volunteer_applications")
      .select("id, status, converted_person_id, converted_profile_id")
      .eq("id", parsed.data.id)
      .maybeSingle();

  if (existingApplicationError) {
    return { error: existingApplicationError.message };
  }

  if (!existingApplication) {
    return { error: "Solicitud no encontrada" };
  }

  if (
    (existingApplication.converted_person_id ||
      existingApplication.converted_profile_id) &&
    status !== existingApplication.status
  ) {
    return {
      error:
        "La solicitud ya fue convertida y no puede volver a revision desde este panel",
    };
  }

  const { error } = await adminClient
    .from("volunteer_applications")
    .update({
      status,
      admin_notes: normalizeNotes(parsed.data.adminNotes),
      reviewed_by: status === "pending" ? null : actor.user.id,
      reviewed_at: status === "pending" ? null : now,
      updated_at: now,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidateRegistrationSurfaces();
  return { success: true };
}

export async function reviewTeamRegistration(input: {
  id: string;
  status: RegistrationStatus;
  adminNotes?: string;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: getFirstIssueMessage(parsed.error) };
  }

  const status = parsed.data.status;
  const now = new Date().toISOString();
  const adminClient = createAdminClient();
  const { data: existingRegistration, error: existingRegistrationError } =
    await adminClient
      .from("team_registrations")
      .select("id, status, converted_team_id")
      .eq("id", parsed.data.id)
      .maybeSingle();

  if (existingRegistrationError) {
    return { error: existingRegistrationError.message };
  }

  if (!existingRegistration) {
    return { error: "Preinscripcion no encontrada" };
  }

  if (
    existingRegistration.converted_team_id &&
    status !== existingRegistration.status
  ) {
    return {
      error:
        "La preinscripcion ya fue convertida y no puede volver a revision desde este panel",
    };
  }

  const { error } = await adminClient
    .from("team_registrations")
    .update({
      status,
      admin_notes: normalizeNotes(parsed.data.adminNotes),
      reviewed_by: status === "pending" ? null : actor.user.id,
      reviewed_at: status === "pending" ? null : now,
      updated_at: now,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  revalidateRegistrationSurfaces();
  return { success: true };
}

export async function convertVolunteerApplication(input: {
  id: string;
}): Promise<
  | { error: string }
  | {
      success: true;
      personId: string;
      profileId: string;
      invited: boolean;
    }
> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  if (!input.id) {
    return { error: "Solicitud no valida" };
  }

  const adminClient = createAdminClient();
  const { data: application, error: applicationError } = await adminClient
    .from("volunteer_applications")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (applicationError) {
    return { error: applicationError.message };
  }

  if (!application) {
    return { error: "Solicitud no encontrada" };
  }

  if (application.converted_person_id && application.converted_profile_id) {
    return {
      success: true,
      personId: application.converted_person_id,
      profileId: application.converted_profile_id,
      invited: false,
    };
  }

  try {
    const now = new Date().toISOString();
    const existingProfile = await getProfileByEmail(adminClient, application.email);
    const person = await findOrCreatePerson(adminClient, {
      preferredPersonId: existingProfile?.person_id ?? application.converted_person_id,
      fullName: `${application.first_name} ${application.last_name}`.trim(),
      email: application.email,
      shirtSize: application.shirt_size,
      dietaryRestrictions: application.dietary_restrictions,
      notes: "Persona convertida desde solicitud de voluntariado",
    });

    const ensuredProfile = await ensureProfileForPerson({
      adminClient,
      personId: person.id,
      email: application.email,
      fullName: person.full_name,
      requestedRole: "volunteer",
      isJudge: application.is_judge === true,
      isActive: true,
    });

    await upsertVolunteerEditionParticipation({
      adminClient,
      personId: ensuredProfile.personId,
      profileId: ensuredProfile.profileId,
      invitedAt: ensuredProfile.invited ? now : null,
    });

    const { error } = await adminClient
      .from("volunteer_applications")
      .update({
        status: "approved",
        converted_person_id: ensuredProfile.personId,
        converted_profile_id: ensuredProfile.profileId,
        converted_at: now,
        converted_by: actor.user.id,
        reviewed_by: actor.user.id,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", input.id);

    if (error) {
      return { error: error.message };
    }

    revalidateRegistrationSurfaces();
    revalidatePath("/admin/usuarios");

    return {
      success: true,
      personId: ensuredProfile.personId,
      profileId: ensuredProfile.profileId,
      invited: ensuredProfile.invited,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo convertir la solicitud de voluntariado",
    };
  }
}

export async function convertTeamRegistration(input: {
  id: string;
}): Promise<
  | { error: string }
  | {
      success: true;
      teamId: string;
    }
> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  if (!input.id) {
    return { error: "Preinscripcion no valida" };
  }

  const adminClient = createAdminClient();
  const { data: registration, error: registrationError } = await adminClient
    .from("team_registrations")
    .select("*, team_registration_members(*)")
    .eq("id", input.id)
    .maybeSingle();

  if (registrationError) {
    return { error: registrationError.message };
  }

  if (!registration) {
    return { error: "Preinscripcion no encontrada" };
  }

  if (registration.converted_team_id) {
    return {
      success: true,
      teamId: registration.converted_team_id,
    };
  }

  const members = (registration.team_registration_members ?? []).slice().sort(
    (
      left: {
        sort_order: number;
      },
      right: {
        sort_order: number;
      },
    ) => left.sort_order - right.sort_order,
  );

  if (members.length !== 4) {
    return { error: "La preinscripcion debe tener 4 atletas para convertirla" };
  }

  try {
    const activeEditionId = await getActiveEditionId(adminClient);

    if (!activeEditionId) {
      return {
        error:
          "Todavia no hay una edicion activa configurada para convertir equipos",
      };
    }

    for (const member of members) {
      const existingProfile = await getProfileByEmail(adminClient, member.email);
      const person = await findOrCreatePerson(adminClient, {
        preferredPersonId: existingProfile?.person_id ?? member.converted_person_id,
        fullName: member.full_name,
        email: member.email,
        gender: member.gender,
        shirtSize: member.shirt_size,
        notes: "Persona vinculada desde preinscripcion de equipo",
      });

      const { data: existingAthlete } = await adminClient
        .from("athletes")
        .select("id, team_id, edition_id")
        .eq("person_id", person.id)
        .eq("edition_id", activeEditionId)
        .maybeSingle();

      if (existingAthlete) {
        return {
          error: `La persona ${person.full_name} ya esta vinculada a un atleta confirmado`,
        };
      }
    }

    const slug = await createUniqueTeamSlug({
      adminClient,
      categoryId: registration.category_id,
      editionId: activeEditionId,
      teamName: registration.team_name,
    });

    const { data: createdTeam, error: teamError } = await adminClient
      .from("teams")
      .insert({
        edition_id: activeEditionId,
        category_id: registration.category_id,
        name: registration.team_name,
        slug,
      })
      .select("id")
      .single();

    if (teamError || !createdTeam) {
      return {
        error: teamError?.message ?? "No se pudo crear el equipo definitivo",
      };
    }

    const memberUpdates: Array<{
      id: string;
      converted_person_id: string;
      converted_athlete_id: string;
    }> = [];
    const createdAthleteIds: string[] = [];

    for (const member of members) {
      const existingProfile = await getProfileByEmail(adminClient, member.email);
      const person = await findOrCreatePerson(adminClient, {
        preferredPersonId: existingProfile?.person_id ?? member.converted_person_id,
        fullName: member.full_name,
        email: member.email,
        gender: member.gender,
        shirtSize: member.shirt_size,
        notes: "Persona vinculada desde preinscripcion de equipo",
      });
      const nameParts = splitFullName(member.full_name);

      const { data: createdAthlete, error: athleteError } = await adminClient
        .from("athletes")
        .insert({
          edition_id: activeEditionId,
          team_id: createdTeam.id,
          person_id: person.id,
          first_name: nameParts.firstName,
          last_name: nameParts.lastName ?? "",
          sort_order: member.sort_order,
        })
        .select("id")
        .single();

      if (athleteError || !createdAthlete) {
        await adminClient.from("teams").delete().eq("id", createdTeam.id);
        return {
          error: athleteError?.message ?? "No se pudo crear un atleta del equipo",
        };
      }

      memberUpdates.push({
        id: member.id,
        converted_person_id: person.id,
        converted_athlete_id: createdAthlete.id,
      });
      createdAthleteIds.push(createdAthlete.id);
    }

    for (const memberUpdate of memberUpdates) {
      const { error } = await adminClient
        .from("team_registration_members")
        .update({
          converted_person_id: memberUpdate.converted_person_id,
          converted_athlete_id: memberUpdate.converted_athlete_id,
        })
        .eq("id", memberUpdate.id);

      if (error) {
        return { error: error.message };
      }
    }

    const now = new Date().toISOString();
    const { error: registrationUpdateError } = await adminClient
      .from("team_registrations")
      .update({
        status: "approved",
        converted_team_id: createdTeam.id,
        converted_at: now,
        converted_by: actor.user.id,
        reviewed_by: actor.user.id,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", input.id);

    if (registrationUpdateError) {
      return { error: registrationUpdateError.message };
    }

    for (const athleteId of createdAthleteIds) {
      await upsertAthleteEditionParticipation(adminClient, athleteId);
    }

    revalidateRegistrationSurfaces();
    revalidatePath("/clasificacion");
    revalidatePath("/cuenta");

    return {
      success: true,
      teamId: createdTeam.id,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo convertir la preinscripcion del equipo",
    };
  }
}

export async function inviteTeamRegistrationAthletes(input: {
  id: string;
}): Promise<
  | { error: string }
  | {
      success: true;
      invitedCount: number;
      linkedCount: number;
      skippedCount: number;
    }
> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  if (!input.id?.trim()) {
    return { error: "Preinscripcion no valida" };
  }

  const adminClient = createAdminClient();
  const { data: registration, error: registrationError } = await adminClient
    .from("team_registrations")
    .select("id, converted_team_id, team_registration_members(*)")
    .eq("id", input.id)
    .maybeSingle();

  if (registrationError) {
    return { error: registrationError.message };
  }

  if (!registration) {
    return { error: "Preinscripcion no encontrada" };
  }

  if (!registration.converted_team_id) {
    return { error: "Primero hay que convertir el equipo en entidad real" };
  }

  const members = (registration.team_registration_members ?? []).filter(
    (member: { converted_person_id: string | null }) => member.converted_person_id,
  );

  if (members.length === 0) {
    return { error: "No hay atletas convertidos para invitar" };
  }

  let invitedCount = 0;
  let linkedCount = 0;
  let skippedCount = 0;

  try {
    for (const member of members) {
      const { data: person, error: personError } = await adminClient
        .from("people")
        .select("id, full_name, primary_email")
        .eq("id", member.converted_person_id)
        .maybeSingle();

      if (personError) {
        return { error: personError.message };
      }

      if (!person?.primary_email) {
        skippedCount += 1;
        continue;
      }

      const ensuredProfile = await ensureProfileForPerson({
        adminClient,
        personId: person.id,
        email: person.primary_email,
        fullName: person.full_name,
        requestedRole: "athlete",
        isActive: true,
      });

      if (ensuredProfile.invited) {
        invitedCount += 1;
      } else {
        linkedCount += 1;
      }
    }

    revalidateRegistrationSurfaces();
    revalidatePath("/admin/usuarios");
    revalidatePath("/cuenta");

    return {
      success: true,
      invitedCount,
      linkedCount,
      skippedCount,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudieron invitar los atletas",
    };
  }
}
