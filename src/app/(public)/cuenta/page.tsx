import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  getAccountShortcuts,
  getPanelTitle,
  getProfileRoleLabel,
} from "@/lib/auth/permissions";
import { requireSessionProfile } from "@/lib/auth/session";

interface AccountPersonSummary {
  id: string;
  full_name: string;
  primary_email: string | null;
  shirt_size: string | null;
  dietary_restrictions: string | null;
}

interface AccountAthleteSummary {
  id: string;
  edition_id: string | null;
  person_id: string | null;
  team_id: string;
  first_name: string;
  last_name: string;
  sort_order: number;
}

interface AccountTeamSummary {
  id: string;
  edition_id: string | null;
  name: string;
  category_id: string;
  box_name: string | null;
  city: string | null;
}

interface AccountCategorySummary {
  id: string;
  name: string;
}

interface AccountLeaderboardSummary {
  team_id: string;
  team_name: string;
  category_id: string;
  category_name: string;
  total_points: number;
  rank: number;
}

interface AccountEditionSummary {
  id: string;
  slug: string;
  label: string;
  year: number | null;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
}

interface AccountEditionParticipationSummary {
  id: string;
  role: "athlete" | "volunteer" | "staff";
  invited_at: string | null;
  activated_at: string | null;
  created_at: string;
  edition: AccountEditionSummary | null;
  team: AccountTeamSummary | null;
  category: AccountCategorySummary | null;
  athlete: AccountAthleteSummary | null;
}

function getFullAthleteName(athlete: {
  first_name: string;
  last_name: string;
}) {
  return `${athlete.first_name} ${athlete.last_name}`.trim();
}

function formatEditionMeta(edition: AccountEditionSummary | null) {
  if (!edition) {
    return "Edicion por definir";
  }

  if (edition.starts_on && edition.ends_on) {
    return `${edition.starts_on} - ${edition.ends_on}`;
  }

  if (edition.year) {
    return `Temporada ${edition.year}`;
  }

  return edition.label;
}

function getParticipationStateLabel(participation: AccountEditionParticipationSummary) {
  if (participation.activated_at) {
    return "Cuenta activada";
  }

  if (participation.invited_at) {
    return "Invitacion enviada";
  }

  return "Participacion confirmada";
}

export default async function CuentaPage() {
  const { profile, supabase } = await requireSessionProfile("/cuenta");
  const shortcuts = getAccountShortcuts(profile);

  let person: AccountPersonSummary | null = null;
  let athlete: AccountAthleteSummary | null = null;
  let team: AccountTeamSummary | null = null;
  let category: AccountCategorySummary | null = null;
  let teammates: AccountAthleteSummary[] = [];
  let leaderboard: AccountLeaderboardSummary | null = null;
  let activeEdition: AccountEditionSummary | null = null;
  let athleteParticipations: AccountEditionParticipationSummary[] = [];

  if (profile.person_id) {
    const [{ data: personData }, { data: eventConfig }, { data: participationData }] =
      await Promise.all([
        supabase
          .from("people")
          .select(
            "id, full_name, primary_email, shirt_size, dietary_restrictions",
          )
          .eq("id", profile.person_id)
          .maybeSingle(),
        supabase
          .from("event_config")
          .select("active_edition_id")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("edition_participations")
          .select(
            "id, role, invited_at, activated_at, created_at, edition:event_editions(id, slug, label, year, starts_on, ends_on, is_active), team:teams(id, edition_id, name, category_id, box_name, city), category:categories(id, name), athlete:athletes(id, edition_id, person_id, team_id, first_name, last_name, sort_order)",
          )
          .eq("person_id", profile.person_id)
          .order("created_at", { ascending: false }),
      ]);

    person = (personData as AccountPersonSummary | null) ?? null;

    athleteParticipations = (
      ((participationData as AccountEditionParticipationSummary[] | null) ?? []).filter(
        (participation) => participation.role === "athlete" && participation.edition,
      )
    ).sort((left, right) => {
      const leftYear = left.edition?.year ?? 0;
      const rightYear = right.edition?.year ?? 0;
      return rightYear - leftYear;
    });

    const activeEditionId = eventConfig?.active_edition_id ?? null;
    const currentParticipation =
      athleteParticipations.find(
        (participation) => participation.edition?.id === activeEditionId,
      ) ?? athleteParticipations[0] ?? null;

    activeEdition =
      currentParticipation?.edition ??
      athleteParticipations.find(
        (participation) => participation.edition?.id === activeEditionId,
      )?.edition ??
      null;

    athlete = currentParticipation?.athlete ?? null;
    team = currentParticipation?.team ?? null;
    category = currentParticipation?.category ?? null;

    if (athlete && team) {
      const [{ data: leaderboardData }, { data: teammatesData }] = await Promise.all([
        supabase
          .from("leaderboard")
          .select(
            "team_id, team_name, category_id, category_name, total_points, rank",
          )
          .eq("team_id", athlete.team_id)
          .maybeSingle(),
        supabase
          .from("athletes")
          .select(
            "id, edition_id, person_id, team_id, first_name, last_name, sort_order",
          )
          .eq("team_id", athlete.team_id)
          .order("sort_order"),
      ]);

      leaderboard = (leaderboardData as AccountLeaderboardSummary | null) ?? null;
      teammates = (teammatesData as AccountAthleteSummary[] | null) ?? [];
    }
  }

  const athleteLinked = profile.role === "athlete" && Boolean(athlete && team);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 md:p-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
            {getPanelTitle(profile)}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
            Tu acceso al ecosistema del evento
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
            Aqui tienes tu punto de entrada real. Si eres staff, esto funciona
            como lanzadera hacia la superficie operativa. Si eres atleta, ya no
            ves solo una foto fija del momento: empieza a aparecer el hilo de tu
            participacion dentro del evento.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 overflow-hidden rounded-[1.4rem] bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Nombre
              </p>
              <p className="mt-2 min-w-0 break-words text-lg font-semibold text-white [overflow-wrap:anywhere]">
                {profile.full_name}
              </p>
            </div>
            <div className="min-w-0 overflow-hidden rounded-[1.4rem] bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Email
              </p>
              <p className="mt-2 min-w-0 break-words text-lg font-semibold text-white [overflow-wrap:anywhere]">
                {profile.email}
              </p>
            </div>
            <div className="min-w-0 overflow-hidden rounded-[1.4rem] bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Rol
              </p>
              <p className="mt-2 min-w-0 break-words text-lg font-semibold text-white [overflow-wrap:anywhere]">
                {getProfileRoleLabel(profile)}
              </p>
            </div>
            <div className="min-w-0 overflow-hidden rounded-[1.4rem] bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Estado
              </p>
              <p className="mt-2 min-w-0 break-words text-lg font-semibold text-white [overflow-wrap:anywhere]">
                {profile.is_active ? "Acceso activo" : "Acceso inactivo"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="outline" className="border-brand-green/30 text-brand-green">
              {getProfileRoleLabel(profile)}
            </Badge>
            <Badge variant="outline" className="border-white/12 text-white/75">
              {profile.is_active ? "Acceso activo" : "Acceso inactivo"}
            </Badge>
            {(profile.role === "superadmin" || profile.can_validate_scores) && (
              <Badge
                variant="outline"
                className="border-brand-cyan/30 text-brand-cyan"
              >
                Puede validar scores
              </Badge>
            )}
            {profile.person_id && (
              <Badge variant="outline" className="border-white/12 text-white/75">
                Persona enlazada
              </Badge>
            )}
            {athleteLinked && (
              <Badge
                variant="outline"
                className="border-brand-cyan/30 text-brand-cyan"
              >
                Perfil deportivo activo
              </Badge>
            )}
            {athleteParticipations.length > 0 && (
              <Badge variant="outline" className="border-white/12 text-white/75">
                {athleteParticipations.length} edicion
                {athleteParticipations.length === 1 ? "" : "es"} registrada
                {athleteParticipations.length === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 md:p-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Lo que puedes hacer ahora
          </p>
          <div className="mt-5 space-y-3">
            {shortcuts.map((shortcut) => (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="block rounded-[1.4rem] bg-black/20 p-4 transition-colors hover:bg-white/[0.05]"
              >
                <p className="text-base font-semibold text-white">
                  {shortcut.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {shortcut.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {profile.role === "athlete" && (
        <section className="mt-6 rounded-[2rem] border border-white/8 bg-white/[0.02] p-6 md:p-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Perfil atleta
          </p>

          {athlete && team ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4 rounded-[1.6rem] bg-black/20 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Equipo actual
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                    {team.name}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Tu cuenta ya esta enlazada a una persona real del sistema y
                    a tu equipo confirmado. Aqui tienes la lectura util del
                    presente, pero ya preparada para que la memoria entre
                    ediciones no se pierda por el camino.
                  </p>
                </div>

                <div className="rounded-[1.2rem] bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Edicion activa
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {activeEdition?.label ?? "Edicion actual"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatEditionMeta(activeEdition)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Categoria
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {category?.name ?? leaderboard?.category_name ?? "Pendiente"}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Posicion actual
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {leaderboard ? `#${leaderboard.rank}` : "Sin ranking aun"}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Puntos totales
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {leaderboard ? leaderboard.total_points : 0}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Datos logisticos
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {person?.shirt_size
                        ? `Camiseta ${person.shirt_size}`
                        : "Talla pendiente"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {person?.dietary_restrictions || "Sin restricciones registradas"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/clasificacion"
                    className="rounded-full bg-brand-green px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    Ver clasificacion
                  </Link>
                  <Link
                    href="/horarios"
                    className="rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.05]"
                  >
                    Consultar horarios
                  </Link>
                </div>
              </div>

              <div className="space-y-4 rounded-[1.6rem] bg-black/20 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Tu equipo por dentro
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Primero, tu base actual. Despues, la trayectoria. Mucho mas
                    serio que vivir cada edicion como si el sistema tuviera
                    amnesia selectiva.
                  </p>
                </div>

                <div className="space-y-3">
                  {teammates.map((teammate, index) => {
                    const isCurrentAthlete = teammate.person_id === profile.person_id;

                    return (
                      <div
                        key={teammate.id}
                        className="rounded-[1.2rem] bg-white/[0.04] px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {index + 1}. {getFullAthleteName(teammate)}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {isCurrentAthlete ? "Tu plaza actual" : "Companero de equipo"}
                            </p>
                          </div>
                          {isCurrentAthlete && (
                            <Badge
                              variant="outline"
                              className="border-brand-green/30 text-brand-green"
                            >
                              Tu cuenta
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-white/8 pt-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Historial de participacion
                  </p>
                  <div className="mt-3 space-y-3">
                    {athleteParticipations.map((participation) => {
                      const isCurrentEdition =
                        participation.edition?.id === activeEdition?.id;

                      return (
                        <div
                          key={participation.id}
                          className="rounded-[1.2rem] bg-white/[0.04] px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-white">
                              {participation.edition?.label ?? "Edicion"}
                            </p>
                            {isCurrentEdition && (
                              <Badge
                                variant="outline"
                                className="border-brand-cyan/30 text-brand-cyan"
                              >
                                Actual
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="border-white/12 text-white/75"
                            >
                              {getParticipationStateLabel(participation)}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm font-medium text-white">
                            {participation.team?.name ?? "Equipo por confirmar"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {participation.category?.name ?? "Categoria pendiente"} ·{" "}
                            {formatEditionMeta(participation.edition)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-5">
              <p className="text-lg font-semibold text-white">
                Tu cuenta ya existe, pero tu perfil deportivo todavia no esta vinculado
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                Esto suele significar que ya tienes acceso, pero aun falta
                completar la conversion administrativa desde la preinscripcion o
                enlazarte a tu equipo definitivo. La parte buena es que el
                sistema ya esta preparado para que, cuando eso ocurra, tu
                historial no empiece cada ano desde cero.
              </p>
            </div>
          )}
        </section>
      )}

      <section className="mt-6 rounded-[2rem] border border-white/8 bg-white/[0.02] p-6 md:p-8">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Contexto rapido
        </p>
        {profile.role === "athlete" ? (
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
            Esta cuenta ya no es solo una tarjeta de acceso. Si tu persona y tu
            equipo estan enlazados, aqui empiezas a ver tanto tu presente
            competitivo como la base de continuidad que permitira seguir tus
            participaciones entre ediciones sin rehacer el mapa cada vez.
          </p>
        ) : (
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
            Tu rol ya tiene acceso directo a la superficie operativa que le
            corresponde. Si eres parte del staff, esta cuenta hace de lanzadera
            para que no tengas que recordar rutas internas cada vez que entras.
          </p>
        )}
      </section>
    </div>
  );
}
