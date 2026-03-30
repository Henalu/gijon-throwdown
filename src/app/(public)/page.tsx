import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Dumbbell,
  Images,
  MapPin,
  Radio,
  Trophy,
} from "lucide-react";
import { CountdownTimer } from "@/components/home/countdown-timer";
import { GalleryCard } from "@/components/media/gallery-card";
import { EditorialHero } from "@/components/shared/editorial-hero";
import { EditorialSplitFeature } from "@/components/shared/editorial-split-feature";
import { SponsorGrid } from "@/components/sponsors/sponsor-grid";
import { listVisibleMedia } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

function formatEventDate(start: string | null, end: string | null) {
  if (!start) return "Fechas por confirmar";

  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  if (!endDate) {
    return startDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return `${startDate.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })} - ${endDate.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function formatHeatTime(value: string | null) {
  if (!value) return "Hora pendiente";
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

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: event },
    { data: categories },
    { data: workouts },
    { data: sponsors },
    { data: activeHeats },
    { data: nextHeats },
    { count: teamCount },
    galleryItems,
  ] = await Promise.all([
    supabase.from("event_config").select("*").single(),
    supabase.from("categories").select("*").order("sort_order"),
    supabase
      .from("workouts")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order")
      .limit(3),
    supabase
      .from("sponsors")
      .select("*, sponsor_slots(*)")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("heats")
      .select("id, heat_number, scheduled_at, category:categories(name), workout:workouts(name)")
      .eq("status", "active")
      .order("scheduled_at")
      .limit(1),
    supabase
      .from("heats")
      .select("id, heat_number, scheduled_at, category:categories(name), workout:workouts(name)")
      .eq("status", "pending")
      .order("scheduled_at")
        .limit(1),
    supabase.from("teams").select("*", { count: "exact", head: true }),
    listVisibleMedia(3),
  ]);

  const activeHeat = activeHeats?.[0] ?? null;
  const nextHeat = nextHeats?.[0] ?? null;
  const visibleWorkouts = workouts ?? [];
  const visibleCategories = categories ?? [];
  const eventDate = event?.date || "2026-06-20";
  const teamTotal = teamCount ?? 0;

  return (
    <div className="min-h-screen">
      <EditorialHero
        imageSrc="/images/editorial/home-hero.webp"
        imageAlt="Equipo entrenando en grupo durante una jornada intensa de CrossTraining"
        preload
        contentClassName="pb-14 pt-10 sm:pb-18 sm:pt-14"
        imageClassName="object-[center_40%] sm:object-center"
      >
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.74rem] font-medium uppercase tracking-[0.22em] text-white/68">
              <span className="text-brand-green/88">
                {event?.location || "Gijon, Asturias"}
              </span>
              <span>{formatEventDate(event?.date ?? null, event?.end_date ?? null)}</span>
            </div>

            <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl md:text-7xl">
              La competicion que celebra el esfuerzo, el caracter y la comunidad del norte.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">
              {event?.description ||
                "Gijon Throwdown es una competicion de CrossTraining por equipos de cuatro personas, con una chica y tres chicos por equipo, nacida en Asturias. Reune a atletas de todos los niveles en un formato pensado para vivir el evento, seguirlo en directo y disfrutarlo con claridad de principio a fin."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={activeHeat ? `/live/${activeHeat.id}` : "/directo"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
              >
                {activeHeat ? "Seguir heat activo" : "Sigue la competicion"}
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/horarios"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-black/22 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/34"
              >
                Ver horarios
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/62">
              <Link href="/clasificacion" className="transition-colors hover:text-white">
                Ranking oficial
              </Link>
              <Link href="/wods" className="transition-colors hover:text-white">
                WODs y standards
              </Link>
              <Link href="/patrocinadores" className="transition-colors hover:text-white">
                Partners
              </Link>
            </div>
          </div>

          <div className="space-y-4 lg:pt-4">
            <div className="rounded-[2rem] border border-white/12 bg-black/30 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.34)] backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/56">
                    Ahora en pista
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                    {activeHeat
                      ? `${readRelationName(activeHeat.workout) || "Heat activo"}`
                      : "Preparando la siguiente salida"}
                  </p>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/16 text-brand-green">
                  <Radio size={18} />
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/56">
                    Heat activo
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/84">
                    {activeHeat
                      ? `${readRelationName(activeHeat.category) || "Categoria pendiente"} - Heat ${activeHeat.heat_number}`
                      : "No hay un heat activo en este momento."}
                  </p>
                </div>
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/56">
                    Siguiente bloque
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/84">
                    {nextHeat
                      ? `${readRelationName(nextHeat.workout) || "Siguiente WOD"} - ${formatHeatTime(nextHeat.scheduled_at)}`
                      : "La agenda detallada se publicara muy pronto."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-black/24 px-4 py-4 backdrop-blur-sm">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/54">
                  Sede
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {event?.venue_name || event?.location || "Gijon, Asturias"}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/24 px-4 py-4 backdrop-blur-sm">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/54">
                  Equipos
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {teamTotal} equipos
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/24 px-4 py-4 backdrop-blur-sm">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/54">
                  Categorias
                </p>
                <p className="mt-2 text-sm font-medium text-white">
                  {visibleCategories.length} activas
                </p>
              </div>
            </div>
          </div>
        </div>
      </EditorialHero>

      <section className="px-4 py-10 sm:py-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div className="rounded-[2rem] bg-white/[0.03] px-5 py-6 ring-1 ring-white/7 sm:px-6">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Cuenta atras
            </p>
            <div className="mt-6">
              <CountdownTimer targetDate={eventDate} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.55rem] bg-white/[0.03] px-4 py-5 ring-1 ring-white/7">
              <CalendarDays className="text-brand-green" size={18} />
              <p className="mt-4 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
                Fechas
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {formatEventDate(event?.date ?? null, event?.end_date ?? null)}
              </p>
            </div>
            <div className="rounded-[1.55rem] bg-white/[0.03] px-4 py-5 ring-1 ring-white/7">
              <MapPin className="text-brand-green" size={18} />
              <p className="mt-4 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
                Lugar
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                {event?.venue_address || event?.venue_name || "Direccion por confirmar"}
              </p>
            </div>
            <div className="rounded-[1.55rem] bg-white/[0.03] px-4 py-5 ring-1 ring-white/7">
              <Clock3 className="text-brand-green" size={18} />
              <p className="mt-4 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
                Formato
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                Equipos de 4, directo, ranking y WODs en un mismo sitio
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:pb-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 max-w-2xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
              Sigue el evento
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
              Todo lo importante de la competicion, reunido en una sola plataforma.
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/clasificacion"
              className="rounded-[1.65rem] bg-white/[0.03] px-5 py-5 ring-1 ring-white/7 transition-colors hover:bg-white/[0.05]"
            >
              <Trophy className="text-brand-green" size={18} />
              <p className="mt-4 text-lg font-medium text-white">Clasificacion</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Resultados validados y posicion oficial por categoria.
              </p>
            </Link>
            <Link
              href="/wods"
              className="rounded-[1.65rem] bg-white/[0.03] px-5 py-5 ring-1 ring-white/7 transition-colors hover:bg-white/[0.05]"
            >
              <Dumbbell className="text-brand-green" size={18} />
              <p className="mt-4 text-lg font-medium text-white">WODs</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Pruebas, standards y formato de score para atletas y staff.
              </p>
            </Link>
            <Link
              href="/galeria"
              className="rounded-[1.65rem] bg-white/[0.03] px-5 py-5 ring-1 ring-white/7 transition-colors hover:bg-white/[0.05]"
            >
              <Images className="text-brand-green" size={18} />
              <p className="mt-4 text-lg font-medium text-white">Galeria</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Fotos oficiales para revivir el esfuerzo, descargar recuerdos y
                activar compra cuando este disponible.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <EditorialSplitFeature
        imageSrc="/images/editorial/directo-hero.webp"
        imageAlt="Atletas y público compartiendo el ambiente de competición alrededor de la pista"
        eyebrow="Ambiente de arena"
        title="No vienes solo a mirar el ranking. Vienes a sentir cada heat."
        description="Gijon Throwdown quiere transmitir algo más que resultados: el ruido de la pista, la tensión de cada salida, la energía del equipo y la sensación de que siempre está pasando algo importante en el siguiente bloque."
        highlights={[
          "Pista, gradas y ritmo real",
          "Directo y live con contexto",
          "Fotos para revivir el evento",
        ]}
        primaryHref="/directo"
        primaryLabel="Entrar al directo"
        secondaryHref="/galeria"
        secondaryLabel="Ver galería"
        imageClassName="object-[center_42%]"
      />

      {visibleCategories.length > 0 && (
        <section className="px-4 py-10 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Categorias
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                Tres categorias para ordenar el nivel y mantener la competicion abierta.
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {visibleCategories.slice(0, 4).map((category) => (
                <Link
                  key={category.id}
                  href={`/categorias/${category.slug}`}
                  className="rounded-[1.6rem] bg-white/[0.03] px-5 py-5 ring-1 ring-white/7 transition-colors hover:bg-white/[0.05]"
                >
                  <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
                    Categoria
                  </p>
                  <p className="mt-3 text-lg font-medium text-white">{category.name}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {category.description ||
                      (category.team_size === 4
                        ? "Competicion por equipos de 4 personas: 1 chica y 3 chicos."
                        : `Competicion por equipos de ${category.team_size} atletas`)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <EditorialSplitFeature
        imageSrc="/images/editorial/wods-hero.webp"
        imageAlt="Atleta preparando una barra y material de competición antes de empezar un WOD"
        eyebrow="Formato del evento"
        title="Cuatro personas, una sola lectura competitiva: esfuerzo compartido, estrategia y mucha cabeza."
        description="El formato por equipos no va solo de fuerza. Va de sincronía, lectura táctica, pacing y capacidad de sostener el esfuerzo cuando el WOD deja de parecer simpático. Por eso aquí conviven WODs, standards, ranking y seguimiento live en una sola experiencia."
        highlights={[
          "Equipos de 4",
          "1 chica y 3 chicos",
          "WODs, standards y score",
        ]}
        primaryHref="/wods"
        primaryLabel="Explorar WODs"
        secondaryHref="/clasificacion"
        secondaryLabel="Ver clasificación"
        reverse
        imageClassName="object-[center_34%]"
      />

      {visibleWorkouts.length > 0 && (
        <section className="px-4 py-10 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  WODs visibles
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                  Pruebas publicadas para seguir el evento con contexto real.
                </h2>
              </div>
              <Link
                href="/wods"
                className="hidden text-sm font-medium text-white/72 transition-colors hover:text-white md:inline-flex"
              >
                Ver todos
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {visibleWorkouts.map((wod, index) => (
                <Link
                  key={wod.id}
                  href={`/wods/${wod.slug}`}
                  className="group rounded-[1.8rem] bg-white/[0.03] p-5 ring-1 ring-white/7 transition-colors hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-brand-green/78">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {wod.time_cap_seconds && (
                      <span className="text-[0.72rem] uppercase tracking-[0.22em] text-muted-foreground">
                        {Math.floor(wod.time_cap_seconds / 60)} min cap
                      </span>
                    )}
                  </div>
                  <p className="mt-5 text-2xl font-medium tracking-[-0.04em] text-white">
                    {wod.name}
                  </p>
                  <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {wod.description ||
                      "La descripcion oficial de esta prueba se publicara junto con sus standards."}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-green">
                    Ver detalle
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {galleryItems.length > 0 && (
        <section className="px-4 py-10 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Galeria oficial
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                  La capa visual del evento: esfuerzo, equipo y momentos que merecen quedarse.
                </h2>
              </div>
              <Link
                href="/galeria"
                className="hidden text-sm font-medium text-white/72 transition-colors hover:text-white md:inline-flex"
              >
                Ver galeria completa
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {galleryItems.map((item) => (
                <GalleryCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {sponsors && sponsors.length > 0 && (
        <section className="px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Partners
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                Las marcas y colaboradores que hacen posible Gijon Throwdown.
              </h2>
            </div>
            <SponsorGrid sponsors={sponsors} />
          </div>
        </section>
      )}
    </div>
  );
}
