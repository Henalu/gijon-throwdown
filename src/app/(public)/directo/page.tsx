import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CalendarDays,
  Clock3,
  Images,
  MonitorPlay,
  Trophy,
} from "lucide-react";
import { EditorialHero } from "@/components/shared/editorial-hero";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatSessionDateRange, getYoutubeEmbedUrl, getYoutubeThumbnailUrl } from "@/lib/streaming";
import type { StreamSession } from "@/types";

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

  const [{ data: event }, { data: activeHeats }, { data: pendingHeats }, { data: sessions }] =
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
      supabase
        .from("stream_sessions")
        .select("*")
        .eq("is_public", true)
        .order("is_live", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("started_at", { ascending: false })
        .limit(4),
    ]);

  const primaryHeat = activeHeats?.[0] ?? null;
  const publicSessions = (sessions ?? []) as StreamSession[];
  const liveSession = publicSessions.find((session) => session.is_live) ?? null;
  const streamEmbedUrl =
    getYoutubeEmbedUrl(liveSession?.youtube_url ?? null) ||
    getYoutubeEmbedUrl(event?.stream_url ?? null);
  const sessionArchive = publicSessions.filter((session) => session.id !== liveSession?.id);

  return (
    <div className="min-h-screen">
      <EditorialHero
        imageSrc="/images/editorial/directo-hero.webp"
        imageAlt="Atletas compartiendo la arena de CrossTraining durante un bloque de competicion"
        preload
        imageClassName="object-[center_45%]"
      >
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-brand-green/80">
              Directo
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl">
              Sigue la competicion en tiempo real.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/76">
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
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-black/22 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/34"
              >
                Ver ranking oficial
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
              <Link href="/horarios" className="transition-colors hover:text-white">
                Horarios
              </Link>
              <Link href="/wods" className="transition-colors hover:text-white">
                WODs
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/12 bg-black/30 p-6 backdrop-blur-md">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/56">
              Estado del momento
            </p>

            {liveSession ? (
              <>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold tracking-[-0.04em] text-white">
                      {liveSession.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/78">
                      Emision principal en directo
                    </p>
                  </div>
                  <Badge className="border-red-500/25 bg-red-500/10 text-red-400">
                    LIVE
                  </Badge>
                </div>

                <p className="mt-4 text-sm leading-6 text-white/62">
                  {liveSession.description ||
                    "La sesion live marcada en admin se convierte en el stream principal del directo publico."}
                </p>
              </>
            ) : primaryHeat ? (
              <>
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold tracking-[-0.04em] text-white">
                      {readRelationName(primaryHeat.workout) || "Heat activo"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/78">
                      {readRelationName(primaryHeat.category) || "Categoria pendiente"} - Heat {primaryHeat.heat_number}
                    </p>
                  </div>
                  <Badge className="border-red-500/25 bg-red-500/10 text-red-400">
                    LIVE
                  </Badge>
                </div>

                <p className="mt-4 text-sm leading-6 text-white/62">
                  Accede al live de este heat para seguir carriles, equipos y
                  resultados provisionales mientras la competicion esta en marcha.
                </p>
              </>
            ) : (
              <div className="mt-5">
                <p className="text-2xl font-semibold tracking-[-0.04em] text-white">
                  Sin heat activo
                </p>
                <p className="mt-3 text-sm leading-6 text-white/62">
                  En este momento no hay un heat en pista. Consulta el
                  siguiente bloque programado y mantente listo para entrar al directo.
                </p>
              </div>
            )}

            {pendingHeats && pendingHeats.length > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {pendingHeats.slice(0, 2).map((heat) => (
                  <div
                    key={heat.id}
                    className="rounded-[1.4rem] border border-white/8 bg-black/22 px-4 py-4 backdrop-blur-sm"
                  >
                    <p className="text-[0.68rem] uppercase tracking-[0.2em] text-white/52">
                      Siguiente salida
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {readRelationName(heat.workout) || "WOD pendiente"} - Heat {heat.heat_number}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/58">
                      {readRelationName(heat.category) || "Categoria pendiente"} - {formatHeatTime(heat.scheduled_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </EditorialHero>

      <section className="px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl space-y-8">
          {streamEmbedUrl && (
            <div className="overflow-hidden rounded-[2rem] bg-white/[0.03] ring-1 ring-white/7">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Stream
                  </p>
                  <p className="mt-2 text-lg font-medium text-white">
                    {liveSession ? liveSession.title : "Emision en directo"}
                  </p>
                </div>
                <MonitorPlay className="text-brand-green" size={18} />
              </div>
              <div className="aspect-video bg-black">
                <iframe
                  src={streamEmbedUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Stream en directo"
                />
              </div>
            </div>
          )}

          {publicSessions.length > 0 && (
            <div className="space-y-5">
              <div className="max-w-2xl">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Sesiones
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                  Directos, bloques especiales y replays preparados para seguir el evento con contexto.
                </h2>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {(liveSession ? [liveSession, ...sessionArchive] : publicSessions)
                  .slice(0, 3)
                  .map((session) => {
                    const thumbnail = getYoutubeThumbnailUrl(session.youtube_url, "hqdefault");

                    return (
                      <article
                        key={session.id}
                        className="overflow-hidden rounded-[1.8rem] bg-white/[0.03] ring-1 ring-white/7"
                      >
                        <div className="relative aspect-[16/10] bg-black/40">
                          {thumbnail ? (
                            <Image
                              src={thumbnail}
                              alt={`Miniatura de ${session.title}`}
                              fill
                              unoptimized
                              sizes="(max-width: 1024px) 100vw, 33vw"
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="space-y-3 px-5 py-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-medium text-white">{session.title}</p>
                            {session.is_live ? (
                              <Badge className="border-red-500/25 bg-red-500/10 text-red-400">
                                LIVE
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Replay
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            {formatSessionDateRange(session.started_at, session.ended_at)}
                          </p>
                          {session.description ? (
                            <p className="text-sm leading-6 text-muted-foreground">
                              {session.description}
                            </p>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
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
            <Link
              href="/galeria"
              className="rounded-[1.6rem] bg-white/[0.03] px-5 py-5 ring-1 ring-white/7 transition-colors hover:bg-white/[0.05]"
            >
              <Images className="text-brand-green" size={18} />
              <p className="mt-4 text-lg font-medium text-white">Galeria oficial</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Fotos del evento para revivir el esfuerzo, descargar recuerdos y
                activar compra cuando este disponible.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
