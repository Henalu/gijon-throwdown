import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthProfile } from "@/lib/auth/permissions";
import { isAdminLikeRole } from "@/lib/auth/permissions";

export interface VolunteerHeatCard {
  id: string;
  heat_number: number;
  status: string;
  scheduled_at: string | null;
  is_live_entry_enabled: boolean;
  team_names: string[];
  category: { name: string } | null;
  workout: { name: string; slug: string | null } | null;
  assignment: {
    id: string;
    notes: string | null;
    lane_id: string | null;
  } | null;
}

function getSingleRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function canUserOperateHeat(params: {
  supabase: SupabaseClient;
  profile: AuthProfile;
  userId: string;
  heatId: string;
}): Promise<{ allowed: boolean; reason?: string }> {
  const { supabase, profile, userId, heatId } = params;

  if (!profile.is_active) {
    return { allowed: false, reason: "Tu acceso esta desactivado" };
  }

  if (isAdminLikeRole(profile.role)) {
    return { allowed: true };
  }

  if (profile.role !== "volunteer") {
    return { allowed: false, reason: "Tu rol no puede operar el live" };
  }

  const [{ data: heat }, { data: assignment }] = await Promise.all([
    supabase
      .from("heats")
      .select("id, status, is_live_entry_enabled")
      .eq("id", heatId)
      .maybeSingle(),
    supabase
      .from("volunteer_assignments")
      .select("id")
      .eq("volunteer_id", userId)
      .eq("heat_id", heatId)
      .maybeSingle(),
  ]);

  if (!heat) {
    return { allowed: false, reason: "Heat no encontrado" };
  }

  const assignedAndOperable =
    Boolean(assignment) && (heat.status === "active" || heat.is_live_entry_enabled);
  const enabledActiveHeat = heat.status === "active" && heat.is_live_entry_enabled;

  if (assignedAndOperable || enabledActiveHeat) {
    return { allowed: true };
  }

  if (!heat.is_live_entry_enabled && heat.status !== "active") {
    return {
      allowed: false,
      reason: "El heat todavia no esta habilitado para entrada live",
    };
  }

  return {
    allowed: false,
    reason: "No tienes asignacion ni permiso operativo para este heat",
  };
}

export async function getVolunteerHeatBuckets(params: {
  supabase: SupabaseClient;
  profile: AuthProfile;
  userId: string;
}): Promise<{
  assigned: VolunteerHeatCard[];
  available: VolunteerHeatCard[];
  unavailable: VolunteerHeatCard[];
}> {
  const { supabase, profile, userId } = params;

  const [{ data: assignments }, { data: activeHeats }] = await Promise.all([
    supabase
      .from("volunteer_assignments")
      .select(`
        id,
        notes,
        lane_id,
        heat:heats(
          id,
          heat_number,
          status,
          scheduled_at,
          is_live_entry_enabled,
          category:categories(name),
          workout:workouts(name, slug)
        )
      `)
      .eq("volunteer_id", userId)
      .order("created_at"),
    supabase
      .from("heats")
      .select(`
        id,
        heat_number,
        status,
        scheduled_at,
        is_live_entry_enabled,
        category:categories(name),
        workout:workouts(name, slug)
      `)
      .eq("status", "active")
      .order("scheduled_at"),
  ]);

  const heatIds = [
    ...new Set(
      [
        ...((assignments ?? []).map((assignment) => {
          const heat = getSingleRelation(
            assignment.heat as unknown as Array<{ id: string }> | { id: string } | null,
          );
          return heat?.id ?? null;
        })),
        ...((activeHeats ?? []).map((heat) => heat.id)),
      ].filter(Boolean) as string[],
    ),
  ];

  const { data: laneRows } =
    heatIds.length > 0
      ? await supabase
          .from("lanes")
          .select("heat_id, team:teams(name)")
          .in("heat_id", heatIds)
      : { data: [] };

  const teamNamesByHeatId = new Map<string, string[]>();
  for (const lane of (laneRows ?? []) as Array<{
    heat_id: string;
    team: { name: string } | { name: string }[] | null;
  }>) {
    const team = getSingleRelation(lane.team);
    const current = teamNamesByHeatId.get(lane.heat_id) ?? [];
    if (team?.name && !current.includes(team.name)) {
      current.push(team.name);
      teamNamesByHeatId.set(lane.heat_id, current);
    }
  }

  const assigned = (assignments ?? [])
    .map((assignment) => {
      const heat = getSingleRelation(
        assignment.heat as unknown as Omit<VolunteerHeatCard, "assignment">[] | Omit<VolunteerHeatCard, "assignment"> | null,
      );
      if (!heat) return null;

      return {
        ...heat,
        team_names: teamNamesByHeatId.get(heat.id) ?? [],
        category: getSingleRelation(heat.category),
        workout: getSingleRelation(heat.workout),
        assignment: {
          id: assignment.id,
          notes: assignment.notes,
          lane_id: assignment.lane_id,
        },
      };
    })
    .filter(Boolean) as VolunteerHeatCard[];

  const assignedIds = new Set(assigned.map((heat) => heat.id));
  const activeCards = (activeHeats ?? []).map((heat) => {
    const normalizedHeat = heat as unknown as Omit<
      VolunteerHeatCard,
      "assignment"
    > & {
      category: { name: string }[] | { name: string } | null;
      workout:
        | { name: string; slug: string | null }[]
        | { name: string; slug: string | null }
        | null;
    };

    return {
      ...normalizedHeat,
      team_names: teamNamesByHeatId.get(normalizedHeat.id) ?? [],
      category: getSingleRelation(normalizedHeat.category),
      workout: getSingleRelation(normalizedHeat.workout),
      assignment: null,
    };
  });

  if (isAdminLikeRole(profile.role)) {
    return {
      assigned,
      available: activeCards,
      unavailable: [],
    };
  }

  const available = activeCards.filter(
    (heat) => !assignedIds.has(heat.id) && heat.is_live_entry_enabled,
  );
  const unavailable = activeCards.filter(
    (heat) => !assignedIds.has(heat.id) && !heat.is_live_entry_enabled,
  );

  return {
    assigned,
    available,
    unavailable,
  };
}
