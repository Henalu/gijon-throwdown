"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AuthProfile } from "@/lib/auth/permissions";
import { RequestResetForm } from "./request-reset-form";
import { ResetPasswordForm } from "./reset-password-form";

type ResetPasswordState =
  | { kind: "loading" }
  | {
      kind: "ready";
      email: string | null;
      isRecoverySession: boolean;
      shouldGoToSetup: boolean;
    };

export function ResetPasswordPageClient() {
  const [state, setState] = useState<ResetPasswordState>({ kind: "loading" });

  useEffect(() => {
    let isCancelled = false;

    async function loadResetState() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let profile: AuthProfile | null = null;

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select(
            "id, person_id, role, full_name, email, is_active, is_judge, can_validate_scores, invited_at, setup_completed_at",
          )
          .eq("id", user.id)
          .maybeSingle();

        profile = (data as AuthProfile | null) ?? null;
      }

      if (!isCancelled) {
        setState({
          kind: "ready",
          email: user?.email ?? profile?.email ?? null,
          isRecoverySession: Boolean(user),
          shouldGoToSetup: Boolean(user && profile && !profile.setup_completed_at),
        });
      }
    }

    loadResetState();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.kind === "ready" && state.shouldGoToSetup) {
      window.location.replace("/auth/setup");
    }
  }, [state]);

  if (state.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[1.75rem] border border-border/70 bg-card/80 p-6 text-center shadow-2xl shadow-black/20">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-brand-green/20 bg-brand-green/10 text-brand-green">
            <Loader2 className="size-5 animate-spin" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-brand-green/80">
            Recuperacion
          </p>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground">
            Estamos preparando tu acceso
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Un segundo. Estamos comprobando si vienes desde un enlace de
            recuperacion o si necesitas pedir uno nuevo.
          </p>
        </div>
      </div>
    );
  }

  if (state.shouldGoToSetup) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 md:min-h-[calc(100vh-5rem)] md:grid-cols-[0.95fr_1.05fr] md:items-center">
        <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 md:p-8">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
            Recuperacion
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
            {state.isRecoverySession
              ? "Fija una nueva contrasena y vuelve a entrar con normalidad"
              : "Recupera tu acceso sin pelearte con el panel"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
            {state.isRecoverySession
              ? "Has llegado desde un enlace valido de recuperacion o desde una sesion ya abierta. Define una nueva contrasena y te devolveremos a tu panel."
              : "Introduce tu email y te enviaremos un enlace para crear una nueva contrasena. Si la cuenta existe, el correo saldra sin necesidad de hacer rituales extra."}
          </p>
        </div>

        <div className="w-full rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 md:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight">
              <span className="text-white">GT</span>
              <span className="text-brand-green">.</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {state.isRecoverySession
                ? "Actualiza tu contrasena y retoma el acceso"
                : "Pide un enlace de recuperacion para tu cuenta"}
            </p>
          </div>

          {state.email && (
            <div className="mb-6 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Cuenta
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {state.email}
              </p>
            </div>
          )}

          {state.isRecoverySession ? <ResetPasswordForm /> : <RequestResetForm />}
        </div>
      </div>
    </div>
  );
}
