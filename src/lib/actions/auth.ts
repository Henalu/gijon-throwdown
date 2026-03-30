"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import { getDefaultRouteForRole } from "@/lib/auth/permissions";
import { syncProfileEditionLinks } from "@/lib/editions";
import { findOrCreatePerson } from "@/lib/people-registry";

function resolveSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
}

function buildAuthRedirect(path: string) {
  const siteUrl = resolveSiteUrl();

  if (!siteUrl) {
    throw new Error("Falta configurar NEXT_PUBLIC_SITE_URL para los enlaces de acceso");
  }

  return `${siteUrl}/auth/callback?next=${encodeURIComponent(path)}`;
}

function validatePassword(password: string) {
  if (password.length < 8) {
    return "La contrasena debe tener al menos 8 caracteres";
  }

  return null;
}

export async function requestPasswordReset(input: {
  email: string;
}): Promise<{ error: string } | { success: true }> {
  const email = input.email.trim().toLowerCase();

  if (!email) {
    return { error: "Necesitamos un email para enviar la recuperacion" };
  }

  try {
    const redirectTo = buildAuthRedirect("/auth/reset-password");
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return { error: error.message };
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo preparar el enlace de recuperacion",
    };
  }

  return { success: true };
}

export async function updateCurrentUserPassword(input: {
  password: string;
}): Promise<{ error: string } | { success: true; redirectTo: string }> {
  const session = await getCurrentSessionProfile();

  if (!session.user) {
    return { error: "No se pudo recuperar tu sesion de acceso" };
  }

  const passwordError = validatePassword(input.password);
  if (passwordError) {
    return { error: passwordError };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (error) {
    return { error: error.message };
  }

  if (session.profile?.setup_completed_at === null) {
    return {
      success: true,
      redirectTo: "/auth/setup",
    };
  }

  if (!session.profile) {
    return {
      success: true,
      redirectTo: "/auth/login",
    };
  }

  return {
    success: true,
    redirectTo: getDefaultRouteForRole(session.profile),
  };
}

export async function completeInvitedUserSetup(input: {
  fullName: string;
  password: string;
}): Promise<{ error: string } | { success: true; redirectTo: string }> {
  const session = await getCurrentSessionProfile();

  if (!session.user || !session.profile) {
    return { error: "No autenticado" };
  }

  if (!session.profile.is_active) {
    return { error: "Tu acceso esta desactivado" };
  }

  if (session.profile.setup_completed_at) {
    return {
      success: true,
      redirectTo: getDefaultRouteForRole(session.profile),
    };
  }

  const fullName = input.fullName.trim();
  if (!fullName) {
    return { error: "Necesitamos tu nombre para completar el acceso" };
  }

  const passwordError = validatePassword(input.password);
  if (passwordError) {
    return { error: passwordError };
  }

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.updateUser({
    password: input.password,
    data: {
      full_name: fullName,
      role: session.profile.role,
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  const adminClient = createAdminClient();
  const now = new Date().toISOString();
  const normalizedEmail = session.user.email ?? session.profile.email;
  let personId = session.profile.person_id;

  if (!personId) {
    const person = await findOrCreatePerson(adminClient, {
      fullName,
      email: normalizedEmail,
      notes: "Persona creada durante auth/setup para un perfil sin person_id",
    });
    personId = person.id;
  }

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      full_name: fullName,
      email: normalizedEmail,
      person_id: personId,
      setup_completed_at: now,
    })
    .eq("id", session.user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  if (personId) {
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? fullName.trim();
    const lastName = nameParts.slice(1).join(" ").trim() || null;

    const { error: personError } = await adminClient
      .from("people")
      .update({
        first_name: firstName,
        last_name: lastName,
        full_name: fullName.trim(),
        primary_email: normalizedEmail,
        updated_at: now,
      })
      .eq("id", personId);

    if (personError) {
      return { error: personError.message };
    }

    await syncProfileEditionLinks({
      adminClient,
      personId,
      profileId: session.user.id,
      invitedAt: session.profile.invited_at,
      activatedAt: now,
    });
  }

  return {
    success: true,
    redirectTo: getDefaultRouteForRole(session.profile),
  };
}
