"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import { isAdminLikeRole } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const streamSessionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "Necesitamos un titulo para la sesion"),
  description: z.string().trim().max(1000).optional(),
  youtubeUrl: z
    .string()
    .trim()
    .min(1, "La URL de YouTube es obligatoria")
    .url("Introduce una URL valida"),
  isLive: z.boolean(),
  isPublic: z.boolean(),
  startedAt: z.string().trim().optional(),
  endedAt: z.string().trim().optional(),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

async function requireAdminStreamingActor() {
  const session = await getCurrentSessionProfile();

  if (!session.user || !session.profile) {
    return { ok: false as const, error: "Necesitas iniciar sesion" };
  }

  if (!session.profile.is_active || !isAdminLikeRole(session.profile.role)) {
    return {
      ok: false as const,
      error: "No tienes permisos para gestionar streaming",
    };
  }

  return {
    ok: true as const,
    user: session.user,
    profile: session.profile,
  };
}

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalDateTime(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return new Date(trimmed).toISOString();
}

function revalidateStreamingSurfaces() {
  revalidatePath("/admin/streaming");
  revalidatePath("/directo");
  revalidatePath("/");
}

export async function updateFallbackStreamUrl(input: {
  eventId: string;
  streamUrl: string;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminStreamingActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  if (!input.eventId?.trim()) {
    return { error: "No se encontro el evento a actualizar" };
  }

  const streamUrl = input.streamUrl.trim();

  if (streamUrl.length > 0) {
    const parsed = z.string().url("Introduce una URL valida").safeParse(streamUrl);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "URL de stream invalida" };
    }
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("event_config")
    .update({
      stream_url: streamUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.eventId);

  if (error) {
    return { error: error.message };
  }

  revalidateStreamingSurfaces();
  return { success: true };
}

export async function saveStreamSession(input: {
  id?: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  isLive: boolean;
  isPublic: boolean;
  startedAt?: string;
  endedAt?: string;
  sortOrder?: number;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminStreamingActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  const parsed = streamSessionSchema.safeParse({
    ...input,
    sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Revisa los datos de la sesion de streaming",
    };
  }

  const adminClient = createAdminClient();
  const now = new Date().toISOString();
  const payload = {
    title: parsed.data.title.trim(),
    description: normalizeOptionalText(parsed.data.description),
    youtube_url: parsed.data.youtubeUrl.trim(),
    is_live: parsed.data.isLive,
    is_public: parsed.data.isPublic,
    started_at: normalizeOptionalDateTime(parsed.data.startedAt),
    ended_at: normalizeOptionalDateTime(parsed.data.endedAt),
    sort_order: parsed.data.sortOrder,
    updated_at: now,
  };

  if (parsed.data.isLive) {
    const clearLiveQuery = adminClient
      .from("stream_sessions")
      .update({
        is_live: false,
        updated_at: now,
      });

    if (parsed.data.id) {
      const { error } = await clearLiveQuery.neq("id", parsed.data.id);
      if (error) {
        return { error: error.message };
      }
    } else {
      const { error } = await clearLiveQuery.eq("is_live", true);
      if (error) {
        return { error: error.message };
      }
    }
  }

  const query = parsed.data.id
    ? adminClient.from("stream_sessions").update(payload).eq("id", parsed.data.id)
    : adminClient.from("stream_sessions").insert({
        ...payload,
        created_at: now,
      });

  const { error } = await query;

  if (error) {
    return { error: error.message };
  }

  revalidateStreamingSurfaces();
  return { success: true };
}

export async function deleteStreamSession(input: {
  id: string;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminStreamingActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  if (!input.id?.trim()) {
    return { error: "Sesion no valida" };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("stream_sessions")
    .delete()
    .eq("id", input.id);

  if (error) {
    return { error: error.message };
  }

  revalidateStreamingSurfaces();
  return { success: true };
}
