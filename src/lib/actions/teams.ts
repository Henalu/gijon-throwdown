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

export async function createTeam(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const name = formData.get("name") as string;

  const { error } = await supabase.from("teams").insert({
    category_id: formData.get("category_id") as string,
    name,
    slug: generateSlug(name),
    box_name: (formData.get("box_name") as string) || null,
    city: (formData.get("city") as string) || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/equipos");
  return { success: true };
}

export async function updateTeam(
  id: string,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const name = formData.get("name") as string;

  const { error } = await supabase
    .from("teams")
    .update({
      category_id: formData.get("category_id") as string,
      name,
      slug: generateSlug(name),
      box_name: (formData.get("box_name") as string) || null,
      city: (formData.get("city") as string) || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/equipos");
  return { success: true };
}

export async function deleteTeam(
  id: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const { error } = await supabase.from("teams").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/equipos");
  return { success: true };
}
