"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { submitTeamRegistration } from "@/lib/actions/registrations";
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
import type { Category, RegistrationMemberGender } from "@/types";

const shirtSizes = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const memberGenderOptions: Array<{
  value: RegistrationMemberGender;
  label: string;
}> = [
  { value: "male", label: "Chico" },
  { value: "female", label: "Chica" },
];

function buildEmptyMembers() {
  return Array.from({ length: 4 }, () => ({
    fullName: "",
    email: "",
    shirtSize: "",
    gender: "male" as RegistrationMemberGender,
  }));
}

export function TeamRegistrationForm({ categories }: { categories: Category[] }) {
  const [categoryId, setCategoryId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [members, setMembers] = useState(buildEmptyMembers);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateMember(
    index: number,
    field: "fullName" | "email" | "shirtSize" | "gender",
    value: string,
  ) {
    setMembers((currentMembers) =>
      currentMembers.map((member, memberIndex) =>
        memberIndex === index
          ? {
              ...member,
              [field]:
                field === "gender"
                  ? (value as RegistrationMemberGender)
                  : value,
            }
          : member,
      ),
    );
  }

  function resetForm() {
    setCategoryId("");
    setTeamName("");
    setConsentAccepted(false);
    setMembers(buildEmptyMembers());
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    startTransition(async () => {
      const result = await submitTeamRegistration({
        categoryId,
        teamName,
        consentAccepted,
        members,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Preinscripcion enviada");
      resetForm();
      setSubmitted(true);
    });
  }

  return (
    <section className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 md:p-8">
      {submitted ? (
        <div className="space-y-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
            Preinscripcion recibida
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            Equipo guardado en revision
          </h2>
          <p className="text-sm leading-7 text-muted-foreground">
            La organizacion ya puede revisar vuestra preinscripcion. En esta
            fase no se generan cuentas ni plazas confirmadas automaticamente.
            Si todo encaja, el siguiente paso sera validar vuestro equipo de 4
            personas y preparar la activacion posterior.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => setSubmitted(false)}>
              Registrar otro equipo
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Categoria</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => {
                  if (value) setCategoryId(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona la categoria del equipo">
                    {(value) =>
                      categories.find((category) => category.id === value)?.name ??
                      "Selecciona la categoria del equipo"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="team-name">Nombre del equipo</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="Nombre del equipo"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Integrantes
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Introduce a las 4 personas del equipo. Recuerda la
                  composicion obligatoria: 1 chica y 3 chicos. La primera
                  persona quedara como responsable de contacto del equipo.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {members.map((member, index) => (
                <div
                  key={`member-${index + 1}`}
                  className="rounded-[1.4rem] border border-white/8 bg-black/20 p-4"
                >
                  <p className="text-sm font-semibold text-white">
                    {index === 0
                      ? "Atleta 1 / Responsable"
                      : `Atleta ${index + 1}`}
                  </p>
                  {index === 0 ? (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Este atleta sera el contacto principal de la
                      preinscripcion.
                    </p>
                  ) : null}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`member-name-${index}`}>Nombre completo</Label>
                      <Input
                        id={`member-name-${index}`}
                        value={member.fullName}
                        onChange={(event) =>
                          updateMember(index, "fullName", event.target.value)
                        }
                        placeholder="Nombre y apellidos"
                        required
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`member-email-${index}`}>Email</Label>
                      <Input
                        id={`member-email-${index}`}
                        type="email"
                        value={member.email}
                        onChange={(event) =>
                          updateMember(index, "email", event.target.value)
                        }
                        placeholder="atleta@email.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Talla de camiseta</Label>
                      <Select
                        value={member.shirtSize}
                        onValueChange={(value) => {
                          if (value) updateMember(index, "shirtSize", value);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Talla" />
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
                      <Label>Genero</Label>
                      <Select
                        value={member.gender}
                        onValueChange={(value) => {
                          if (value) updateMember(index, "gender", value);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona genero">
                            {(value) =>
                              memberGenderOptions.find(
                                (option) => option.value === value,
                              )?.label ?? "Selecciona genero"
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {memberGenderOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-4 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(event) => setConsentAccepted(event.target.checked)}
              className="mt-1 accent-brand-green"
            />
            <span>
              Confirmo que dispongo del consentimiento del equipo para enviar
              estos datos y que la organizacion puede usarlos para gestionar la
              preinscripcion y su seguimiento.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={isPending || !categoryId || !consentAccepted}
            >
              {isPending ? "Enviando..." : "Enviar preinscripcion"}
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
