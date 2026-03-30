import { createClient } from "@/lib/supabase/server";
import type {
  Athlete,
  Category,
  Person,
  Profile,
  Team,
  TeamRegistration,
  TeamRegistrationMember,
  UserRole,
} from "@/types";
import { EquiposClient } from "./equipos-client";

type TeamWithCategory = Team & {
  categories: { name: string } | null;
};

type AthleteAdminRow = Athlete & {
  teamName: string | null;
  categoryName: string | null;
  fullName: string;
  email: string | null;
  shirtSize: string | null;
  gender: "male" | "female" | null;
  linkedProfileId: string | null;
  linkedProfileRole: UserRole | null;
  linkedProfileSetupCompletedAt: string | null;
};

type TeamRegistrationMemberWithAccount = TeamRegistrationMember & {
  linked_profile_id: string | null;
  linked_profile_role: UserRole | null;
  linked_profile_setup_completed_at: string | null;
};

type TeamRegistrationWithDetails = TeamRegistration & {
  categories: { name: string } | null;
  team_registration_members: TeamRegistrationMemberWithAccount[];
};

export default async function EquiposPage() {
  const supabase = await createClient();

  const [
    { data: teams },
    { data: categories },
    { data: registrations },
    { data: athletes },
    { data: people },
  ] = await Promise.all([
    supabase
      .from("teams")
      .select("*, categories(name)")
      .order("name", { ascending: true }),
    supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("team_registrations")
      .select("*, categories(name), team_registration_members(*)")
      .order("created_at", { ascending: false }),
    supabase
      .from("athletes")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("people").select("*"),
  ]);

  const personIds = [
    ...new Set(
      [
        ...((athletes ?? []) as Athlete[])
          .map((athlete) => athlete.person_id)
          .filter(Boolean),
        ...((registrations ?? []) as (TeamRegistration & {
          team_registration_members: TeamRegistrationMember[];
        })[])
          .flatMap((registration) =>
            (registration.team_registration_members ?? []).map(
              (member) => member.converted_person_id,
            ),
          )
          .filter(Boolean),
      ] as string[],
    ),
  ];

  const { data: profiles } =
    personIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, person_id, role, setup_completed_at")
          .in("person_id", personIds)
      : { data: [] };

  const teamById = new Map(
    ((teams ?? []) as TeamWithCategory[]).map((team) => [team.id, team]),
  );
  const peopleById = new Map(
    ((people ?? []) as Person[]).map((person) => [person.id, person]),
  );
  const profilesByPersonId = new Map(
    ((profiles ?? []) as Array<
      Pick<Profile, "id" | "person_id" | "role" | "setup_completed_at">
    >).map((profile) => [profile.person_id as string, profile]),
  );

  const athleteRows: AthleteAdminRow[] = ((athletes ?? []) as Athlete[]).map(
    (athlete) => {
      const team = teamById.get(athlete.team_id);
      const person = athlete.person_id ? peopleById.get(athlete.person_id) : null;
      const profile = athlete.person_id
        ? profilesByPersonId.get(athlete.person_id)
        : null;

      return {
        ...athlete,
        teamName: team?.name ?? null,
        categoryName: team?.categories?.name ?? null,
        fullName:
          person?.full_name ?? `${athlete.first_name} ${athlete.last_name}`.trim(),
        email: person?.primary_email ?? null,
        shirtSize: person?.shirt_size ?? null,
        gender: person?.gender ?? null,
        linkedProfileId: profile?.id ?? null,
        linkedProfileRole: profile?.role ?? null,
        linkedProfileSetupCompletedAt: profile?.setup_completed_at ?? null,
      };
    },
  );

  const registrationRows: TeamRegistrationWithDetails[] = (
    (registrations ?? []) as Array<
      TeamRegistration & {
        categories: { name: string } | null;
        team_registration_members: TeamRegistrationMember[];
      }
    >
  ).map((registration) => ({
    ...registration,
    team_registration_members: (registration.team_registration_members ?? []).map(
      (member) => {
        const linkedProfile = member.converted_person_id
          ? profilesByPersonId.get(member.converted_person_id)
          : null;

        return {
          ...member,
          linked_profile_id: linkedProfile?.id ?? null,
          linked_profile_role: linkedProfile?.role ?? null,
          linked_profile_setup_completed_at:
            linkedProfile?.setup_completed_at ?? null,
        };
      },
    ),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Equipos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Equipos confirmados, atletas reales y preinscripciones publicas en un
          mismo flujo operativo.
        </p>
      </div>

      <EquiposClient
        teams={(teams ?? []) as TeamWithCategory[]}
        athletes={athleteRows}
        categories={(categories ?? []) as Category[]}
        registrations={registrationRows}
      />
    </div>
  );
}
