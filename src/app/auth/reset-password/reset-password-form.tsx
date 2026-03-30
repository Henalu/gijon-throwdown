"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateCurrentUserPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();
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
      const result = await updateCurrentUserPassword({ password });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Contrasena actualizada");
      router.push(result.redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-password">Nueva contrasena</Label>
        <Input
          id="reset-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimo 8 caracteres"
          minLength={8}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-confirm-password">Repetir contrasena</Label>
        <Input
          id="reset-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirma la nueva contrasena"
          minLength={8}
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-brand-green text-black hover:bg-brand-green/90"
        disabled={isPending}
      >
        {isPending ? "Guardando contrasena..." : "Guardar nueva contrasena"}
      </Button>
    </form>
  );
}
