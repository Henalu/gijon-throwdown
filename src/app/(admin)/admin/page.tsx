import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  LayoutDashboard,
  Radio,
  ShieldCheck,
  Timer,
  Trophy,
  UserCheck,
  Users,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  canValidateScoresProfile,
  getRoleLabel,
  isSuperadminRole,
} from "@/lib/auth/permissions";
import { requireAdminLikeProfile } from "@/lib/auth/session";

type RelationName = { name: string } | { name: string }[] | null;

type DashboardHeatRow = {
  id: string;
  heat_number: number;
  status: "pending" | "active" | "finished";
  is_live_entry_enabled: boolean;
  scheduled_at: string | null;
  category: RelationName;
  workout: RelationName;
  scores:
    | Array<{
        id: string;
        is_published: boolean;
        verified_at: string | null;
      }>
    | null;
};

type PendingTeamRegistration = {
  id: string;
  team_name: string;
  created_at: string;
  categories: RelationName;
};

type PendingVolunteerApplication = {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
};

type StreamSessionSummary = {
  id: string;
  title: string;
  is_live: boolean;
  is_public: boolean;
  started_at: string | null;
};

function getSingleRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatDateTime(value: string | null) {
  if (!value) return "Sin hora programada";

  return new Date(value).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEventRange(start: string | null, end: string | null) {
  if (!start) return "Fechas por confirmar";

  const startDate = new Date(start);
  const startLabel = startDate.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
  });

  if (!end) {
    return startLabel;
  }

  const endDate = new Date(end);
  const endLabel = endDate.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
  });

  return `${startLabel} - ${endLabel}`;
}

function getEventStatusMeta(status: string | null | undefined) {
  switch (status) {
    case "live":
      return {
        label: "En directo",
        className: "border-brand-green/30 text-brand-green",
      };
    case "published":
      return {
        label: "Publicado",
        className: "border-brand-cyan/30 text-brand-cyan",
      };
    case "finished":
      return {
        label: "Finalizado",
        className: "border-white/15 text-muted-foreground",
      };
    case "draft":
    default:
      return {
        label: "Borrador",
        className: "border-yellow-500/30 text-yellow-500",
      };
  }
}

function getHeatStatusMeta(heat: Pick<DashboardHeatRow, "status" | "is_live_entry_enabled">) {
  if (heat.status === "active") {
    return {
      label: "Activo",
      className: "border-brand-green/30 text-brand-green",
    };
  }

  if (heat.status === "finished") {
    return {
      label: "Finalizado",
      className: "border-white/15 text-muted-foreground",
    };
  }

  if (heat.is_live_entry_enabled) {
    return {
      label: "Live listo",
      className: "border-brand-cyan/30 text-brand-cyan",
    };
  }

  return {
    label: "Pendiente",
    className: "border-yellow-500/30 text-yellow-500",
  };
}

function getValidationState(
  scores: Array<{ is_published: boolean; verified_at: string | null }> | null,
) {
  if (!scores || scores.length === 0) {
    return {
      label: "Sin borrador",
      className: "border-yellow-500/30 text-yellow-500",
      isDone: false,
    };
  }

  if (scores.every((score) => score.is_published)) {
    return {
      label: "Publicado",
      className: "border-brand-green/30 text-brand-green",
      isDone: true,
    };
  }

  if (scores.every((score) => Boolean(score.verified_at))) {
    return {
      label: "Validado",
      className: "border-brand-cyan/30 text-brand-cyan",
      isDone: false,
    };
  }

  return {
    label: "Borrador",
    className: "border-orange-500/30 text-orange-500",
    isDone: false,
  };
}

function formatVolunteerName(application: PendingVolunteerApplication) {
  return `${application.first_name} ${application.last_name}`.trim();
}

function MetricCard({
  label,
  value,
  description,
  className,
}: {
  label: string;
  value: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={`rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5 ${className ?? ""}`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function QuickLinkCard({
  href,
  title,
  description,
  badge,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  badge: string;
  icon: typeof LayoutDashboard;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5 transition-colors hover:border-white/15 hover:bg-white/[0.05]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/8 bg-black/20 text-brand-green">
            <Icon size={18} />
          </span>
          <div>
            <p className="text-base font-semibold text-white">{title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-white/10 text-muted-foreground">
          {badge}
        </Badge>
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm text-white transition-transform group-hover:translate-x-1">
        Abrir
        <ArrowRight size={14} />
      </div>
    </Link>
  );
}

export default async function AdminDashboard() {
  const { supabase, profile } = await requireAdminLikeProfile("/admin");

  const canValidateScores = canValidateScoresProfile(profile);
  const isSuperadmin = isSuperadminRole(profile.role);

  const [
    { data: event },
    { data: activeEdition },
    { data: heats },
    { data: pendingTeamRegistrations },
    { data: pendingVolunteerApplications },
    { data: streamSessions },
    { count: teamCount },
    { count: peopleCount },
    { count: userCount },
    { count: visibleMediaCount },
    { count: featuredMediaCount },
  ] = await Promise.all([
    supabase
      .from("event_config")
      .select("name, status, date, end_date, venue_name, location")
      .single(),
    supabase
      .from("event_editions")
      .select("label, year")
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("heats")
      .select(
        "id, heat_number, status, is_live_entry_enabled, scheduled_at, category:categories(name), workout:workouts(name), scores(id, is_published, verified_at)",
      )
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("team_registrations")
      .select("id, team_name, created_at, categories(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("volunteer_applications")
      .select("id, first_name, last_name, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("stream_sessions")
      .select("id, title, is_live, is_public, started_at")
      .order("is_live", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("started_at", { ascending: false }),
    supabase.from("teams").select("id", { count: "exact", head: true }),
    supabase.from("people").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("is_visible", true),
    supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("is_featured", true),
  ]);

  const eventStatus = getEventStatusMeta(event?.status);
  const heatRows = ((heats ?? []) as DashboardHeatRow[]).slice();
  const activeHeats = heatRows.filter((heat) => heat.status === "active");
  const upcomingHeats = heatRows.filter((heat) => heat.status !== "finished").slice(0, 4);
  const liveReadyHeats = heatRows.filter((heat) => heat.is_live_entry_enabled);
  const validationQueue = heatRows
    .filter((heat) => heat.status === "finished")
    .map((heat) => ({
      ...heat,
      validation: getValidationState(heat.scores),
    }))
    .filter((heat) => !heat.validation.isDone);
  const publicSessions = (streamSessions ?? []) as StreamSessionSummary[];
  const liveSessions = publicSessions.filter(
    (session) => session.is_public && session.is_live,
  );
  const pendingTeams = (pendingTeamRegistrations ?? []) as PendingTeamRegistration[];
  const pendingVolunteers = (pendingVolunteerApplications ??
    []) as PendingVolunteerApplication[];

  const quickLinks = [
    {
      href: "/admin/heats",
      title: "Operativa de heats",
      description: "Series, lanes y activacion del live para no perder el pulso del evento.",
      badge: activeHeats.length > 0 ? `${activeHeats.length} activos` : `${upcomingHeats.length} en cola`,
      icon: Timer,
      visible: true,
    },
    {
      href: "/admin/puntuaciones",
      title: "Scoring operativo",
      description: "Genera borradores desde heats finalizados y deja lista la fase oficial.",
      badge: `${validationQueue.length} por cerrar`,
      icon: Trophy,
      visible: true,
    },
    {
      href: "/admin/validacion",
      title: "Validacion oficial",
      description: "Revisa resultados definitivos antes de consolidar leaderboard.",
      badge: `${validationQueue.length} pendientes`,
      icon: ShieldCheck,
      visible: canValidateScores,
    },
    {
      href: "/admin/voluntarios",
      title: "Voluntarios y asignaciones",
      description: "Solicitudes nuevas, staff activo y control de cobertura para la pista.",
      badge: `${pendingVolunteers.length} solicitudes`,
      icon: UserCheck,
      visible: true,
    },
    {
      href: "/admin/equipos",
      title: "Equipos y preinscripciones",
      description: "Confirmados, atletas convertidos y equipos pendientes de revisar.",
      badge: `${pendingTeams.length} pendientes`,
      icon: Users,
      visible: true,
    },
    {
      href: "/admin/personas",
      title: "People registry",
      description: "Base canonica de personas, perfiles y vinculaciones deportivas.",
      badge: `${peopleCount ?? 0} personas`,
      icon: Users,
      visible: true,
    },
    {
      href: "/admin/streaming",
      title: "Streaming",
      description: "Controla el embed principal y las sesiones live o replay visibles en la web.",
      badge: liveSessions.length > 0 ? `${liveSessions.length} live` : `${publicSessions.length} sesiones`,
      icon: Video,
      visible: true,
    },
    {
      href: "/admin/media",
      title: "Media y galeria",
      description: "Biblioteca publica, descargas y compra de imagenes desde la web.",
      badge: `${visibleMediaCount ?? 0} visibles`,
      icon: Camera,
      visible: true,
    },
    {
      href: "/admin/usuarios",
      title: "Usuarios internos",
      description: "Invitaciones, roles y acceso del staff para que nadie entre donde no toca.",
      badge: `${userCount ?? 0} cuentas`,
      icon: Users,
      visible: isSuperadmin,
    },
  ].filter((item) => item.visible);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={eventStatus.className}>
                {eventStatus.label}
              </Badge>
              <Badge variant="outline" className="border-white/10 text-muted-foreground">
                {getRoleLabel(profile.role)}
              </Badge>
              {activeEdition ? (
                <Badge
                  variant="outline"
                  className="border-brand-cyan/25 text-brand-cyan"
                >
                  {activeEdition.label}
                </Badge>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
              Dashboard operativo del evento
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              Esto debería responder a la pregunta importante de cualquier
              organizador: qué está pasando ahora, qué está pendiente y a qué
              módulo conviene saltar sin dar paseos por la barra lateral.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/directo" className={buttonVariants({ variant: "outline" })}>
              Ver directo publico
            </Link>
            <Link href="/admin/heats" className={buttonVariants()}>
              Ir a operativa de heats
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Evento"
            value={event?.name ?? "Sin configurar"}
            description={`${formatEventRange(event?.date ?? null, event?.end_date ?? null)}${event?.venue_name ? ` · ${event.venue_name}` : event?.location ? ` · ${event.location}` : ""}`}
            className="xl:col-span-2"
          />
          <MetricCard
            label="Live ahora"
            value={activeHeats.length > 0 ? `${activeHeats.length}` : "0"}
            description={
              activeHeats.length > 0
                ? `${liveReadyHeats.length} heats con entrada live habilitada`
                : "Ahora mismo no hay heats activos"
            }
          />
          <MetricCard
            label="Pendientes"
            value={`${validationQueue.length + pendingTeams.length + pendingVolunteers.length}`}
            description={`${validationQueue.length} validaciones, ${pendingTeams.length} equipos y ${pendingVolunteers.length} solicitudes de voluntariado`}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Accesos rápidos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Los módulos que más sentido tienen cuando estás llevando el evento en tiempo real.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {quickLinks.map((link) => (
            <QuickLinkCard key={link.href} {...link} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_1.05fr_0.9fr]">
        <div className="rounded-[1.7rem] border border-white/8 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-white">Operativa live</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Heats activos o inmediatos, para que sepas qué superficie conviene abrir ya.
              </p>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/8 bg-black/20 text-brand-green">
              <Radio size={18} />
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {upcomingHeats.length > 0 ? (
              upcomingHeats.map((heat) => {
                const status = getHeatStatusMeta(heat);

                return (
                  <div
                    key={heat.id}
                    className="rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-white">
                        {getSingleRelation(heat.workout)?.name ?? "WOD"} - Heat #{heat.heat_number}
                      </p>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getSingleRelation(heat.category)?.name ?? "Sin categoria"} ·{" "}
                      {formatDateTime(heat.scheduled_at)}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-white/10 px-4 py-6 text-sm text-muted-foreground">
                No hay heats activos ni pendientes. Por una vez, la pista no te está gritando.
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/admin/heats" className={buttonVariants({ size: "sm" })}>
              Gestionar heats
            </Link>
            <Link
              href="/admin/voluntarios"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Ver voluntarios
            </Link>
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-white/8 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-white">Cola de revisión</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Lo que hoy te pide una decisión humana, no solo un clic administrativo.
              </p>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/8 bg-black/20 text-brand-cyan">
              <ShieldCheck size={18} />
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-[1.2rem] border border-white/8 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Validación oficial</p>
                <Badge variant="outline" className="border-white/10 text-muted-foreground">
                  {validationQueue.length}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {canValidateScores
                  ? "Heats finalizados que todavía no están publicados del todo."
                  : "Hay trabajo de validación en cola, aunque tu perfil no entre en ese módulo."}
              </p>
              {validationQueue[0] ? (
                <p className="mt-2 text-sm text-white">
                  Siguiente: {getSingleRelation(validationQueue[0].workout)?.name ?? "WOD"} - Heat #{validationQueue[0].heat_number}
                </p>
              ) : null}
            </div>

            <div className="rounded-[1.2rem] border border-white/8 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Preinscripciones de equipos</p>
                <Badge variant="outline" className="border-white/10 text-muted-foreground">
                  {pendingTeams.length}
                </Badge>
              </div>
              {pendingTeams[0] ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  La más antigua es <span className="text-white">{pendingTeams[0].team_name}</span> en{" "}
                  {getSingleRelation(pendingTeams[0].categories)?.name ?? "categoría sin nombre"}.
                </p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  No hay equipos pendientes. Un pequeño milagro operativo.
                </p>
              )}
            </div>

            <div className="rounded-[1.2rem] border border-white/8 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Solicitudes de voluntariado</p>
                <Badge variant="outline" className="border-white/10 text-muted-foreground">
                  {pendingVolunteers.length}
                </Badge>
              </div>
              {pendingVolunteers[0] ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Pendiente desde primero en cola:{" "}
                  <span className="text-white">{formatVolunteerName(pendingVolunteers[0])}</span>.
                </p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Sin solicitudes nuevas en revisión ahora mismo.
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {canValidateScores ? (
              <Link href="/admin/validacion" className={buttonVariants({ size: "sm" })}>
                Abrir validación
              </Link>
            ) : null}
            <Link
              href="/admin/equipos"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Revisar equipos
            </Link>
            <Link
              href="/admin/voluntarios"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Revisar voluntarios
            </Link>
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-white/8 bg-white/[0.03] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-white">Contenido y señal</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Streaming, galería y base interna para que la web no viva solo de buena voluntad.
              </p>
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/8 bg-black/20 text-brand-green">
              <Video size={18} />
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-3">
              <p className="text-sm font-semibold text-white">Streaming</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {liveSessions.length > 0
                  ? `${liveSessions.length} sesión en directo publicada ahora mismo.`
                  : `${publicSessions.length} sesiones públicas configuradas. Ninguna está live ahora.`}
              </p>
              {liveSessions[0]?.title ? (
                <p className="mt-2 text-sm text-white">{liveSessions[0].title}</p>
              ) : null}
            </div>

            <div className="rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-3">
              <p className="text-sm font-semibold text-white">Media</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {visibleMediaCount ?? 0} elementos visibles, {featuredMediaCount ?? 0} destacados listos para empujar la narrativa visual del evento.
              </p>
            </div>

            <div className="rounded-[1.2rem] border border-white/8 bg-black/20 px-4 py-3">
              <p className="text-sm font-semibold text-white">Base del evento</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {teamCount ?? 0} equipos confirmados y {peopleCount ?? 0} personas registradas dentro del sistema.
              </p>
              {isSuperadmin ? (
                <p className="mt-2 text-sm text-white">{userCount ?? 0} cuentas internas activas o invitadas.</p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/admin/streaming" className={buttonVariants({ size: "sm" })}>
              Abrir streaming
            </Link>
            <Link
              href="/admin/media"
              className={buttonVariants({ size: "sm", variant: "outline" })}
            >
              Abrir media
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-white/8 bg-black/20 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">Lo importante de este dashboard</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              No intenta sustituir los módulos. Su trabajo es decirte dónde actuar primero, con contexto suficiente para no entrar a ciegas.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/evento" className={buttonVariants({ size: "sm", variant: "outline" })}>
              <CalendarDays size={14} />
              Ajustar evento
            </Link>
            <Link href="/admin/personas" className={buttonVariants({ size: "sm", variant: "outline" })}>
              <Users size={14} />
              Revisar personas
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
