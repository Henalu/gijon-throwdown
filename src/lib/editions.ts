import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { EditionParticipationRole } from "@/types";

type AdminClient = ReturnType<typeof createAdminClient>;

interface ActiveEditionRow {
  id: string;
  slug: string;
  label: string;
  year: number | null;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
}

interface ExistingParticipationRow {
  id: string;
  profile_id: string | null;
  team_id: string | null;
  category_id: string | null;
  athlete_id: string | null;
  invited_at: string | null;
  activated_at: string | null;
}

interface ProfileLinkRow {
  id: string;
  invited_at: string | null;
  setup_completed_at: string | null;
}

interface TeamEditionContext {
  id: string;
  edition_id: string | null;
  category_id: string;
}

function mergeTimestamp(current: string | null, incoming?: string | null) {
  return current ?? incoming ?? null;
}

export async function getActiveEdition(
  adminClient: AdminClient,
): Promise<ActiveEditionRow | null> {
  const { data: eventConfig, error: configError } = await adminClient
    .from("event_config")
    .select("active_edition_id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (configError) {
    throw new Error(configError.message);
  }

  if (!eventConfig?.active_edition_id) {
    return null;
  }

  const { data: edition, error: editionError } = await adminClient
    .from("event_editions")
    .select("id, slug, label, year, starts_on, ends_on, is_active")
    .eq("id", eventConfig.active_edition_id)
    .maybeSingle();

  if (editionError) {
    throw new Error(editionError.message);
  }

  return (edition as ActiveEditionRow | null) ?? null;
}

export async function getActiveEditionId(adminClient: AdminClient) {
  return (await getActiveEdition(adminClient))?.id ?? null;
}

export async function getTeamEditionContext(
  adminClient: AdminClient,
  teamId: string,
): Promise<TeamEditionContext | null> {
  const { data, error } = await adminClient
    .from("teams")
    .select("id, edition_id, category_id")
    .eq("id", teamId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as TeamEditionContext | null) ?? null;
}

export async function upsertEditionParticipation(params: {
  adminClient: AdminClient;
  editionId: string;
  personId: string;
  role: EditionParticipationRole;
  profileId?: string | null;
  teamId?: string | null;
  categoryId?: string | null;
  athleteId?: string | null;
  invitedAt?: string | null;
  activatedAt?: string | null;
  notes?: string | null;
}) {
  const {
    adminClient,
    editionId,
    personId,
    role,
    profileId,
    teamId,
    categoryId,
    athleteId,
    invitedAt,
    activatedAt,
    notes,
  } = params;

  const { data: existing, error: existingError } = await adminClient
    .from("edition_participations")
    .select(
      "id, profile_id, team_id, category_id, athlete_id, invited_at, activated_at",
    )
    .eq("edition_id", editionId)
    .eq("person_id", personId)
    .eq("role", role)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const now = new Date().toISOString();
  const existingParticipation = (existing as ExistingParticipationRow | null) ?? null;

  if (existingParticipation) {
    const { error } = await adminClient
      .from("edition_participations")
      .update({
        profile_id: profileId ?? existingParticipation.profile_id,
        team_id: teamId ?? existingParticipation.team_id,
        category_id: categoryId ?? existingParticipation.category_id,
        athlete_id: athleteId ?? existingParticipation.athlete_id,
        invited_at: mergeTimestamp(existingParticipation.invited_at, invitedAt),
        activated_at: mergeTimestamp(
          existingParticipation.activated_at,
          activatedAt,
        ),
        notes: notes ?? undefined,
        updated_at: now,
      })
      .eq("id", existingParticipation.id);

    if (error) {
      throw new Error(error.message);
    }

    return existingParticipation.id;
  }

  const { data, error } = await adminClient
    .from("edition_participations")
    .insert({
      edition_id: editionId,
      person_id: personId,
      profile_id: profileId ?? null,
      team_id: teamId ?? null,
      category_id: categoryId ?? null,
      athlete_id: athleteId ?? null,
      role,
      invited_at: invitedAt ?? null,
      activated_at: activatedAt ?? null,
      notes: notes ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear la participacion");
  }

  return data.id as string;
}

export async function syncProfileEditionLinks(params: {
  adminClient: AdminClient;
  personId: string;
  profileId: string;
  invitedAt?: string | null;
  activatedAt?: string | null;
}) {
  const { adminClient, personId, profileId, invitedAt, activatedAt } = params;

  const { data: participations, error } = await adminClient
    .from("edition_participations")
    .select("id, profile_id, invited_at, activated_at")
    .eq("person_id", personId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (participations as ExistingParticipationRow[] | null) ?? [];
  if (rows.length === 0) {
    return;
  }

  const now = new Date().toISOString();

  for (const row of rows) {
    const shouldUpdate =
      row.profile_id !== profileId ||
      (!row.invited_at && invitedAt) ||
      (!row.activated_at && activatedAt);

    if (!shouldUpdate) {
      continue;
    }

    const { error: updateError } = await adminClient
      .from("edition_participations")
      .update({
        profile_id: profileId,
        invited_at: mergeTimestamp(row.invited_at, invitedAt),
        activated_at: mergeTimestamp(row.activated_at, activatedAt),
        updated_at: now,
      })
      .eq("id", row.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}

export async function upsertVolunteerEditionParticipation(params: {
  adminClient: AdminClient;
  personId: string;
  profileId?: string | null;
  invitedAt?: string | null;
  activatedAt?: string | null;
}) {
  const { adminClient, personId, profileId, invitedAt, activatedAt } = params;
  const editionId = await getActiveEditionId(adminClient);

  if (!editionId) {
    return null;
  }

  return upsertEditionParticipation({
    adminClient,
    editionId,
    personId,
    profileId,
    role: "volunteer",
    invitedAt,
    activatedAt,
    notes: "Participacion voluntaria sincronizada desde conversion o invitacion",
  });
}

export async function upsertStaffEditionParticipation(params: {
  adminClient: AdminClient;
  personId: string;
  profileId?: string | null;
  invitedAt?: string | null;
  activatedAt?: string | null;
}) {
  const { adminClient, personId, profileId, invitedAt, activatedAt } = params;
  const editionId = await getActiveEditionId(adminClient);

  if (!editionId) {
    return null;
  }

  return upsertEditionParticipation({
    adminClient,
    editionId,
    personId,
    profileId,
    role: "staff",
    invitedAt,
    activatedAt,
    notes: "Participacion staff sincronizada desde cuenta operativa",
  });
}

export async function upsertAthleteEditionParticipation(
  adminClient: AdminClient,
  athleteId: string,
) {
  const { data: athlete, error: athleteError } = await adminClient
    .from("athletes")
    .select("id, person_id, team_id, edition_id")
    .eq("id", athleteId)
    .maybeSingle();

  if (athleteError) {
    throw new Error(athleteError.message);
  }

  if (!athlete?.person_id) {
    return null;
  }

  const team = await getTeamEditionContext(adminClient, athlete.team_id);
  const editionId = athlete.edition_id ?? team?.edition_id ?? (await getActiveEditionId(adminClient));

  if (!team || !editionId) {
    return null;
  }

  if (!athlete.edition_id || athlete.edition_id !== editionId) {
    const { error: athleteUpdateError } = await adminClient
      .from("athletes")
      .update({
        edition_id: editionId,
      })
      .eq("id", athlete.id);

    if (athleteUpdateError) {
      throw new Error(athleteUpdateError.message);
    }
  }

  if (!team.edition_id || team.edition_id !== editionId) {
    const { error: teamUpdateError } = await adminClient
      .from("teams")
      .update({
        edition_id: editionId,
      })
      .eq("id", team.id);

    if (teamUpdateError) {
      throw new Error(teamUpdateError.message);
    }
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, invited_at, setup_completed_at")
    .eq("person_id", athlete.person_id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return upsertEditionParticipation({
    adminClient,
    editionId,
    personId: athlete.person_id,
    profileId: (profile as ProfileLinkRow | null)?.id ?? null,
    role: "athlete",
    teamId: athlete.team_id,
    categoryId: team.category_id,
    athleteId: athlete.id,
    invitedAt: (profile as ProfileLinkRow | null)?.invited_at ?? null,
    activatedAt: (profile as ProfileLinkRow | null)?.setup_completed_at ?? null,
    notes: "Participacion atleta sincronizada desde equipo confirmado",
  });
}

export async function deleteAthleteEditionParticipation(
  adminClient: AdminClient,
  athleteId: string,
) {
  const { error } = await adminClient
    .from("edition_participations")
    .delete()
    .eq("athlete_id", athleteId)
    .eq("role", "athlete");

  if (error) {
    throw new Error(error.message);
  }
}
