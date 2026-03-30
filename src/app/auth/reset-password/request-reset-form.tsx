"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await requestPasswordReset({ email });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setSuccessMessage(
        "Si existe una cuenta con ese email, acabamos de enviar un enlace para fijar una nueva contrasena.",
      );
      toast.success("Enlace de recuperacion enviado");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          required
        />
      </div>

      {successMessage && (
        <p className="rounded-xl border border-brand-green/20 bg-brand-green/8 px-3 py-2 text-sm text-brand-green">
          {successMessage}
        </p>
      )}

      <Button
        type="submit"
        className="w-full bg-brand-green text-black hover:bg-brand-green/90"
        disabled={isPending}
      >
        {isPending ? "Enviando enlace..." : "Enviar enlace de recuperacion"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/auth/login" className="text-white transition-colors hover:text-brand-green">
          Volver al login
        </Link>
      </p>
    </form>
  );
}
