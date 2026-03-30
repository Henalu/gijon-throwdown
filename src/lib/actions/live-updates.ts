"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import { canUserOperateHeat } from "@/lib/auth/live-access";

export async function submitLiveUpdate(data: {
  lane_id: string;
  heat_id: string;
  update_type: string;
  value: number;
  cumulative: number;
  workout_stage_id?: string;
}): Promise<{ error: string } | { success: true }> {
  const session = await getCurrentSessionProfile();
  if (!session.user || !session.profile) {
    return { error: "No autenticado" };
  }

  const supabase = await createClient();
  const access = await canUserOperateHeat({
    supabase,
    profile: session.profile,
    userId: session.user.id,
    heatId: data.heat_id,
  });

  if (!access.allowed) {
    return { error: access.reason ?? "No puedes operar este heat" };
  }

  const { data: lane } = await supabase
    .from("lanes")
    .select("id")
    .eq("id", data.lane_id)
    .eq("heat_id", data.heat_id)
    .maybeSingle();

  if (!lane) {
    return { error: "La lane no pertenece al heat indicado" };
  }

  const { error } = await supabase.from("live_updates").insert({
    lane_id: data.lane_id,
    heat_id: data.heat_id,
    workout_stage_id: data.workout_stage_id || null,
    update_type: data.update_type,
    value: data.value,
    cumulative: data.cumulative,
    submitted_by: session.user.id,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function markLaneFinished(
  lane_id: string,
  heat_id: string
): Promise<{ error: string } | { success: true }> {
  const session = await getCurrentSessionProfile();
  if (!session.user || !session.profile) {
    return { error: "No autenticado" };
  }

  const supabase = await createClient();
  const access = await canUserOperateHeat({
    supabase,
    profile: session.profile,
    userId: session.user.id,
    heatId: heat_id,
  });

  if (!access.allowed) {
    return { error: access.reason ?? "No puedes operar este heat" };
  }

  const { data: lane } = await supabase
    .from("lanes")
    .select("id")
    .eq("id", lane_id)
    .eq("heat_id", heat_id)
    .maybeSingle();

  if (!lane) {
    return { error: "La lane no pertenece al heat indicado" };
  }

  // Get the latest cumulative value for this lane
  const { data: latest, error: fetchError } = await supabase
    .from("live_updates")
    .select("cumulative")
    .eq("lane_id", lane_id)
    .eq("heat_id", heat_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    return { error: fetchError.message };
  }

  const { error } = await supabase.from("live_updates").insert({
    lane_id,
    heat_id,
    update_type: "finished",
    value: 0,
    cumulative: latest?.cumulative ?? 0,
    submitted_by: session.user.id,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function getLaneState(heat_id: string): Promise<
  | { error: string }
  | {
      success: true;
      data: {
        lane_id: string;
        update_type: string;
        value: number;
        cumulative: number;
        workout_stage_id: string | null;
        created_at: string;
      }[];
    }
> {
  const supabase = await createClient();

  // Fetch all updates for this heat ordered by lane and time,
  // then pick the latest per lane using Supabase's distinct-on workaround:
  // order by lane_id + created_at desc, so the first row per lane is the latest.
  const { data, error } = await supabase
    .from("live_updates")
    .select("lane_id, update_type, value, cumulative, workout_stage_id, created_at")
    .eq("heat_id", heat_id)
    .order("lane_id")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  // Deduplicate: keep only the first (most recent) entry per lane_id
  const seen = new Set<string>();
  const latestPerLane = (data ?? []).filter((row) => {
    if (seen.has(row.lane_id)) return false;
    seen.add(row.lane_id);
    return true;
  });

  return { success: true, data: latestPerLane };
}
