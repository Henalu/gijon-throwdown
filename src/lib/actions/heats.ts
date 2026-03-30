"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createHeat(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
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

  revalidatePath("/admin/heats");
  return { success: true };
}

export async function updateHeatStatus(
  id: string,
  status: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const updates: Record<string, string | null> = { status };

  if (status === "active") {
    updates.started_at = new Date().toISOString();
  } else if (status === "finished") {
    updates.finished_at = new Date().toISOString();
  }

  const { error } = await supabase.from("heats").update(updates).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/heats");
  revalidatePath("/voluntario");
  return { success: true };
}

export async function updateHeatLiveEntry(
  id: string,
  isLiveEntryEnabled: boolean,
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("heats")
    .update({ is_live_entry_enabled: isLiveEntryEnabled })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/heats");
  revalidatePath("/voluntario");
  return { success: true };
}

export async function deleteHeat(
  id: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const { error } = await supabase.from("heats").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/heats");
  revalidatePath("/voluntario");
  return { success: true };
}

export async function assignLane(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const { error } = await supabase.from("lanes").insert({
    heat_id: formData.get("heat_id") as string,
    team_id: formData.get("team_id") as string,
    lane_number: Number(formData.get("lane_number")),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/heats");
  revalidatePath("/voluntario");
  return { success: true };
}

export async function removeLane(
  id: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const { error } = await supabase.from("lanes").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/heats");
  return { success: true };
}
