import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  canAccessVolunteerSurfaceProfile,
  canValidateScoresProfile,
  getDefaultRouteForRole,
  isAdminLikeRole,
  isSuperadminRole,
  sanitizeRedirect,
  type AuthProfile,
} from "@/lib/auth/permissions";

async function loadCurrentSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, person_id, role, full_name, email, is_active, is_judge, can_validate_scores, invited_at, setup_completed_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    profile: (profile as AuthProfile | null) ?? null,
  };
}

function buildLoginRedirect(targetPath: string, error?: string): string {
  const params = new URLSearchParams({
    redirect: sanitizeRedirect(targetPath),
  });

  if (error) {
    params.set("error", error);
  }

  return `/auth/login?${params.toString()}`;
}

export async function getCurrentSessionProfile() {
  return loadCurrentSessionProfile();
}

export async function requireSessionProfile(targetPath: string) {
  const session = await loadCurrentSessionProfile();

  if (!session.user) {
    redirect(buildLoginRedirect(targetPath));
  }

  if (!session.profile) {
    redirect(buildLoginRedirect(targetPath, "missing_profile"));
  }

  if (!session.profile.is_active) {
    redirect(buildLoginRedirect(targetPath, "inactive"));
  }

  return session as {
    supabase: Awaited<ReturnType<typeof createClient>>;
    user: NonNullable<(typeof session)["user"]>;
    profile: NonNullable<(typeof session)["profile"]>;
  };
}

export async function requireAdminLikeProfile(targetPath = "/admin") {
  const session = await requireSessionProfile(targetPath);

  if (!isAdminLikeRole(session.profile.role)) {
    redirect(getDefaultRouteForRole(session.profile));
  }

  return session;
}

export async function requireSuperadminProfile(targetPath = "/admin/usuarios") {
  const session = await requireSessionProfile(targetPath);

  if (!isSuperadminRole(session.profile.role)) {
    redirect("/admin");
  }

  return session;
}

export async function requireValidationProfile(
  targetPath = "/admin/validacion",
) {
  const session = await requireAdminLikeProfile(targetPath);

  if (!canValidateScoresProfile(session.profile)) {
    redirect("/admin");
  }

  return session;
}

export async function requireVolunteerSurfaceProfile(
  targetPath = "/voluntario",
) {
  const session = await requireSessionProfile(targetPath);

  if (!canAccessVolunteerSurfaceProfile(session.profile)) {
    redirect(getDefaultRouteForRole(session.profile));
  }

  return session;
}
