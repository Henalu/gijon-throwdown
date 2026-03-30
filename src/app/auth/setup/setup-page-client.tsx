"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getDefaultRouteForRole,
  isJudgeProfile,
  type AuthProfile,
  type ProfileRoleLike,
} from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/client";
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

export function SetupPageClient() {
  const router = useRouter();
  const [status, setStatus] = useState<
    | { kind: "loading" }
    | { kind: "ready"; profile: AuthProfile; email: string | null }
  >({ kind: "loading" });

  useEffect(() => {
    let isCancelled = false;

    async function loadSetupState() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.replace("/auth/login?redirect=%2Fauth%2Fsetup");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "id, person_id, role, full_name, email, is_active, is_judge, can_validate_scores, invited_at, setup_completed_at",
        )
        .eq("id", user.id)
        .maybeSingle();

      const authProfile = (profile as AuthProfile | null) ?? null;

      if (!authProfile) {
        window.location.replace("/auth/login?redirect=%2Fauth%2Fsetup&error=missing_profile");
        return;
      }

      if (!authProfile.is_active) {
        window.location.replace("/auth/login?redirect=%2Fauth%2Fsetup&error=inactive");
        return;
      }

      if (authProfile.setup_completed_at) {
        window.location.replace(getDefaultRouteForRole(authProfile));
        return;
      }

      if (!isCancelled) {
        setStatus({
          kind: "ready",
          profile: authProfile,
          email: user.email ?? authProfile.email,
        });
        router.refresh();
      }
    }

    loadSetupState();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  if (status.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[1.75rem] border border-border/70 bg-card/80 p-6 text-center shadow-2xl shadow-black/20">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-brand-green/20 bg-brand-green/10 text-brand-green">
            <Loader2 className="size-5 animate-spin" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-brand-green/80">
            Acceso
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground">
            Estamos preparando tu setup
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Un segundo. Estamos validando tu sesion para que puedas fijar tu
            contrasena sin pasar antes por login.
          </p>
        </div>
      </div>
    );
  }

  const copy = getSetupCopy(status.profile);

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
          <p className="text-sm text-muted-foreground">{copy.description}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Cuenta invitada
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {status.email ?? status.profile.email}
          </p>
        </div>

        <div className="mt-6">
          <SetupForm
            defaultName={status.profile.full_name}
            pendingLabel={copy.pendingLabel}
            submitLabel={copy.submitLabel}
          />
        </div>
      </div>
    </div>
  );
}
