"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  getPostLoginRoute,
  sanitizeRedirect,
  type AuthProfile,
} from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/client";

const emailOtpTypes: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && emailOtpTypes.includes(value as EmailOtpType);
}

function getDefaultNext(type: EmailOtpType | null) {
  if (type === "invite") {
    return "/auth/setup";
  }

  if (type === "recovery") {
    return "/auth/reset-password";
  }

  return "/";
}

function resolveNextTarget(
  searchParams: URLSearchParams,
  fallback: string,
  origin: string,
) {
  const next = searchParams.get("next");
  if (next) {
    return sanitizeRedirect(next, fallback);
  }

  const redirectTo = searchParams.get("redirect_to");
  if (!redirectTo) {
    return fallback;
  }

  try {
    const redirectUrl = new URL(redirectTo);
    if (redirectUrl.origin !== origin) {
      return fallback;
    }

    const resolvedPath = `${redirectUrl.pathname}${redirectUrl.search}`;
    return sanitizeRedirect(resolvedPath, fallback);
  } catch {
    return sanitizeRedirect(redirectTo, fallback);
  }
}

function getAuthErrorCode(type: EmailOtpType | null) {
  if (type === "recovery") {
    return "recovery_failed";
  }

  if (type === "invite") {
    return "invite_failed";
  }

  return "auth_failed";
}

async function resolveAuthenticatedTarget(params: {
  supabase: ReturnType<typeof createClient>;
  requestedTarget: string;
  hasExplicitTarget: boolean;
}) {
  const { supabase, requestedTarget, hasExplicitTarget } = params;

  if (hasExplicitTarget) {
    return requestedTarget;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return requestedTarget;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, person_id, role, full_name, email, is_active, is_judge, can_validate_scores, invited_at, setup_completed_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return requestedTarget;
  }

  return getPostLoginRoute(profile as AuthProfile, null);
}

export function AuthCallbackClient() {
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  useEffect(() => {
    let isCancelled = false;

    async function resolveAuthCallback() {
      const supabase = createClient();
      const queryParams = new URLSearchParams(searchParamsKey);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const rawType = queryParams.get("type") ?? hashParams.get("type");
      const type = isEmailOtpType(rawType) ? rawType : null;
      const fallbackNext = getDefaultNext(type);
      const next = resolveNextTarget(
        queryParams,
        fallbackNext,
        window.location.origin,
      );
      const hasExplicitTarget = Boolean(
        queryParams.get("next") || queryParams.get("redirect_to") || type,
      );

      const redirectToTarget = (target: string) => {
        if (isCancelled) {
          return;
        }

        window.location.replace(target);
      };

      const code = queryParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          redirectToTarget(
            await resolveAuthenticatedTarget({
              supabase,
              requestedTarget: next,
              hasExplicitTarget,
            }),
          );
          return;
        }
      }

      const tokenHash = queryParams.get("token_hash");
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });

        if (!error) {
          redirectToTarget(
            await resolveAuthenticatedTarget({
              supabase,
              requestedTarget: next,
              hasExplicitTarget,
            }),
          );
          return;
        }
      }

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!error) {
          redirectToTarget(
            await resolveAuthenticatedTarget({
              supabase,
              requestedTarget: next,
              hasExplicitTarget,
            }),
          );
          return;
        }
      }

      redirectToTarget(`/auth/login?error=${getAuthErrorCode(type)}`);
    }

    resolveAuthCallback();

    return () => {
      isCancelled = true;
    };
  }, [searchParamsKey]);

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
          Estamos cerrando tu acceso
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Un segundo. Estamos recogiendo la sesion del enlace de Supabase para
          llevarte a la pantalla correcta, sin paseos absurdos por login.
        </p>
      </div>
    </div>
  );
}
