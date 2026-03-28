"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createWorkout(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const name = formData.get("name") as string;

  const { error } = await supabase.from("workouts").insert({
    name,
    slug: generateSlug(name),
    wod_type: formData.get("wod_type") as string,
    score_type: formData.get("score_type") as string,
    time_cap_seconds: formData.get("time_cap_seconds")
      ? Number(formData.get("time_cap_seconds"))
      : null,
    description: (formData.get("description") as string) || null,
    standards: (formData.get("standards") as string) || null,
    is_visible: formData.get("is_visible") === "true",
    higher_is_better: formData.get("higher_is_better") === "true",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/wods");
  return { success: true };
}

export async function updateWorkout(
  id: string,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const name = formData.get("name") as string;

  const { error } = await supabase
    .from("workouts")
    .update({
      name,
      slug: generateSlug(name),
      wod_type: formData.get("wod_type") as string,
      score_type: formData.get("score_type") as string,
      time_cap_seconds: formData.get("time_cap_seconds")
        ? Number(formData.get("time_cap_seconds"))
        : null,
      description: (formData.get("description") as string) || null,
      standards: (formData.get("standards") as string) || null,
      is_visible: formData.get("is_visible") === "true",
      higher_is_better: formData.get("higher_is_better") === "true",
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/wods");
  return { success: true };
}

export async function deleteWorkout(
  id: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const { error } = await supabase.from("workouts").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/wods");
  return { success: true };
}

export async function toggleWorkoutVisibility(
  id: string,
  isVisible: boolean
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("workouts")
    .update({ is_visible: isVisible })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/wods");
  return { success: true };
}
