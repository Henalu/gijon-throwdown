"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import {
  ensureProfileForPerson,
  findOrCreatePerson,
  normalizeEmail,
} from "@/lib/people-registry";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RegistrationMemberGender, UserRole } from "@/types";

const editableRoles = ["athlete", "volunteer"] as const;

const personUpdateSchema = z.object({
  id: z.string().uuid("Persona no valida"),
  fullName: z.string().trim().min(2, "Necesitamos el nombre completo"),
  primaryEmail: z.string().trim().email("Introduce un email valido").optional().or(z.literal("")),
  gender: z.enum(["male", "female"]).nullable(),
  shirtSize: z.string().trim().max(20).optional(),
  dietaryRestrictions: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(800).optional(),
});

const personInviteSchema = z.object({
  personId: z.string().uuid("Persona no valida"),
  role: z.enum(editableRoles),
});

async function requireAdminActor() {
  const session = await getCurrentSessionProfile();

  if (!session.user || !session.profile) {
    return { ok: false as const, error: "Necesitas iniciar sesion" };
  }

  if (!session.profile.is_active) {
    return { ok: false as const, error: "Tu acceso esta desactivado" };
  }

  if (session.profile.role !== "superadmin" && session.profile.role !== "admin") {
    return {
      ok: false as const,
      error: "No tienes permisos para gestionar personas",
    };
  }

  return {
    ok: true as const,
    user: session.user,
    profile: session.profile,
  };
}

function revalidatePeopleSurfaces() {
  revalidatePath("/admin/personas");
  revalidatePath("/admin/voluntarios");
  revalidatePath("/admin/equipos");
  revalidatePath("/cuenta");
}

export async function updatePersonDetails(input: {
  id: string;
  fullName: string;
  primaryEmail?: string;
  gender: RegistrationMemberGender | null;
  shirtSize?: string;
  dietaryRestrictions?: string;
  notes?: string;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  const parsed = personUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos de la persona",
    };
  }

  try {
    const adminClient = createAdminClient();
    await findOrCreatePerson(adminClient, {
      preferredPersonId: parsed.data.id,
      fullName: parsed.data.fullName,
      email: parsed.data.primaryEmail || null,
      gender: parsed.data.gender,
      shirtSize: parsed.data.shirtSize || null,
      dietaryRestrictions: parsed.data.dietaryRestrictions || null,
      notes: parsed.data.notes || null,
    });

    revalidatePeopleSurfaces();
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la persona",
    };
  }
}

export async function invitePersonAccount(input: {
  personId: string;
  role: Extract<UserRole, "athlete" | "volunteer">;
}): Promise<
  | { error: string }
  | { success: true; invited: boolean; profileId: string }
> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  const parsed = personInviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo preparar la invitacion",
    };
  }

  const adminClient = createAdminClient();
  const { data: person, error: personError } = await adminClient
    .from("people")
    .select("id, full_name, primary_email")
    .eq("id", parsed.data.personId)
    .maybeSingle();

  if (personError) {
    return { error: personError.message };
  }

  if (!person) {
    return { error: "La persona no existe" };
  }

  const normalizedEmail = normalizeEmail(person.primary_email);
  if (!normalizedEmail) {
    return { error: "La persona necesita un email para crear una cuenta" };
  }

  try {
    const ensuredProfile = await ensureProfileForPerson({
      adminClient,
      personId: person.id,
      email: normalizedEmail,
      fullName: person.full_name,
      requestedRole: parsed.data.role,
      isActive: true,
    });

    revalidatePeopleSurfaces();
    revalidatePath("/admin/usuarios");
    return {
      success: true,
      invited: ensuredProfile.invited,
      profileId: ensuredProfile.profileId,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo crear o reutilizar la cuenta",
    };
  }
}
