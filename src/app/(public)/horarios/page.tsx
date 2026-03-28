import type { Metadata } from "next";
import { CalendarDays, Clock3, Radio, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Horarios",
  description: "Programa oficial de heats, categorias y bloques de competicion",
};

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pendiente",
    className: "bg-[rgba(161,122,26,0.16)] text-yellow-200",
  },
  active: {
    label: "En curso",
    className: "bg-brand-green/14 text-brand-green",
  },
  finished: {
    label: "Finalizado",
    className: "bg-white/[0.06] text-muted-foreground",
  },
};

function formatDayLabel(value: string) {
  return new Date(value).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatHeatTime(value: string | null) {
  if (!value) return "Hora pendiente";
  return new Date(value).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readRelationName(
  relation:
    | { name: string; slug?: string; wod_type?: string }
    | { name: string; slug?: string; wod_type?: string }[]
    | null
    | undefined
) {
  return Array.isArray(relation) ? relation[0]?.name : relation?.name;
}

function readLaneTeam(
  team:
    | { name: string; box_name: string | null }
    | { name: string; box_name: string | null }[]
    | null
    | undefined
) {
  return Array.isArray(team) ? team[0] : team;
}

export default async function HorariosPage() {
  const supabase = await createClient();

  const { data: heats } = await supabase
    .from("heats")
    .select(
      "id, heat_number, scheduled_at, status, category:categories(name, slug), workout:workouts(name, slug, wod_type), lanes(id, lane_number, team:teams(name, box_name))"
    )
    .order("scheduled_at", { ascending: true });

  const heatsList = heats ?? [];

  const groupedHeats = Object.entries(
    heatsList.reduce<Record<string, typeof heatsList>>((acc, heat) => {
      const key = heat.scheduled_at
        ? new Date(heat.scheduled_at).toISOString().slice(0, 10)
        : "sin-fecha";
      acc[key] ??= [];
      acc[key].push(heat);
      return acc;
    }, {})
  );

  const activeCount = heatsList.filter((heat) => heat.status === "active").length;
  const pendingCount = heatsList.filter((heat) => heat.status === "pending").length;
  const finishedCount = heatsList.filter((heat) => heat.status === "finished").length;

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-white/6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(120,199,167,0.11),_transparent_42%),linear-gradient(180deg,rgba(14,16,14,1),rgba(13,15,13,1))]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:pb-14 sm:pt-14">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-brand-green/74">
                Horarios
              </p>
              <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl">
                Programa de heats y bloques de competicion.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
                Consulta el desarrollo del evento por jornadas, categorias y
                heats. Una vista clara para atletas, publico y organizacion.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.7rem] bg-white/[0.03] px-4 py-5 ring-1 ring-white/7">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
                  En curso
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">{activeCount}</p>
              </div>
              <div className="rounded-[1.7rem] bg-white/[0.03] px-4 py-5 ring-1 ring-white/7">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
                  Pendientes
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">{pendingCount}</p>
              </div>
              <div className="rounded-[1.7rem] bg-white/[0.03] px-4 py-5 ring-1 ring-white/7">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
                  Finalizados
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">{finishedCount}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {groupedHeats.length > 0 ? (
        <>
          <section className="sticky top-16 z-20 bg-background/88 backdrop-blur-2xl">
            <div className="scrollbar-none mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
              {groupedHeats.map(([dayKey]) => (
                <a
                  key={dayKey}
                  href={`#day-${dayKey}`}
                  className="whitespace-nowrap rounded-full bg-white/[0.04] px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  {dayKey === "sin-fecha" ? "Sin fecha" : formatDayLabel(dayKey)}
                </a>
              ))}
            </div>
          </section>

          <section className="px-4 py-10 sm:py-12">
            <div className="mx-auto max-w-7xl space-y-10">
              {groupedHeats.map(([dayKey, dayHeats]) => (
                <section
                  key={dayKey}
                  id={`day-${dayKey}`}
                  className="scroll-mt-28"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <CalendarDays className="text-brand-green" size={18} />
                    <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white">
                      {dayKey === "sin-fecha" ? "Sin fecha cerrada" : formatDayLabel(dayKey)}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {dayHeats.map((heat) => {
                      const status = statusLabels[heat.status] || statusLabels.pending;

                      return (
                        <article
                          key={heat.id}
                          className="rounded-[1.8rem] bg-white/[0.03] px-4 py-4 ring-1 ring-white/7 sm:px-5 sm:py-5"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-lg font-medium text-white sm:text-xl">
                                  {readRelationName(heat.workout) || "WOD pendiente"} - Heat {heat.heat_number}
                                </p>
                                <Badge className={status.className}>{status.label}</Badge>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">
                                {readRelationName(heat.category) || "Categoria pendiente"}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {heat.status === "active" ? (
                                <Radio className="text-brand-green" size={16} />
                              ) : (
                                <Clock3 size={16} />
                              )}
                              {formatHeatTime(heat.scheduled_at)}
                            </div>
                          </div>

                          {heat.lanes && heat.lanes.length > 0 && (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                              {heat.lanes
                                .sort(
                                  (a: { lane_number: number }, b: { lane_number: number }) =>
                                    a.lane_number - b.lane_number
                                )
                                .map((lane) => {
                                  const team = readLaneTeam(lane.team);

                                  return (
                                    <div key={lane.id} className="rounded-[1.15rem] bg-black/18 px-3 py-3">
                                      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                                        Calle {lane.lane_number}
                                      </p>
                                      <p className="mt-2 truncate text-sm font-medium text-white">
                                        {team?.name || "Sin equipo"}
                                      </p>
                                      <p className="mt-1 truncate text-xs text-muted-foreground">
                                        {team?.box_name || "Asignacion pendiente"}
                                      </p>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="px-4 py-16">
          <div className="mx-auto max-w-4xl rounded-[1.9rem] bg-white/[0.03] px-5 py-10 text-center ring-1 ring-white/7">
            <Users className="mx-auto text-muted-foreground" size={42} />
            <p className="mt-4 text-xl font-medium text-white">
              Los horarios todavia no estan publicados.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              En cuanto el programa oficial este disponible, aparecera aqui
              organizado por dias y bloques de competicion.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
