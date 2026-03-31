"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import { canUserOperateHeat } from "@/lib/auth/live-access";
import { createClient } from "@/lib/supabase/server";
import {
  closeOpenLanesForHeat,
  ensureLaneBelongsToHeat,
  fetchHeatLaneResult,
  fetchHeatLiveContext,
  type HeatLiveContext,
} from "@/lib/live-results-server";
import {
  hasTimeCapElapsed,
} from "@/lib/live-scoring";
import type {
  LiveLaneCloseReason,
  LiveMetricType,
} from "@/types";

type LiveMutationResult =
  | { error: string }
  | { success: true; heatClosed?: boolean };

type LiveOperatorContext =
  | { error: string }
  | {
      session: Awaited<ReturnType<typeof getCurrentSessionProfile>> & {
        user: NonNullable<Awaited<ReturnType<typeof getCurrentSessionProfile>>["user"]>;
        profile: NonNullable<
          Awaited<ReturnType<typeof getCurrentSessionProfile>>["profile"]
        >;
      };
      supabase: Awaited<ReturnType<typeof createClient>>;
      heat: HeatLiveContext & {
        workout: NonNullable<HeatLiveContext["workout"]>;
      };
    };

function revalidateHeatLivePaths(heatId: string) {
  revalidatePath("/voluntario");
  revalidatePath(`/voluntario/heat/${heatId}`);
  revalidatePath("/admin/heats");
  revalidatePath("/admin/puntuaciones");
  revalidatePath("/admin/validacion");
  revalidatePath(`/admin/validacion/${heatId}`);
  revalidatePath(`/live/${heatId}`);
  revalidatePath(`/overlay/${heatId}`);
}

async function requireLiveOperatorContext(
  heatId: string,
): Promise<LiveOperatorContext> {
  const session = await getCurrentSessionProfile();
  if (!session.user || !session.profile) {
    return { error: "No autenticado" as const };
  }

  const supabase = await createClient();
  const access = await canUserOperateHeat({
    supabase,
    profile: session.profile,
    userId: session.user.id,
    heatId,
  });

  if (!access.allowed) {
    return { error: access.reason ?? "No puedes operar este heat" as const };
  }

  const heat = await fetchHeatLiveContext(supabase, heatId);
  if (!heat || !heat.workout) {
    return { error: "Heat no encontrado" as const };
  }

  return {
    session: {
      ...session,
      user: session.user,
      profile: session.profile,
    },
    supabase,
    heat: {
      ...heat,
      workout: heat.workout,
    },
  };
}

async function maybeAutoCloseHeatAtCap(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  heatId: string;
  actorId: string;
}) {
  const { supabase, heatId, actorId } = params;
  const heat = await fetchHeatLiveContext(supabase, heatId);

  if (!heat || !heat.workout) {
    return { closed: false, error: "Heat no encontrado" };
  }

  if (heat.status === "finished") {
    return { closed: false };
  }

  if (
    !heat.workout.time_cap_seconds ||
    !hasTimeCapElapsed(heat.started_at, heat.workout.time_cap_seconds)
  ) {
    return { closed: false };
  }

  await closeOpenLanesForHeat({
    supabase,
    heat,
    actorId,
    closeReason: "time_cap",
    closeHeat: true,
  });

  revalidateHeatLivePaths(heatId);
  return { closed: true };
}

export async function submitLiveUpdate(data: {
  lane_id: string;
  heat_id: string;
  update_type: string;
  value: number;
  cumulative: number;
  workout_stage_id?: string;
  client_event_id?: string;
}): Promise<LiveMutationResult> {
  const actor = await requireLiveOperatorContext(data.heat_id);
  if ("error" in actor) {
    return { error: actor.error };
  }

  if (actor.heat.status === "finished") {
    return { error: "El heat ya esta cerrado" };
  }

  const autoClosed = await maybeAutoCloseHeatAtCap({
    supabase: actor.supabase,
    heatId: data.heat_id,
    actorId: actor.session.user.id,
  });

  if (autoClosed.closed) {
    return { error: "Se ha alcanzado el time cap y el heat se ha cerrado" };
  }

  const lane = await ensureLaneBelongsToHeat(
    actor.supabase,
    data.lane_id,
    data.heat_id,
  );
  if (!lane) {
    return { error: "La lane no pertenece al heat indicado" };
  }

  const existingResult = await fetchHeatLaneResult(
    actor.supabase,
    data.heat_id,
    data.lane_id,
  );
  if (existingResult) {
    return { error: "La calle ya esta cerrada" };
  }

  if (data.client_event_id) {
    const { data: existing } = await actor.supabase
      .from("live_updates")
      .select("id")
      .eq("client_event_id", data.client_event_id)
      .maybeSingle();
    if (existing) {
      return { success: true };
    }
  }

  const { error } = await actor.supabase.from("live_updates").insert({
    lane_id: data.lane_id,
    heat_id: data.heat_id,
    workout_stage_id: data.workout_stage_id || null,
    update_type: data.update_type,
    value: data.value,
    cumulative: data.cumulative,
    submitted_by: actor.session.user.id,
    ...(data.client_event_id ? { client_event_id: data.client_event_id } : {}),
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function saveLiveCheckpoint(data: {
  lane_id: string;
  heat_id: string;
  value: number;
  metric_type: LiveMetricType;
  elapsed_ms: number | null;
  client_event_id?: string;
}): Promise<LiveMutationResult> {
  const actor = await requireLiveOperatorContext(data.heat_id);
  if ("error" in actor) {
    return { error: actor.error };
  }

  if (actor.heat.status === "finished") {
    return { error: "El heat ya esta cerrado" };
  }

  const autoClosed = await maybeAutoCloseHeatAtCap({
    supabase: actor.supabase,
    heatId: data.heat_id,
    actorId: actor.session.user.id,
  });

  if (autoClosed.closed) {
    return { error: "Se ha alcanzado el time cap y el heat se ha cerrado" };
  }

  const lane = await ensureLaneBelongsToHeat(
    actor.supabase,
    data.lane_id,
    data.heat_id,
  );
  if (!lane) {
    return { error: "La lane no pertenece al heat indicado" };
  }

  const existingResult = await fetchHeatLaneResult(
    actor.supabase,
    data.heat_id,
    data.lane_id,
  );
  if (existingResult) {
    return { error: "La calle ya esta cerrada" };
  }

  if (data.client_event_id) {
    const { data: existing } = await actor.supabase
      .from("live_checkpoints")
      .select("id")
      .eq("client_event_id", data.client_event_id)
      .maybeSingle();
    if (existing) {
      return { success: true };
    }
  }

  const { error } = await actor.supabase.from("live_checkpoints").insert({
    heat_id: data.heat_id,
    lane_id: data.lane_id,
    value: data.value,
    metric_type: data.metric_type,
    elapsed_ms: data.elapsed_ms,
    submitted_by: actor.session.user.id,
    ...(data.client_event_id ? { client_event_id: data.client_event_id } : {}),
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function closeLaneResult(data: {
  lane_id: string;
  heat_id: string;
  close_reason: LiveLaneCloseReason;
  final_value: number;
  final_metric_type: LiveMetricType;
  final_elapsed_ms: number | null;
  judge_notes?: string;
  client_event_id?: string;
}): Promise<LiveMutationResult> {
  const actor = await requireLiveOperatorContext(data.heat_id);
  if ("error" in actor) {
    return { error: actor.error };
  }

  const autoClosed = await maybeAutoCloseHeatAtCap({
    supabase: actor.supabase,
    heatId: data.heat_id,
    actorId: actor.session.user.id,
  });

  if (autoClosed.error) {
    return { error: autoClosed.error };
  }

  const lane = await ensureLaneBelongsToHeat(
    actor.supabase,
    data.lane_id,
    data.heat_id,
  );
  if (!lane) {
    return { error: "La lane no pertenece al heat indicado" };
  }

  const capMs = actor.heat.workout.time_cap_seconds
    ? actor.heat.workout.time_cap_seconds * 1000
    : null;

  if (
    data.close_reason === "completed" &&
    capMs != null &&
    data.final_elapsed_ms != null &&
    data.final_elapsed_ms > capMs
  ) {
    return {
      error: "No puedes marcar una calle como completada despues del time cap",
    };
  }

  const { data: existingResult } = await actor.supabase
    .from("live_lane_results")
    .select("*")
    .eq("heat_id", data.heat_id)
    .eq("lane_id", data.lane_id)
    .maybeSingle();

  if (existingResult) {
    const { error } = await actor.supabase
      .from("live_lane_results")
      .update({
        judge_notes: data.judge_notes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingResult.id);

    if (error) {
      return { error: error.message };
    }

    revalidateHeatLivePaths(data.heat_id);
    return { success: true };
  }

  if (actor.heat.status === "finished") {
    return { error: "El heat ya esta cerrado y la calle no admite un cierre nuevo" };
  }

  const { error } = await actor.supabase.from("live_lane_results").insert({
    heat_id: data.heat_id,
    lane_id: data.lane_id,
    close_reason: data.close_reason,
    final_value: data.final_value,
    final_metric_type: data.final_metric_type,
    final_elapsed_ms:
      data.close_reason === "time_cap" && capMs != null
        ? capMs
        : data.final_elapsed_ms,
    judge_notes: data.judge_notes?.trim() || null,
    closed_by: actor.session.user.id,
    updated_at: new Date().toISOString(),
    ...(data.client_event_id ? { client_event_id: data.client_event_id } : {}),
  });

  if (error) {
    return { error: error.message };
  }

  revalidateHeatLivePaths(data.heat_id);
  return { success: true };
}

export async function autoCloseHeatAtCap(
  heatId: string,
): Promise<LiveMutationResult> {
  const actor = await requireLiveOperatorContext(heatId);
  if ("error" in actor) {
    return { error: actor.error };
  }

  const result = await maybeAutoCloseHeatAtCap({
    supabase: actor.supabase,
    heatId,
    actorId: actor.session.user.id,
  });

  if (result.error) {
    return { error: result.error };
  }

  return { success: true, heatClosed: result.closed };
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

  const { data, error } = await supabase
    .from("live_updates")
    .select("lane_id, update_type, value, cumulative, workout_stage_id, created_at")
    .eq("heat_id", heat_id)
    .order("lane_id")
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  const seen = new Set<string>();
  const latestPerLane = (data ?? []).filter((row) => {
    if (seen.has(row.lane_id)) return false;
    seen.add(row.lane_id);
    return true;
  });

  return { success: true, data: latestPerLane };
}
