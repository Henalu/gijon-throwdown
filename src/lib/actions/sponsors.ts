"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSponsor(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const { error } = await supabase.from("sponsors").insert({
    name: formData.get("name") as string,
    logo_url: formData.get("logo_url") as string,
    website_url: (formData.get("website_url") as string) || null,
    tier: formData.get("tier") as string,
    is_active: formData.get("is_active") === "true",
    sort_order: Number(formData.get("sort_order")) || 0,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/patrocinadores");
  return { success: true };
}

export async function updateSponsor(
  id: string,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sponsors")
    .update({
      name: formData.get("name") as string,
      logo_url: formData.get("logo_url") as string,
      website_url: (formData.get("website_url") as string) || null,
      tier: formData.get("tier") as string,
      is_active: formData.get("is_active") === "true",
      sort_order: Number(formData.get("sort_order")) || 0,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/patrocinadores");
  return { success: true };
}

export async function deleteSponsor(
  id: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const { error } = await supabase.from("sponsors").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/patrocinadores");
  return { success: true };
}
