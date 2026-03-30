"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdminLikeRole } from "@/lib/auth/permissions";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const assignmentSchema = z.object({
  volunteerId: z.string().uuid("Selecciona un voluntario valido"),
  heatId: z.string().uuid("Selecciona un heat valido"),
  laneId: z.string().uuid("La calle no es valida").optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional(),
});

async function requireAdminActor() {
  const session = await getCurrentSessionProfile();

  if (!session.user || !session.profile) {
    return { ok: false as const, error: "Necesitas iniciar sesion" };
  }

  if (!session.profile.is_active || !isAdminLikeRole(session.profile.role)) {
    return {
      ok: false as const,
      error: "No tienes permisos para gestionar asignaciones",
    };
  }

  return { ok: true as const, user: session.user, profile: session.profile };
}

function normalizeOptional(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function revalidateAssignmentSurfaces(heatId?: string) {
  revalidatePath("/admin/voluntarios");
  revalidatePath("/voluntario");
  if (heatId) {
    revalidatePath(`/voluntario/heat/${heatId}`);
  }
}

export async function createVolunteerAssignment(input: {
  volunteerId: string;
  heatId: string;
  laneId?: string;
  notes?: string;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Revisa los datos de la asignacion",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("volunteer_assignments").insert({
    volunteer_id: parsed.data.volunteerId,
    heat_id: parsed.data.heatId,
    lane_id: normalizeOptional(parsed.data.laneId),
    notes: normalizeOptional(parsed.data.notes),
  });

  if (error) {
    return { error: error.message };
  }

  revalidateAssignmentSurfaces(parsed.data.heatId);
  return { success: true };
}

export async function updateVolunteerAssignment(input: {
  id: string;
  volunteerId: string;
  heatId: string;
  laneId?: string;
  notes?: string;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  if (!input.id?.trim()) {
    return { error: "Asignacion no valida" };
  }

  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Revisa los datos de la asignacion",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("volunteer_assignments")
    .update({
      volunteer_id: parsed.data.volunteerId,
      heat_id: parsed.data.heatId,
      lane_id: normalizeOptional(parsed.data.laneId),
      notes: normalizeOptional(parsed.data.notes),
    })
    .eq("id", input.id);

  if (error) {
    return { error: error.message };
  }

  revalidateAssignmentSurfaces(parsed.data.heatId);
  return { success: true };
}

export async function deleteVolunteerAssignment(input: {
  id: string;
  heatId?: string;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  if (!input.id?.trim()) {
    return { error: "Asignacion no valida" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("volunteer_assignments")
    .delete()
    .eq("id", input.id);

  if (error) {
    return { error: error.message };
  }

  revalidateAssignmentSurfaces(input.heatId);
  return { success: true };
}
