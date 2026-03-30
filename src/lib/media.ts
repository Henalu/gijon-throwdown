import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Media } from "@/types";

export const MEDIA_BUCKET = "event-media";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export interface ResolvedMediaItem extends Media {
  preview_url: string | null;
  download_href: string | null;
}

function getBucketForMedia(media: Media) {
  return media.storage_bucket || MEDIA_BUCKET;
}

function getFallbackMediaUrl(media: Media) {
  if (media.thumbnail_url?.trim()) return media.thumbnail_url;
  if (media.url?.trim()) return media.url;
  return null;
}

async function getSignedPreviewUrl(media: Media) {
  if (!media.storage_path) {
    return getFallbackMediaUrl(media);
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.storage
    .from(getBucketForMedia(media))
    .createSignedUrl(media.storage_path, SIGNED_URL_TTL_SECONDS);

  if (error) {
    return getFallbackMediaUrl(media);
  }

  return data.signedUrl;
}

function withResolvedUrl(media: Media, previewUrl: string | null): ResolvedMediaItem {
  return {
    ...media,
    preview_url: previewUrl,
    download_href: media.download_enabled ? `/api/media/${media.id}/download` : null,
  };
}

export async function resolveMediaItem(media: Media): Promise<ResolvedMediaItem> {
  const previewUrl = await getSignedPreviewUrl(media);
  return withResolvedUrl(media, previewUrl);
}

export async function listVisibleMedia(limit?: number): Promise<ResolvedMediaItem[]> {
  const adminClient = createAdminClient();
  let query = adminClient
    .from("media")
    .select("*")
    .eq("is_visible", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return Promise.all((data as Media[]).map(resolveMediaItem));
}

export async function listAdminMedia(): Promise<ResolvedMediaItem[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("media")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return Promise.all((data as Media[]).map(resolveMediaItem));
}

export async function getVisibleMediaById(id: string): Promise<ResolvedMediaItem | null> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("media")
    .select("*")
    .eq("id", id)
    .eq("is_visible", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return resolveMediaItem(data as Media);
}

export function buildMediaDownloadFilename(media: Pick<Media, "title" | "storage_path">) {
  const extension = media.storage_path?.split(".").pop()?.toLowerCase() || "jpg";
  const baseName = (media.title || "gijon-throwdown-media")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName || "gijon-throwdown-media"}.${extension}`;
}
