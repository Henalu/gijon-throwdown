"use server";

import { revalidatePath } from "next/cache";
import { isAdminLikeRole } from "@/lib/auth/permissions";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import { closeOpenLanesForHeat, fetchHeatLiveContext } from "@/lib/live-results-server";
import { createClient } from "@/lib/supabase/server";
import type { LiveLaneCloseReason } from "@/types";

async function requireAdminLikeActor() {
  const session = await getCurrentSessionProfile();

  if (!session.user || !session.profile) {
    return { error: "No autenticado" as const };
  }

  if (!session.profile.is_active || !isAdminLikeRole(session.profile.role)) {
    return { error: "No tienes permisos para gestionar heats" as const };
  }

  return session;
}

function revalidateHeatPaths(heatId?: string) {
  revalidatePath("/admin/heats");
  revalidatePath("/voluntario");
  revalidatePath("/admin/puntuaciones");
  revalidatePath("/admin/validacion");

  if (heatId) {
    revalidatePath(`/voluntario/heat/${heatId}`);
    revalidatePath(`/admin/validacion/${heatId}`);
    revalidatePath(`/live/${heatId}`);
    revalidatePath(`/overlay/${heatId}`);
  }
}

export async function createHeat(
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminLikeActor();
  if ("error" in actor) {
    return actor;
  }

  const supabase = await createClient();

  const { error } = await supabase.from("heats").insert({
    category_id: formData.get("category_id") as string,
    workout_id: formData.get("workout_id") as string,
    heat_number: Number(formData.get("heat_number")),
    scheduled_at: (formData.get("scheduled_at") as string) || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateHeatPaths();
  return { success: true };
}

export async function updateHeatStatus(
  id: string,
  status: string,
): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminLikeActor();
  if ("error" in actor) {
    return actor;
  }

  const supabase = await createClient();

  if (status === "finished") {
    const heat = await fetchHeatLiveContext(supabase, id);
    if (!heat || !heat.workout) {
      return { error: "Heat no encontrado" };
    }

    const closeReason: LiveLaneCloseReason = heat.workout.time_cap_seconds
      ? "time_cap"
      : "manual";

    try {
      await closeOpenLanesForHeat({
        supabase,
        heat,
        actorId: actor.user.id,
        closeReason,
        closeHeat: true,
      });
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "No se pudo cerrar el heat",
      };
    }

    revalidateHeatPaths(id);
    return { success: true };
  }

  const updates: Record<string, string | boolean | null> = { status };

  if (status === "active") {
    updates.started_at = new Date().toISOString();
  } else if (status === "pending") {
    updates.finished_at = null;
  }

  const { error } = await supabase.from("heats").update(updates).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateHeatPaths(id);
  return { success: true };
}

export async function updateHeatLiveEntry(
  id: string,
  isLiveEntryEnabled: boolean,
): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminLikeActor();
  if ("error" in actor) {
    return actor;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("heats")
    .update({ is_live_entry_enabled: isLiveEntryEnabled })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateHeatPaths(id);
  return { success: true };
}

export async function deleteHeat(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminLikeActor();
  if ("error" in actor) {
    return actor;
  }

  const supabase = await createClient();

  const { error } = await supabase.from("heats").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateHeatPaths(id);
  return { success: true };
}

export async function assignLane(
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminLikeActor();
  if ("error" in actor) {
    return actor;
  }

  const supabase = await createClient();
  const heatId = formData.get("heat_id") as string;

  const { error } = await supabase.from("lanes").insert({
    heat_id: heatId,
    team_id: formData.get("team_id") as string,
    lane_number: Number(formData.get("lane_number")),
  });

  if (error) {
    return { error: error.message };
  }

  revalidateHeatPaths(heatId);
  return { success: true };
}

export async function removeLane(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminLikeActor();
  if ("error" in actor) {
    return actor;
  }

  const supabase = await createClient();

  const { data: lane } = await supabase
    .from("lanes")
    .select("heat_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("lanes").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateHeatPaths(lane?.heat_id ?? undefined);
  return { success: true };
}
