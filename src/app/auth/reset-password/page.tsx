import { redirect } from "next/navigation";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import { RequestResetForm } from "./request-reset-form";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const session = await getCurrentSessionProfile();

  if (session.user && session.profile && !session.profile.setup_completed_at) {
    redirect("/auth/setup");
  }

  const email = session.user?.email ?? session.profile?.email ?? null;
  const isRecoverySession = Boolean(session.user);

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 md:min-h-[calc(100vh-5rem)] md:grid-cols-[0.95fr_1.05fr] md:items-center">
        <div className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 md:p-8">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
            Recuperacion
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
            {isRecoverySession
              ? "Fija una nueva contrasena y vuelve a entrar con normalidad"
              : "Recupera tu acceso sin pelearte con el panel"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
            {isRecoverySession
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
              {isRecoverySession
                ? "Actualiza tu contrasena y retoma el acceso"
                : "Pide un enlace de recuperacion para tu cuenta"}
            </p>
          </div>

          {email && (
            <div className="mb-6 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Cuenta
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {email}
              </p>
            </div>
          )}

          {isRecoverySession ? <ResetPasswordForm /> : <RequestResetForm />}
        </div>
      </div>
    </div>
  );
}
