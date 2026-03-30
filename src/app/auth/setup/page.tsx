import { redirect } from "next/navigation";
import {
  getDefaultRouteForRole,
  isJudgeProfile,
} from "@/lib/auth/permissions";
import type { ProfileRoleLike } from "@/lib/auth/permissions";
import { requireSessionProfile } from "@/lib/auth/session";
import { SetupForm } from "./setup-form";

function getSetupCopy(profile: NonNullable<ProfileRoleLike>) {
  if (profile.role === "athlete") {
    return {
      eyebrow: "Perfil atleta",
      title: "Activa tu perfil",
      description:
        "La organizacion ya ha preparado tu acceso. Completa tu nombre y fija una contrasena para entrar a tu cuenta de atleta con normalidad.",
      submitLabel: "Activar perfil atleta",
      pendingLabel: "Preparando perfil...",
    };
  }

  if (isJudgeProfile(profile)) {
    return {
      eyebrow: "Perfil juez",
      title: "Activa tu panel juez",
      description:
        "Tu acceso entra por el mismo flujo que voluntariado, pero queda identificado como juez para que la organizacion y tu panel operativo hablen el mismo idioma.",
      submitLabel: "Activar panel juez",
      pendingLabel: "Preparando panel juez...",
    };
  }

  return {
    eyebrow: "Acceso interno",
    title: "Activa tu cuenta",
    description:
      "Te hemos invitado al entorno operativo de Gijon Throwdown. Completa tu nombre y fija una contrasena para entrar con normalidad a partir de ahora.",
    submitLabel: "Activar cuenta",
    pendingLabel: "Activando acceso...",
  };
}

export default async function AuthSetupPage() {
  const { user, profile } = await requireSessionProfile("/auth/setup");

  if (profile.setup_completed_at) {
    redirect(getDefaultRouteForRole(profile));
  }

  const copy = getSetupCopy(profile);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-2xl shadow-black/20">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-green/80">
            {copy.eyebrow}
          </p>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {copy.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {copy.description}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Cuenta invitada
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {user.email ?? profile.email}
          </p>
        </div>

        <div className="mt-6">
          <SetupForm
            defaultName={profile.full_name}
            pendingLabel={copy.pendingLabel}
            submitLabel={copy.submitLabel}
          />
        </div>
      </div>
    </div>
  );
}
