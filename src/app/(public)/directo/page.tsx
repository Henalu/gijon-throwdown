import Link from "next/link";
import type { Metadata } from "next";
import {
  CalendarDays,
  Clock3,
  MonitorPlay,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "En Directo",
  description: "Sigue cada heat, el stream y el ritmo de la competicion en tiempo real",
};

function formatHeatTime(value: string | null) {
  if (!value) return "Hora por confirmar";
  return new Date(value).toLocaleString("es-ES", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function readRelationName(
  relation: { name: string } | { name: string }[] | null | undefined
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

export default async function DirectoPage() {
  const supabase = await createClient();

  const [{ data: event }, { data: activeHeats }, { data: pendingHeats }] =
    await Promise.all([
      supabase.from("event_config").select("stream_url, status").single(),
      supabase
        .from("heats")
        .select(
          "id, heat_number, scheduled_at, category:categories(name), workout:workouts(name), lanes(id, lane_number, team:teams(name, box_name))"
        )
        .eq("status", "active")
        .order("scheduled_at"),
      supabase
        .from("heats")
        .select("id, heat_number, scheduled_at, category:categories(name), workout:workouts(name)")
        .eq("status", "pending")
        .order("scheduled_at")
        .limit(4),
    ]);

  const primaryHeat = activeHeats?.[0] ?? null;

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-white/6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(120,199,167,0.11),_transparent_42%),linear-gradient(180deg,rgba(14,16,14,1),rgba(13,15,13,1))]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:pb-14 sm:pt-14">
          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-brand-green/74">
                Directo
              </p>
              <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl">
                Sigue la competicion en tiempo real.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
                Accede al heat activo, consulta la emision y revisa los
                siguientes bloques desde una vista pensada para seguir el ritmo
                real del evento.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={primaryHeat ? `/live/${primaryHeat.id}` : "/horarios"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                >
                  {primaryHeat ? "Ver heat activo" : "Ver siguiente bloque"}
                </Link>
                <Link
                  href="/clasificacion"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/[0.06] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.09]"
                >
                  Ver ranking oficial
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <Link href="/horarios" className="transition-colors hover:text-white">
                  Horarios
                </Link>
                <Link href="/wods" className="transition-colors hover:text-white">
                  WODs
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white/[0.04] p-6 ring-1 ring-white/8">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Estado del momento
              </p>

              {primaryHeat ? (
                <>
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold tracking-[-0.04em] text-white">
                        {readRelationName(primaryHeat.workout) || "Heat activo"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/76">
                        {readRelationName(primaryHeat.category) || "Categoria pendiente"} - Heat {primaryHeat.heat_number}
                      </p>
                    </div>
                    <Badge className="border-red-500/25 bg-red-500/10 text-red-400">
                      LIVE
                    </Badge>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    Accede al live de este heat para seguir carriles, equipos y
                    resultados provisionales mientras la competicion esta en marcha.
                  </p>
                </>
              ) : (
                <div className="mt-5">
                  <p className="text-2xl font-semibold tracking-[-0.04em] text-white">
                    Sin heat activo
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    En este momento no hay un heat en pista. Consulta el
                    siguiente bloque programado y mantente listo para entrar al directo.
                  </p>
                </div>
              )}

              {pendingHeats && pendingHeats.length > 0 && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {pendingHeats.slice(0, 2).map((heat) => (
                    <div key={heat.id} className="rounded-[1.4rem] bg-black/18 px-4 py-4">
                      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                        Siguiente salida
                      </p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {readRelationName(heat.workout) || "WOD pendiente"} - Heat {heat.heat_number}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {readRelationName(heat.category) || "Categoria pendiente"} - {formatHeatTime(heat.scheduled_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl space-y-8">
          {event?.stream_url && (
            <div className="overflow-hidden rounded-[2rem] bg-white/[0.03] ring-1 ring-white/7">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Stream
                  </p>
                  <p className="mt-2 text-lg font-medium text-white">
                    Emision en directo
                  </p>
                </div>
                <MonitorPlay className="text-brand-green" size={18} />
              </div>
              <div className="aspect-video bg-black">
                <iframe
                  src={event.stream_url.replace("watch?v=", "embed/")}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Stream en directo"
                />
              </div>
            </div>
          )}

          {activeHeats && activeHeats.length > 0 ? (
            <div className="space-y-5">
              <div className="max-w-2xl">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
                    Heats activos
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                    Todos los heats activos, ordenados para seguir la pista sin perder contexto.
                  </h2>
                </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {activeHeats.map((heat) => (
                  <Link
                    key={heat.id}
                    href={`/live/${heat.id}`}
                    className="rounded-[1.9rem] bg-white/[0.03] p-5 ring-1 ring-white/7 transition-colors hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-2xl font-medium tracking-[-0.04em] text-white">
                          {readRelationName(heat.workout) || "WOD activo"}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/74">
                          {readRelationName(heat.category) || "Categoria pendiente"} - Heat {heat.heat_number}
                        </p>
                      </div>
                      <Badge className="border-red-500/25 bg-red-500/10 text-red-400">
                        LIVE
                      </Badge>
                    </div>

                    {heat.lanes && heat.lanes.length > 0 && (
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        {heat.lanes
                          .sort(
                            (a: { lane_number: number }, b: { lane_number: number }) =>
                              a.lane_number - b.lane_number
                          )
                          .slice(0, 4)
                          .map((lane) => {
                            const team = readLaneTeam(lane.team);

                            return (
                              <div key={lane.id} className="rounded-[1.1rem] bg-black/18 px-3 py-3">
                                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
                                  Calle {lane.lane_number}
                                </p>
                                <p className="mt-2 text-sm font-medium text-white">
                                  {team?.name || "Sin equipo"}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[1.9rem] bg-white/[0.03] px-5 py-10 text-center ring-1 ring-white/7">
              <MonitorPlay className="mx-auto text-muted-foreground" size={42} />
              <p className="mt-4 text-xl font-medium text-white">
                No hay heats en curso ahora mismo
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Cuando se active el siguiente bloque, aparecera aqui con acceso
                directo al live del heat correspondiente.
              </p>
            </div>
          )}

          {pendingHeats && pendingHeats.length > 0 && (
            <div className="space-y-5">
              <div className="max-w-2xl">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Lo siguiente
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                  Proximos heats
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {pendingHeats.map((heat) => (
                  <div
                    key={heat.id}
                    className="rounded-[1.5rem] bg-white/[0.03] px-4 py-4 ring-1 ring-white/7"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {readRelationName(heat.workout) || "WOD pendiente"} - Heat {heat.heat_number}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {readRelationName(heat.category) || "Categoria pendiente"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        <Clock3 size={14} />
                        {formatHeatTime(heat.scheduled_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/clasificacion"
              className="rounded-[1.6rem] bg-white/[0.03] px-5 py-5 ring-1 ring-white/7 transition-colors hover:bg-white/[0.05]"
            >
              <Trophy className="text-brand-green" size={18} />
              <p className="mt-4 text-lg font-medium text-white">Leaderboard oficial</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Resultados validados y clasificacion oficial por categoria.
              </p>
            </Link>
            <Link
              href="/horarios"
              className="rounded-[1.6rem] bg-white/[0.03] px-5 py-5 ring-1 ring-white/7 transition-colors hover:bg-white/[0.05]"
            >
              <CalendarDays className="text-brand-green" size={18} />
              <p className="mt-4 text-lg font-medium text-white">Horarios</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                La agenda completa de heats, categorias y bloques de competicion.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
