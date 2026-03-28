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

export async function createCategory(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const name = formData.get("name") as string;

  const { error } = await supabase.from("categories").insert({
    name,
    slug: generateSlug(name),
    description: (formData.get("description") as string) || null,
    is_team: formData.get("is_team") === "true",
    team_size: Number(formData.get("team_size")) || 1,
    max_teams: formData.get("max_teams")
      ? Number(formData.get("max_teams"))
      : null,
    sort_order: Number(formData.get("sort_order")) || 0,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/categorias");
  return { success: true };
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const name = formData.get("name") as string;

  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug: generateSlug(name),
      description: (formData.get("description") as string) || null,
      is_team: formData.get("is_team") === "true",
      team_size: Number(formData.get("team_size")) || 1,
      max_teams: formData.get("max_teams")
        ? Number(formData.get("max_teams"))
        : null,
      sort_order: Number(formData.get("sort_order")) || 0,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/categorias");
  return { success: true };
}

export async function deleteCategory(
  id: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/categorias");
  return { success: true };
}
