"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitVolunteerApplication } from "@/lib/actions/registrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const shirtSizes = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export function VolunteerRegistrationForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [shirtSize, setShirtSize] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [isJudge, setIsJudge] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setShirtSize("");
    setDietaryRestrictions("");
    setIsJudge(false);
    setConsentAccepted(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    startTransition(async () => {
      const result = await submitVolunteerApplication({
        firstName,
        lastName,
        email,
        shirtSize,
        dietaryRestrictions,
        isJudge,
        consentAccepted,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Solicitud enviada");
      resetForm();
      setSubmitted(true);
    });
  }

  return (
    <section className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 md:p-8">
      {submitted ? (
        <div className="space-y-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
            Solicitud recibida
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            Gracias, ya estas en la cola de revision
          </h2>
          <p className="text-sm leading-7 text-muted-foreground">
            Hemos guardado tu solicitud como pendiente. La organizacion la
            revisara y, si sigue adelante, te dara acceso al siguiente paso.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => setSubmitted(false)}>
              Enviar otra solicitud
            </Button>
            <Link
              href="/"
              className="inline-flex h-8 items-center rounded-lg border border-input px-3 text-sm text-white transition-colors hover:bg-white/[0.05]"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Datos basicos
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vol-first-name">Nombre</Label>
                <Input
                  id="vol-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Nombre"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vol-last-name">Apellidos</Label>
                <Input
                  id="vol-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Apellidos"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vol-email">Email</Label>
            <Input
              id="vol-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Talla de camiseta</Label>
            <Select
              value={shirtSize}
              onValueChange={(value) => {
                if (value) setShirtSize(value);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una talla" />
              </SelectTrigger>
              <SelectContent>
                {shirtSizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vol-dietary">Restricciones alimentarias</Label>
            <Textarea
              id="vol-dietary"
              value={dietaryRestrictions}
              onChange={(event) => setDietaryRestrictions(event.target.value)}
              placeholder="Si no tienes ninguna, puedes dejarlo vacio"
            />
          </div>

          <label className="flex items-start gap-3 rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-4 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={isJudge}
              onChange={(event) => setIsJudge(event.target.checked)}
              className="mt-1 accent-brand-green"
            />
            <span>
              <span className="block font-medium text-white">
                Quiero participar como juez
              </span>
              <span className="mt-1 block">
                Marcala solo si quieres arbitrar heats o colaborar en pista con
                funciones de juez. Si no, la dejamos como voluntariado general.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-4 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(event) => setConsentAccepted(event.target.checked)}
              className="mt-1 accent-brand-green"
            />
            <span>
              Acepto que la organizacion guarde estos datos para gestionar el
              voluntariado del evento y futuras comunicaciones relacionadas con
              esta solicitud.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={isPending || !shirtSize || !consentAccepted}
            >
              {isPending ? "Enviando..." : "Enviar solicitud"}
            </Button>
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground transition-colors hover:text-white"
            >
              Ya tienes acceso? Entrar
            </Link>
          </div>
        </form>
      )}
    </section>
  );
}
