import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ListChecks } from "lucide-react";
import { EditorialHero } from "@/components/shared/editorial-hero";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "WODs",
  description: "WODs, standards y formato de score de la competicion",
};

const wodTypeLabels: Record<string, string> = {
  for_time: "For Time",
  amrap: "AMRAP",
  emom: "EMOM",
  max_weight: "Max Weight",
  chipper: "Chipper",
  custom: "Custom",
};

export default async function WodsPage() {
  const supabase = await createClient();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");

  const visibleWorkouts = workouts ?? [];
  const timedWorkouts = visibleWorkouts.filter((wod) => wod.time_cap_seconds).length;
  const heavierIsBetterCount = visibleWorkouts.filter((wod) => wod.higher_is_better).length;

  return (
    <div className="min-h-screen">
      <EditorialHero
        imageSrc="/images/editorial/wods-hero.webp"
        imageAlt="Atleta levantando una barra por encima de la cabeza durante una sesion de entrenamiento exigente"
        preload
        imageClassName="object-[center_32%]"
      >
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-brand-green/80">
              WODs
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl">
              WODs, standards y formato de score.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/76">
              Consulta cada prueba de la competicion con su time cap, logica de
              puntuacion y acceso al detalle completo cuando se publique.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.7rem] border border-white/10 bg-black/28 px-4 py-5 backdrop-blur-sm">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/54">
                WODs visibles
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">{visibleWorkouts.length}</p>
            </div>
            <div className="rounded-[1.7rem] border border-white/10 bg-black/28 px-4 py-5 backdrop-blur-sm">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/54">
                Con time cap
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">{timedWorkouts}</p>
            </div>
            <div className="rounded-[1.7rem] border border-white/10 bg-black/28 px-4 py-5 backdrop-blur-sm">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/54">
                Score alto gana
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">{heavierIsBetterCount}</p>
            </div>
          </div>
        </div>
      </EditorialHero>

      <section className="px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl space-y-4">
          {visibleWorkouts.length > 0 ? (
            visibleWorkouts.map((wod, index) => (
              <Link
                key={wod.id}
                href={`/wods/${wod.slug}`}
                className="group block rounded-[1.95rem] bg-white/[0.03] px-5 py-5 ring-1 ring-white/7 transition-colors hover:bg-white/[0.05] sm:px-6 sm:py-6"
              >
                <div className="grid gap-4 lg:grid-cols-[5rem_1fr_auto] lg:items-start lg:gap-6">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-brand-green/78">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-3xl font-medium tracking-[-0.05em] text-white">
                        {wod.name}
                      </h2>
                      <Badge
                        variant="outline"
                        className="border-white/8 bg-white/[0.04] text-[0.68rem] uppercase tracking-[0.18em] text-white/72"
                      >
                        {wodTypeLabels[wod.wod_type] || wod.wod_type}
                      </Badge>
                    </div>

                    <p className="mt-4 line-clamp-4 whitespace-pre-line text-sm leading-6 text-muted-foreground sm:text-base">
                      {wod.description}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[15rem] lg:grid-cols-1">
                    <div className="rounded-[1.2rem] bg-black/18 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                        Time cap
                      </p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {wod.time_cap_seconds
                          ? `${Math.floor(wod.time_cap_seconds / 60)} min`
                          : "Sin cap"}
                      </p>
                    </div>
                    <div className="rounded-[1.2rem] bg-black/18 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                        Score
                      </p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {wod.higher_is_better ? "Mayor score, mejor puesto" : "Menor tiempo, mejor puesto"}
                      </p>
                    </div>
                    <div className="rounded-[1.2rem] bg-black/18 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                        Abrir
                      </p>
                      <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-brand-green">
                        Ver detalle
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-[1.9rem] bg-white/[0.03] px-5 py-10 text-center ring-1 ring-white/7">
              <ListChecks className="mx-auto text-muted-foreground" size={42} />
              <p className="mt-4 text-xl font-medium text-white">
                Los WODs todavia no estan publicados.
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                En cuanto se publiquen, esta pagina reunira pruebas, standards y
                formato de score en una sola vista.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
