"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateEvent(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const id = formData.get("id") as string;

  const updates = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    date: formData.get("date") as string,
    end_date: (formData.get("end_date") as string) || null,
    location: (formData.get("location") as string) || null,
    venue_name: (formData.get("venue_name") as string) || null,
    venue_address: (formData.get("venue_address") as string) || null,
    maps_url: (formData.get("maps_url") as string) || null,
    primary_color: (formData.get("primary_color") as string) || "#3BD4A0",
    secondary_color: (formData.get("secondary_color") as string) || "#000000",
    stream_url: (formData.get("stream_url") as string) || null,
    rules_url: (formData.get("rules_url") as string) || null,
    status: formData.get("status") as string,
  };

  const { error } = await supabase
    .from("event_config")
    .update(updates)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/evento");
  revalidatePath("/");
  return { success: true };
}
