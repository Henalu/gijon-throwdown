import { requireAdminLikeProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Category,
  EditionParticipationRole,
  EventEdition,
  Person,
  Profile,
  Team,
} from "@/types";
import { PeopleClient } from "./people-client";

type PersonRow = Person & {
  profile: Pick<
    Profile,
    "id" | "email" | "role" | "is_judge" | "is_active" | "setup_completed_at"
  > | null;
  athlete: {
    id: string;
    teamName: string | null;
    categoryName: string | null;
  } | null;
  participationSummary: {
    totalEditions: number;
    latestEditionLabel: string | null;
    roles: EditionParticipationRole[];
  };
};

type ParticipationSummaryAccumulator = {
  editionIds: Set<string>;
  roles: Set<EditionParticipationRole>;
  latestEditionLabel: string | null;
  latestEditionYear: number;
  latestEditionIsActive: boolean;
};

export default async function PersonasPage() {
  await requireAdminLikeProfile("/admin/personas");
  const adminClient = createAdminClient();

  const [
    { data: people },
    { data: profiles },
    { data: athletes },
    { data: teams },
    { data: categories },
    { data: editions },
    { data: participations },
  ] = await Promise.all([
    adminClient.from("people").select("*").order("created_at", { ascending: false }),
    adminClient
      .from("profiles")
      .select("id, person_id, email, role, is_judge, is_active, setup_completed_at")
      .not("person_id", "is", null),
    adminClient
      .from("athletes")
      .select("id, person_id, team_id")
      .not("person_id", "is", null),
    adminClient.from("teams").select("id, name, category_id"),
    adminClient.from("categories").select("id, name"),
    adminClient.from("event_editions").select("id, label, year, is_active"),
    adminClient.from("edition_participations").select("person_id, edition_id, role"),
  ]);

  const profileByPersonId = new Map(
    (profiles ?? []).map((profile) => [profile.person_id as string, profile]),
  );
  const teamById = new Map((teams ?? []).map((team) => [team.id, team]));
  const categoryById = new Map(
    (categories ?? []).map((category) => [category.id, category]),
  );
  const editionById = new Map(
    ((editions ?? []) as Pick<EventEdition, "id" | "label" | "year" | "is_active">[])
      .map((edition) => [edition.id, edition]),
  );
  const athleteByPersonId = new Map(
    (athletes ?? []).map((athlete) => [athlete.person_id as string, athlete]),
  );
  const participationSummaryByPersonId = new Map<string, ParticipationSummaryAccumulator>();

  for (const participation of
    ((participations ?? []) as Array<{
      person_id: string;
      edition_id: string;
      role: EditionParticipationRole;
    }>)) {
    const summary = participationSummaryByPersonId.get(participation.person_id) ?? {
      editionIds: new Set<string>(),
      roles: new Set<EditionParticipationRole>(),
      latestEditionLabel: null,
      latestEditionYear: Number.MIN_SAFE_INTEGER,
      latestEditionIsActive: false,
    };
    const edition = editionById.get(participation.edition_id);

    summary.editionIds.add(participation.edition_id);
    summary.roles.add(participation.role);

    const editionYear = edition?.year ?? Number.MIN_SAFE_INTEGER;
    const editionIsActive = edition?.is_active ?? false;
    const shouldReplaceLatest =
      (!summary.latestEditionIsActive && editionIsActive) ||
      (summary.latestEditionIsActive === editionIsActive &&
        editionYear > summary.latestEditionYear);

    if (shouldReplaceLatest) {
      summary.latestEditionLabel = edition?.label ?? null;
      summary.latestEditionYear = editionYear;
      summary.latestEditionIsActive = editionIsActive;
    }

    participationSummaryByPersonId.set(participation.person_id, summary);
  }

  const rows: PersonRow[] = ((people ?? []) as Person[]).map((person) => {
    const profile = profileByPersonId.get(person.id);
    const athlete = athleteByPersonId.get(person.id);
    const team = athlete ? teamById.get(athlete.team_id) : null;
    const category = team ? categoryById.get(team.category_id) : null;

    return {
      ...person,
      profile: profile
        ? {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            is_judge: profile.is_judge,
            is_active: profile.is_active,
            setup_completed_at: profile.setup_completed_at,
          }
        : null,
      athlete: athlete
        ? {
            id: athlete.id,
            teamName: (team as Team | undefined)?.name ?? null,
            categoryName: (category as Category | undefined)?.name ?? null,
          }
        : null,
      participationSummary: (() => {
        const rawSummary = participationSummaryByPersonId.get(person.id);

        if (!rawSummary) {
          return {
            totalEditions: 0,
            latestEditionLabel: null,
            roles: [],
          };
        }

        return {
          totalEditions: rawSummary.editionIds.size,
          latestEditionLabel: rawSummary.latestEditionLabel,
          roles: Array.from(rawSummary.roles),
        };
      })(),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Personas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro canonico de personas reutilizable entre accesos, atletas y
          futuras conversiones.
        </p>
      </div>

      <PeopleClient people={rows} />
    </div>
  );
}
