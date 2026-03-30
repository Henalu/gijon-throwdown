"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getTeamEditionContext,
  upsertAthleteEditionParticipation,
} from "@/lib/editions";
import { isAdminLikeRole } from "@/lib/auth/permissions";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import { findOrCreatePerson, splitFullName } from "@/lib/people-registry";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RegistrationMemberGender } from "@/types";

const athleteSchema = z.object({
  teamId: z.string().uuid("Selecciona un equipo valido"),
  fullName: z.string().trim().min(2, "Necesitamos el nombre completo"),
  email: z
    .string()
    .trim()
    .email("Introduce un email valido")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["male", "female"]).nullable(),
  shirtSize: z.string().trim().max(20).optional(),
  instagram: z.string().trim().max(100).optional(),
  photoUrl: z.string().trim().url("La foto debe ser una URL valida").optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

async function requireAdminActor() {
  const session = await getCurrentSessionProfile();

  if (!session.user || !session.profile) {
    return { ok: false as const, error: "Necesitas iniciar sesion" };
  }

  if (!session.profile.is_active || !isAdminLikeRole(session.profile.role)) {
    return {
      ok: false as const,
      error: "No tienes permisos para gestionar atletas",
    };
  }

  return {
    ok: true as const,
    user: session.user,
    profile: session.profile,
  };
}

function revalidateAthleteSurfaces() {
  revalidatePath("/admin/equipos");
  revalidatePath("/admin/personas");
  revalidatePath("/clasificacion");
  revalidatePath("/cuenta");
}

function normalizeOptional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function ensureUniqueAthletePerson(params: {
  adminClient: ReturnType<typeof createAdminClient>;
  athleteId?: string;
  personId: string;
  teamId: string;
}) {
  const { adminClient, athleteId, personId, teamId } = params;
  const targetTeam = await getTeamEditionContext(adminClient, teamId);

  if (!targetTeam?.edition_id) {
    return;
  }

  const { data: existingAthlete, error } = await adminClient
    .from("athletes")
    .select("id, edition_id")
    .eq("person_id", personId)
    .eq("edition_id", targetTeam.edition_id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (
    existingAthlete &&
    (!athleteId || existingAthlete.id !== athleteId)
  ) {
    throw new Error(
      "Esta persona ya esta vinculada a otro atleta en la misma edicion",
    );
  }
}

export async function createAthlete(input: {
  teamId: string;
  fullName: string;
  email?: string;
  gender: RegistrationMemberGender | null;
  shirtSize?: string;
  instagram?: string;
  photoUrl?: string;
  sortOrder?: number;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  const parsed = athleteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos del atleta",
    };
  }

  const adminClient = createAdminClient();

  try {
    const person = await findOrCreatePerson(adminClient, {
      fullName: parsed.data.fullName,
      email: parsed.data.email || null,
      gender: parsed.data.gender,
      shirtSize: parsed.data.shirtSize || null,
      notes: "Persona creada o reutilizada desde CRUD admin de atletas",
    });
    await ensureUniqueAthletePerson({
      adminClient,
      personId: person.id,
      teamId: parsed.data.teamId,
    });

    const teamContext = await getTeamEditionContext(adminClient, parsed.data.teamId);
    const nameParts = splitFullName(parsed.data.fullName);
    const { data: createdAthlete, error } = await adminClient
      .from("athletes")
      .insert({
        edition_id: teamContext?.edition_id ?? null,
        team_id: parsed.data.teamId,
        person_id: person.id,
        first_name: nameParts.firstName,
        last_name: nameParts.lastName ?? "",
        instagram: normalizeOptional(parsed.data.instagram),
        photo_url: normalizeOptional(parsed.data.photoUrl),
        sort_order: parsed.data.sortOrder,
      })
      .select("id")
      .single();

    if (error || !createdAthlete) {
      return { error: error?.message ?? "No se pudo crear el atleta" };
    }

    await upsertAthleteEditionParticipation(adminClient, createdAthlete.id);

    revalidateAthleteSurfaces();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo crear el atleta",
    };
  }
}

export async function updateAthlete(input: {
  id: string;
  teamId: string;
  fullName: string;
  email?: string;
  gender: RegistrationMemberGender | null;
  shirtSize?: string;
  instagram?: string;
  photoUrl?: string;
  sortOrder?: number;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  const athleteId = input.id?.trim();
  if (!athleteId) {
    return { error: "Atleta no valido" };
  }

  const parsed = athleteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos del atleta",
    };
  }

  const adminClient = createAdminClient();
  const { data: existingAthlete, error: athleteError } = await adminClient
    .from("athletes")
    .select("id, person_id")
    .eq("id", athleteId)
    .maybeSingle();

  if (athleteError) {
    return { error: athleteError.message };
  }

  if (!existingAthlete) {
    return { error: "No se encontro el atleta" };
  }

  try {
    const person = await findOrCreatePerson(adminClient, {
      preferredPersonId: existingAthlete.person_id,
      fullName: parsed.data.fullName,
      email: parsed.data.email || null,
      gender: parsed.data.gender,
      shirtSize: parsed.data.shirtSize || null,
      notes: "Persona sincronizada desde CRUD admin de atletas",
    });
    await ensureUniqueAthletePerson({
      adminClient,
      athleteId,
      personId: person.id,
      teamId: parsed.data.teamId,
    });

    const teamContext = await getTeamEditionContext(adminClient, parsed.data.teamId);
    const nameParts = splitFullName(parsed.data.fullName);
    const { error } = await adminClient
      .from("athletes")
      .update({
        edition_id: teamContext?.edition_id ?? null,
        team_id: parsed.data.teamId,
        person_id: person.id,
        first_name: nameParts.firstName,
        last_name: nameParts.lastName ?? "",
        instagram: normalizeOptional(parsed.data.instagram),
        photo_url: normalizeOptional(parsed.data.photoUrl),
        sort_order: parsed.data.sortOrder,
      })
      .eq("id", athleteId);

    if (error) {
      return { error: error.message };
    }

    await upsertAthleteEditionParticipation(adminClient, athleteId);

    revalidateAthleteSurfaces();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el atleta",
    };
  }
}

export async function deleteAthlete(id: string): Promise<
  { error: string } | { success: true }
> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  if (!id?.trim()) {
    return { error: "Atleta no valido" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("athletes").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }
  revalidateAthleteSurfaces();
  return { success: true };
}
