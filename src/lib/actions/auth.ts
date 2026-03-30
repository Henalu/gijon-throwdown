"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import { getDefaultRouteForRole } from "@/lib/auth/permissions";
import { syncProfileEditionLinks } from "@/lib/editions";

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

  if (input.password.length < 8) {
    return { error: "La contrasena debe tener al menos 8 caracteres" };
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
  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      full_name: fullName,
      email: session.user.email ?? session.profile.email,
      setup_completed_at: now,
    })
    .eq("id", session.user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  if (session.profile.person_id) {
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? fullName.trim();
    const lastName = nameParts.slice(1).join(" ").trim() || null;

    const { error: personError } = await adminClient
      .from("people")
      .update({
        first_name: firstName,
        last_name: lastName,
        full_name: fullName.trim(),
        primary_email: session.user.email ?? session.profile.email,
        updated_at: now,
      })
      .eq("id", session.profile.person_id);

    if (personError) {
      return { error: personError.message };
    }

    await syncProfileEditionLinks({
      adminClient,
      personId: session.profile.person_id,
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
