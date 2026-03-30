"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  syncProfileEditionLinks,
  upsertStaffEditionParticipation,
  upsertVolunteerEditionParticipation,
} from "@/lib/editions";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import {
  findOrCreatePerson,
  getProfileByEmail,
  getProfileByPersonId,
} from "@/lib/people-registry";
import type { UserRole } from "@/types";

const VALID_ROLES: UserRole[] = ["superadmin", "admin", "volunteer", "athlete"];

interface UserMutationInput {
  fullName: string;
  role: UserRole;
  isJudge: boolean;
  canValidateScores: boolean;
  isActive: boolean;
}

function isUserRole(value: string): value is UserRole {
  return VALID_ROLES.includes(value as UserRole);
}

function normalizeUserPayload(input: UserMutationInput) {
  return {
    full_name: input.fullName.trim(),
    role: input.role,
    is_judge: input.role === "volunteer" ? input.isJudge : false,
    can_validate_scores: input.role === "admin" ? input.canValidateScores : false,
    is_active: input.isActive,
  };
}

async function requireSuperadminActor() {
  const session = await getCurrentSessionProfile();

  if (!session.user || !session.profile) {
    return { ok: false as const, error: "No autenticado" };
  }

  if (!session.profile.is_active || session.profile.role !== "superadmin") {
    return {
      ok: false as const,
      error: "No tienes permisos para gestionar usuarios",
    };
  }

  return {
    ok: true as const,
    user: session.user,
    profile: session.profile,
  };
}

export async function inviteInternalUser(input: {
  email: string;
  fullName: string;
  role: string;
  isJudge: boolean;
  canValidateScores: boolean;
  isActive: boolean;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireSuperadminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();

  if (!email) {
    return { error: "El email es obligatorio" };
  }

  if (!fullName) {
    return { error: "El nombre es obligatorio" };
  }

  if (!isUserRole(input.role)) {
    return { error: "Rol no valido" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (!siteUrl) {
    return { error: "Falta configurar NEXT_PUBLIC_SITE_URL para las invitaciones" };
  }

  const adminClient = createAdminClient();
  const person = await findOrCreatePerson(adminClient, {
    fullName,
    email,
    notes: "Persona creada o reutilizada desde invitacion interna",
  });

  const [existingProfileByEmail, existingProfileByPerson] = await Promise.all([
    getProfileByEmail(adminClient, email),
    getProfileByPersonId(adminClient, person.id),
  ]);

  if (existingProfileByEmail) {
    return { error: "Ya existe un usuario con ese email" };
  }

  if (existingProfileByPerson) {
    return {
      error: `La persona ya tiene una cuenta vinculada a ${existingProfileByPerson.email}`,
    };
  }

  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent("/auth/setup")}`;

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role: input.role,
    },
    redirectTo,
  });

  if (error) {
    return { error: error.message };
  }

  const userId = data.user?.id;
  if (!userId) {
    return { error: "No se pudo crear la invitacion en Supabase" };
  }

  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      ...normalizeUserPayload({
        fullName,
        role: input.role,
        isJudge: input.isJudge,
        canValidateScores: input.canValidateScores,
        isActive: input.isActive,
      }),
      email,
      person_id: person.id,
      invited_at: new Date().toISOString(),
      setup_completed_at: null,
    })
    .eq("id", userId);

  if (updateError) {
    return { error: updateError.message };
  }

  const invitedAt = new Date().toISOString();
  await syncProfileEditionLinks({
    adminClient,
    personId: person.id,
    profileId: userId,
    invitedAt,
  });

  if (input.role === "volunteer") {
    await upsertVolunteerEditionParticipation({
      adminClient,
      personId: person.id,
      profileId: userId,
      invitedAt,
    });
  }

  if (input.role === "admin" || input.role === "superadmin") {
    await upsertStaffEditionParticipation({
      adminClient,
      personId: person.id,
      profileId: userId,
      invitedAt,
    });
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/voluntarios");
  return { success: true };
}

export async function updateInternalUser(
  input: {
    id: string;
    fullName: string;
    role: string;
    isJudge: boolean;
    canValidateScores: boolean;
    isActive: boolean;
  },
): Promise<{ error: string } | { success: true }> {
  const actor = await requireSuperadminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  if (!input.id) {
    return { error: "Usuario no valido" };
  }

  if (!isUserRole(input.role)) {
    return { error: "Rol no valido" };
  }

  const fullName = input.fullName.trim();
  if (!fullName) {
    return { error: "El nombre es obligatorio" };
  }

  if (actor.user.id === input.id && !input.isActive) {
    return { error: "No puedes desactivar tu propio acceso" };
  }

  if (actor.user.id === input.id && input.role !== "superadmin") {
    return { error: "No puedes quitarte el rol de superadmin a ti mismo" };
  }

  const adminClient = createAdminClient();
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("person_id, email")
    .eq("id", input.id)
    .maybeSingle();

  if (!existingProfile) {
    return { error: "No se encontro el perfil a actualizar" };
  }

  if (existingProfile.person_id) {
    await findOrCreatePerson(adminClient, {
      preferredPersonId: existingProfile.person_id,
      fullName,
      email: existingProfile.email,
      notes: "Persona sincronizada desde gestion interna de usuarios",
    });
  }

  const { error } = await adminClient
    .from("profiles")
    .update(
      normalizeUserPayload({
        fullName,
        role: input.role,
        isJudge: input.isJudge,
        canValidateScores: input.canValidateScores,
        isActive: input.isActive,
      }),
    )
    .eq("id", input.id);

  if (error) {
    return { error: error.message };
  }

  if (existingProfile.person_id) {
    await syncProfileEditionLinks({
      adminClient,
      personId: existingProfile.person_id,
      profileId: input.id,
    });

    if (input.role === "volunteer") {
      await upsertVolunteerEditionParticipation({
        adminClient,
        personId: existingProfile.person_id,
        profileId: input.id,
      });
    }

    if (input.role === "admin" || input.role === "superadmin") {
      await upsertStaffEditionParticipation({
        adminClient,
        personId: existingProfile.person_id,
        profileId: input.id,
      });
    }
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/voluntarios");
  return { success: true };
}
