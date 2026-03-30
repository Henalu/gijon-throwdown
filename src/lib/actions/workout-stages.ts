"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminLikeRole } from "@/lib/auth/permissions";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const workoutStageSchema = z.object({
  workoutId: z.string().uuid("Selecciona un WOD valido"),
  name: z.string().trim().min(2, "Necesitamos un nombre para el stage"),
  description: z.string().trim().max(800).optional(),
  targetValue: z.coerce.number().nullable().optional(),
  unit: z.string().trim().min(1, "La unidad es obligatoria"),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

async function requireAdminActor() {
  const session = await getCurrentSessionProfile();

  if (!session.user || !session.profile) {
    return { ok: false as const, error: "Necesitas iniciar sesion" };
  }

  if (!session.profile.is_active || !isAdminLikeRole(session.profile.role)) {
    return {
      ok: false as const,
      error: "No tienes permisos para gestionar stages",
    };
  }

  return { ok: true as const, user: session.user, profile: session.profile };
}

function revalidateStageSurfaces() {
  revalidatePath("/admin/wods");
  revalidatePath("/wods");
}

function normalizeDescription(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeTargetValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function createWorkoutStage(input: {
  workoutId: string;
  name: string;
  description?: string;
  targetValue?: number | null;
  unit: string;
  sortOrder?: number;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  const parsed = workoutStageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos del stage",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("workout_stages").insert({
    workout_id: parsed.data.workoutId,
    name: parsed.data.name.trim(),
    description: normalizeDescription(parsed.data.description),
    target_value: normalizeTargetValue(parsed.data.targetValue),
    unit: parsed.data.unit.trim(),
    sort_order: parsed.data.sortOrder,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateStageSurfaces();
  return { success: true };
}

export async function updateWorkoutStage(input: {
  id: string;
  workoutId: string;
  name: string;
  description?: string;
  targetValue?: number | null;
  unit: string;
  sortOrder?: number;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  if (!input.id?.trim()) {
    return { error: "Stage no valido" };
  }

  const parsed = workoutStageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos del stage",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_stages")
    .update({
      workout_id: parsed.data.workoutId,
      name: parsed.data.name.trim(),
      description: normalizeDescription(parsed.data.description),
      target_value: normalizeTargetValue(parsed.data.targetValue),
      unit: parsed.data.unit.trim(),
      sort_order: parsed.data.sortOrder,
    })
    .eq("id", input.id);

  if (error) {
    return { error: error.message };
  }

  revalidateStageSurfaces();
  return { success: true };
}

export async function deleteWorkoutStage(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  if (!id?.trim()) {
    return { error: "Stage no valido" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("workout_stages").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidateStageSurfaces();
  return { success: true };
}
