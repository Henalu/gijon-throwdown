"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { getPostLoginRoute, type AuthProfile } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const errorMessages: Record<string, string> = {
  auth_failed: "No se pudo completar el acceso. Intentalo de nuevo.",
  invite_failed: "No se pudo abrir la invitacion. Pide a la organizacion que la reenvie.",
  inactive: "Tu usuario existe, pero ahora mismo esta desactivado.",
  missing_profile: "La cuenta no tiene perfil operativo asociado todavia.",
  recovery_failed: "No se pudo abrir el enlace de recuperacion. Pide uno nuevo.",
};

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const queryError = searchParams.get("error");
  const helperMessage = useMemo(
    () => (queryError ? errorMessages[queryError] : ""),
    [queryError],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(userError?.message ?? "No se pudo recuperar tu sesion");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, person_id, role, full_name, email, is_active, is_judge, can_validate_scores, invited_at, setup_completed_at",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setError(profileError?.message ?? "Tu cuenta no tiene perfil asociado");
      setLoading(false);
      return;
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      setError("Tu acceso esta desactivado. Habla con la organizacion.");
      setLoading(false);
      return;
    }

    const nextRoute = getPostLoginRoute(profile as AuthProfile, redirect);

    router.push(nextRoute);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="tu@email.com"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">Contrasena</Label>
          <Link
            href="/auth/reset-password"
            className="text-xs font-medium text-brand-green transition-colors hover:text-brand-green/80"
          >
            He olvidado mi contrasena
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="********"
        />
      </div>
      {helperMessage && !error && (
        <p className="rounded-xl border border-yellow-500/20 bg-yellow-500/8 px-3 py-2 text-sm text-yellow-500">
          {helperMessage}
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button
        type="submit"
        className="w-full bg-brand-green text-black hover:bg-brand-green/90"
        disabled={loading}
      >
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 md:min-h-[calc(100vh-5rem)] md:grid-cols-[0.95fr_1.05fr] md:items-center">
        <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 md:p-8">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
            Acceso
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
            Entra con tu cuenta y sigue desde donde te toca
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
            Esta pantalla esta pensada para usuarios que ya existen o que han
            recibido una invitacion de la organizacion, tanto para staff como
            para atletas confirmados. Si aun no tienes acceso, puedes dejar tu
            solicitud desde los formularios publicos.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <Link
              href="/registro/voluntarios"
              className="rounded-full bg-white/[0.05] px-3 py-2 text-white transition-colors hover:bg-white/[0.08]"
            >
              Registro voluntarios
            </Link>
            <Link
              href="/registro/equipos"
              className="rounded-full bg-white/[0.05] px-3 py-2 text-white transition-colors hover:bg-white/[0.08]"
            >
              Registro equipos
            </Link>
            <Link
              href="/"
              className="rounded-full border border-white/8 px-3 py-2 text-muted-foreground transition-colors hover:text-white"
            >
              Volver al inicio
            </Link>
          </div>
        </div>

        <div className="w-full rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 md:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight">
              <span className="text-white">GT</span>
              <span className="text-brand-green">.</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Accede a tu superficie operativa o a tu perfil del evento
            </p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
