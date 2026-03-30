"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completeInvitedUserSetup } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SetupForm({
  defaultName,
  pendingLabel = "Activando acceso...",
  submitLabel = "Activar cuenta",
}: {
  defaultName: string;
  pendingLabel?: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultName);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Las contrasenas no coinciden");
      return;
    }

    startTransition(async () => {
      const result = await completeInvitedUserSetup({
        fullName,
        password,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Cuenta activada");
      router.push(result.redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="setup-full-name">Nombre completo</Label>
        <Input
          id="setup-full-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Tu nombre y apellidos"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="setup-password">Contrasena</Label>
        <Input
          id="setup-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimo 8 caracteres"
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="setup-confirm-password">Repetir contrasena</Label>
        <Input
          id="setup-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirma la contrasena"
          minLength={8}
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-brand-green text-black hover:bg-brand-green/90"
        disabled={isPending}
      >
        {isPending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
