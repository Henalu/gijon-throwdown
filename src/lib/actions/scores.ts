"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canValidateScoresProfile, isAdminLikeRole } from "@/lib/auth/permissions";
import { getCurrentSessionProfile } from "@/lib/auth/session";

function revalidateScorePaths(heatId?: string) {
  revalidatePath("/admin/puntuaciones");
  revalidatePath("/admin/validacion");

  if (heatId) {
    revalidatePath(`/admin/validacion/${heatId}`);
  }

  revalidatePath("/clasificacion");
}

async function requireAdminLikeActor() {
  const session = await getCurrentSessionProfile();

  if (!session.user || !session.profile) {
    return { error: "No autenticado" as const };
  }

  if (!session.profile.is_active || !isAdminLikeRole(session.profile.role)) {
    return { error: "No tienes permisos para gestionar puntuaciones" as const };
  }

  return session;
}

async function requireValidationActor() {
  const session = await getCurrentSessionProfile();

  if (!session.user || !session.profile) {
    return { error: "No autenticado" as const };
  }

  if (!canValidateScoresProfile(session.profile)) {
    return { error: "No tienes permisos para validar resultados" as const };
  }

  return session;
}

export async function finalizeHeat(
  heatId: string
): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminLikeActor();
  if ("error" in actor) {
    return actor;
  }

  const supabase = await createClient();

  // Fetch heat with its workout and lanes (with teams)
  const { data: heat, error: heatError } = await supabase
    .from("heats")
    .select(
      "*, workout:workouts(id, wod_type, score_type, time_cap_seconds, higher_is_better), lanes(id, team_id, team:teams(id, name))"
    )
    .eq("id", heatId)
    .single();

  if (heatError || !heat) {
    return { error: heatError?.message ?? "Heat no encontrado" };
  }

  const { data: existingScores } = await supabase
    .from("scores")
    .select("id")
    .eq("heat_id", heatId)
    .limit(1);

  if (existingScores && existingScores.length > 0) {
    return { error: "Este heat ya tiene un borrador de scores generado" };
  }

  const workout = heat.workout;
  const lanes = heat.lanes ?? [];

  if (!workout) {
    return { error: "Workout no encontrado para este heat" };
  }

  if (lanes.length === 0) {
    return { error: "No hay lanes asignados a este heat" };
  }

  // For each lane, get the latest live_update
  const scores: {
    team_id: string;
    workout_id: string;
    heat_id: string;
    time_ms: number | null;
    reps: number | null;
    is_cap: boolean;
    is_published: boolean;
    submitted_by: string;
  }[] = [];

  for (const lane of lanes) {
    // Get latest live_update for this lane
    const { data: updates, error: updatesError } = await supabase
      .from("live_updates")
      .select("update_type, cumulative, created_at")
      .eq("lane_id", lane.id)
      .eq("heat_id", heatId)
      .order("created_at", { ascending: false });

    if (updatesError) {
      return { error: updatesError.message };
    }

    const latestUpdate = updates?.[0] ?? null;
    const finishedUpdate = updates?.find((u) => u.update_type === "finished");

    let time_ms: number | null = null;
    let reps: number | null = null;
    let is_cap = false;

    if (workout.wod_type === "for_time") {
      if (finishedUpdate && heat.started_at) {
        // Team finished: time = difference between heat start and finish update
        const start = new Date(heat.started_at).getTime();
        const end = new Date(finishedUpdate.created_at).getTime();
        time_ms = end - start;
      } else {
        // Team hit the time cap: record their reps and mark as capped
        is_cap = true;
        reps = latestUpdate?.cumulative ?? 0;
        if (workout.time_cap_seconds) {
          time_ms = workout.time_cap_seconds * 1000;
        }
      }
    } else {
      // amrap, emom, chipper, etc. -- use cumulative reps
      reps = latestUpdate?.cumulative ?? 0;
    }

    scores.push({
      team_id: lane.team_id,
      workout_id: workout.id,
      heat_id: heatId,
      time_ms,
      reps,
      is_cap,
      is_published: false,
      submitted_by: actor.user.id,
    });
  }

  const { error: insertError } = await supabase.from("scores").insert(scores);

  if (insertError) {
    return { error: insertError.message };
  }

  revalidateScorePaths(heatId);
  return { success: true };
}

export async function updateScore(
  scoreId: string,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const actor = await requireValidationActor();
  if ("error" in actor) {
    return actor;
  }

  const supabase = await createClient();

  const timeMsRaw = formData.get("time_ms");
  const repsRaw = formData.get("reps");
  const weightKgRaw = formData.get("weight_kg");
  const roundsRaw = formData.get("rounds");
  const remainingRepsRaw = formData.get("remaining_reps");
  const penaltySecondsRaw = formData.get("penalty_seconds");

  const { data: existingScore, error: scoreError } = await supabase
    .from("scores")
    .select("heat_id")
    .eq("id", scoreId)
    .single();

  if (scoreError || !existingScore) {
    return { error: scoreError?.message ?? "Score no encontrado" };
  }

  const { error } = await supabase
    .from("scores")
    .update({
      time_ms: timeMsRaw ? Number(timeMsRaw) : null,
      reps: repsRaw ? Number(repsRaw) : null,
      weight_kg: weightKgRaw ? Number(weightKgRaw) : null,
      rounds: roundsRaw ? Number(roundsRaw) : null,
      remaining_reps: remainingRepsRaw ? Number(remainingRepsRaw) : null,
      is_rx: formData.get("is_rx") === "true",
      is_cap: formData.get("is_cap") === "true",
      penalty_seconds: penaltySecondsRaw ? Number(penaltySecondsRaw) : 0,
      notes: (formData.get("notes") as string) || null,
      verified_by: null,
      verified_at: null,
      is_published: false,
      points: null,
    })
    .eq("id", scoreId);

  if (error) {
    return { error: error.message };
  }

  revalidateScorePaths(existingScore.heat_id ?? undefined);
  return { success: true };
}

export async function validateHeat(
  heatId: string
): Promise<{ error: string } | { success: true }> {
  const actor = await requireValidationActor();
  if ("error" in actor) {
    return actor;
  }

  const supabase = await createClient();

  const { data: scores, error: scoresError } = await supabase
    .from("scores")
    .select("id")
    .eq("heat_id", heatId);

  if (scoresError) {
    return { error: scoresError.message };
  }

  if (!scores || scores.length === 0) {
    return { error: "No hay scores para validar en este heat" };
  }

  const { error } = await supabase
    .from("scores")
    .update({
      verified_by: actor.user.id,
      verified_at: new Date().toISOString(),
    })
    .eq("heat_id", heatId);

  if (error) {
    return { error: error.message };
  }

  revalidateScorePaths(heatId);
  return { success: true };
}

export async function publishScores(
  heatId: string
): Promise<{ error: string } | { success: true }> {
  const actor = await requireValidationActor();
  if ("error" in actor) {
    return actor;
  }

  const supabase = await createClient();

  const { data: scores, error: scoresError } = await supabase
    .from("scores")
    .select("id, verified_at, verified_by")
    .eq("heat_id", heatId);

  if (scoresError) {
    return { error: scoresError.message };
  }

  if (!scores || scores.length === 0) {
    return { error: "No hay scores para publicar" };
  }

  const hasPendingValidation = scores.some(
    (score) => !score.verified_at || !score.verified_by
  );

  if (hasPendingValidation) {
    return { error: "No puedes publicar un heat sin validar todos sus scores" };
  }

  const { error } = await supabase
    .from("scores")
    .update({ is_published: true })
    .eq("heat_id", heatId);

  if (error) {
    return { error: error.message };
  }

  revalidateScorePaths(heatId);
  return { success: true };
}

export async function unpublishScores(
  heatId: string
): Promise<{ error: string } | { success: true }> {
  const actor = await requireValidationActor();
  if ("error" in actor) {
    return actor;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("scores")
    .update({ is_published: false })
    .eq("heat_id", heatId);

  if (error) {
    return { error: error.message };
  }

  revalidateScorePaths(heatId);
  return { success: true };
}

export async function calculatePoints(
  workoutId: string
): Promise<{ error: string } | { success: true }> {
  const actor = await requireValidationActor();
  if ("error" in actor) {
    return actor;
  }

  const supabase = await createClient();

  // Fetch the workout to know ranking direction
  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("id, score_type, higher_is_better")
    .eq("id", workoutId)
    .single();

  if (workoutError || !workout) {
    return { error: workoutError?.message ?? "Workout no encontrado" };
  }

  // Fetch all published scores for this workout, with the team's category
  const { data: scores, error: scoresError } = await supabase
    .from("scores")
    .select("id, team_id, time_ms, reps, weight_kg, rounds, remaining_reps, is_rx, is_cap, penalty_seconds, team:teams(category_id)")
    .eq("workout_id", workoutId)
    .eq("is_published", true);

  if (scoresError) {
    return { error: scoresError.message };
  }

  if (!scores || scores.length === 0) {
    return { error: "No hay puntuaciones publicadas para este workout" };
  }

  // Group scores by category
  const byCategory = new Map<string, typeof scores>();
  for (const score of scores) {
    const categoryId = (score.team as unknown as { category_id: string } | null)?.category_id;
    if (!categoryId) continue;
    const group = byCategory.get(categoryId) ?? [];
    group.push(score);
    byCategory.set(categoryId, group);
  }

  // Rank within each category and assign points
  const updates: { id: string; points: number }[] = [];

  for (const [, categoryScores] of byCategory) {
    // Sort based on workout type
    const sorted = [...categoryScores].sort((a, b) => {
      // RX always beats scaled
      if (a.is_rx !== b.is_rx) return a.is_rx ? -1 : 1;
      // Non-capped beats capped (for for_time)
      if (a.is_cap !== b.is_cap) return a.is_cap ? 1 : -1;

      if (workout.score_type === "time") {
        // Lower time is better; add penalty
        const timeA = (a.time_ms ?? Infinity) + (a.penalty_seconds ?? 0) * 1000;
        const timeB = (b.time_ms ?? Infinity) + (b.penalty_seconds ?? 0) * 1000;
        return timeA - timeB;
      }

      if (workout.score_type === "weight") {
        // Higher weight is better
        const wA = a.weight_kg ?? 0;
        const wB = b.weight_kg ?? 0;
        return wB - wA;
      }

      if (workout.score_type === "rounds_reps") {
        // Compare rounds first, then remaining reps
        const roundsA = a.rounds ?? 0;
        const roundsB = b.rounds ?? 0;
        if (roundsA !== roundsB) return roundsB - roundsA;
        const remA = a.remaining_reps ?? 0;
        const remB = b.remaining_reps ?? 0;
        return remB - remA;
      }

      // Default (reps, points): use higher_is_better flag
      const repsA = a.reps ?? 0;
      const repsB = b.reps ?? 0;
      return workout.higher_is_better ? repsB - repsA : repsA - repsB;
    });

    const totalTeams = sorted.length;
    sorted.forEach((score, index) => {
      // 1st place gets N points, 2nd gets N-1, etc.
      updates.push({ id: score.id, points: totalTeams - index });
    });
  }

  // Batch update points
  for (const { id, points } of updates) {
    const { error: updateError } = await supabase
      .from("scores")
      .update({ points })
      .eq("id", id);

    if (updateError) {
      return { error: updateError.message };
    }
  }

  revalidateScorePaths();
  return { success: true };
}
