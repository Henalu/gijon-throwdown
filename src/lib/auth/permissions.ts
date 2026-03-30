import type { Profile, UserRole } from "@/types";

export type AuthProfile = Pick<
  Profile,
  | "person_id"
  | "id"
  | "role"
  | "full_name"
  | "email"
  | "is_active"
  | "is_judge"
  | "can_validate_scores"
  | "invited_at"
  | "setup_completed_at"
>;

export type ProfileRoleLike = Pick<Profile, "role" | "is_judge"> | null | undefined;

export const INTERNAL_ROLES = ["superadmin", "admin", "volunteer"] as const;

export interface AccountShortcut {
  href: string;
  label: string;
  description: string;
}

export function isSuperadminRole(role: UserRole | null | undefined): boolean {
  return role === "superadmin";
}

export function isAdminLikeRole(role: UserRole | null | undefined): boolean {
  return role === "superadmin" || role === "admin";
}

export function isInternalRole(role: UserRole | null | undefined): boolean {
  return role === "superadmin" || role === "admin" || role === "volunteer";
}

export function getRoleLabel(role: UserRole | null | undefined): string {
  switch (role) {
    case "superadmin":
      return "Superadmin";
    case "admin":
      return "Admin";
    case "volunteer":
      return "Voluntario";
    case "athlete":
      return "Atleta";
    default:
      return "Invitado";
  }
}

export function isJudgeProfile(profile: ProfileRoleLike): boolean {
  return profile?.role === "volunteer" && profile.is_judge === true;
}

export function getProfileRoleLabel(profile: ProfileRoleLike): string {
  if (isJudgeProfile(profile)) {
    return "Juez";
  }

  return getRoleLabel(profile?.role);
}

export function getPanelTitle(profile: ProfileRoleLike): string {
  if (isJudgeProfile(profile)) {
    return "Panel juez";
  }

  switch (profile?.role) {
    case "superadmin":
    case "admin":
      return "Panel admin";
    case "volunteer":
      return "Panel voluntario";
    case "athlete":
      return "Panel atleta";
    default:
      return "Mi cuenta";
  }
}

export function isActiveProfile(profile: AuthProfile | null | undefined): boolean {
  return profile?.is_active === true;
}

export function isSetupPending(profile: AuthProfile | null | undefined): boolean {
  return !profile?.setup_completed_at;
}

export function canValidateScoresProfile(
  profile: AuthProfile | null | undefined,
): boolean {
  if (!isActiveProfile(profile)) return false;
  if (isSuperadminRole(profile?.role)) return true;
  return profile?.role === "admin" && profile.can_validate_scores === true;
}

export function canAccessVolunteerSurfaceProfile(
  profile: AuthProfile | null | undefined,
): boolean {
  if (!isActiveProfile(profile)) return false;
  return (
    profile?.role === "superadmin" ||
    profile?.role === "admin" ||
    profile?.role === "volunteer"
  );
}

export function getDefaultRouteForRole(
  roleOrProfile: UserRole | AuthProfile | null | undefined,
): string {
  const role =
    typeof roleOrProfile === "string" ? roleOrProfile : roleOrProfile?.role;

  switch (role) {
    case "superadmin":
    case "admin":
      return "/admin";
    case "volunteer":
      return "/voluntario";
    case "athlete":
      return "/cuenta";
    default:
      return "/";
  }
}

export function sanitizeRedirect(
  redirect: string | null | undefined,
  fallback = "/",
): string {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return fallback;
  }

  return redirect;
}

export function getPostLoginRoute(
  profile: AuthProfile | null | undefined,
  requestedRedirect: string | null | undefined,
): string {
  if (isSetupPending(profile)) {
    return "/auth/setup";
  }

  const safeRedirect = sanitizeRedirect(requestedRedirect, "");

  if (safeRedirect) {
    return safeRedirect;
  }

  return getDefaultRouteForRole(profile);
}

export function getAccountShortcuts(
  profile: AuthProfile | null | undefined,
): AccountShortcut[] {
  if (!isActiveProfile(profile)) {
    return [];
  }

  const shortcuts: AccountShortcut[] = [
    {
      href: "/cuenta",
      label: profile?.role === "athlete" ? "Panel atleta" : "Mi cuenta",
      description:
        profile?.role === "athlete"
          ? "Tu perfil del evento, continuidad y accesos segun tu situacion actual."
          : "Resumen de acceso y accesos rapidos segun tu perfil.",
    },
  ];

  if (profile?.role === "volunteer") {
    shortcuts.push({
      href: "/voluntario",
      label: isJudgeProfile(profile) ? "Panel juez" : "Panel voluntario",
      description: isJudgeProfile(profile)
        ? "Heats asignados, entrada live y operativa de arbitraje."
        : "Entrada live y seguimiento operativo de heats.",
    });
  }

  if (isAdminLikeRole(profile?.role)) {
    shortcuts.push({
      href: "/admin",
      label: "Panel admin",
      description: "Gestion del evento, heats, scoring y configuracion.",
    });
    shortcuts.push({
      href: "/admin/streaming",
      label: "Streaming",
      description: "Embeds, sesiones publicas y control del directo.",
    });
    shortcuts.push({
      href: "/admin/media",
      label: "Media",
      description: "Galeria oficial, descargas y compra por imagen.",
    });
    shortcuts.push({
      href: "/admin/personas",
      label: "Personas",
      description: "Base de personas, vinculaciones y conversiones del sistema.",
    });
  }

  if (canValidateScoresProfile(profile)) {
    shortcuts.push({
      href: "/admin/validacion",
      label: "Validacion oficial",
      description: "Revision final antes de publicar resultados.",
    });
  }

  if (isSuperadminRole(profile?.role)) {
    shortcuts.push({
      href: "/admin/usuarios",
      label: "Usuarios",
      description: "Roles, invitaciones y control de accesos internos.",
    });
  }

  return shortcuts;
}
