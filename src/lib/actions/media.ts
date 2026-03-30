"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import { isAdminLikeRole } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { MEDIA_BUCKET } from "@/lib/media";

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ACCEPTED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const mediaMutationSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2, "El titulo es obligatorio"),
  caption: z.string().trim().max(1500).optional(),
  altText: z.string().trim().max(300).optional(),
  album: z.string().trim().max(120).optional(),
  priceLabel: z.string().trim().max(80).optional(),
  purchaseUrl: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^https?:\/\//.test(value), "La URL de compra no es valida"),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isVisible: z.boolean(),
  isFeatured: z.boolean(),
  downloadEnabled: z.boolean(),
});

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function requireAdminMediaActor() {
  const session = await getCurrentSessionProfile();

  if (!session.user || !session.profile) {
    return { ok: false as const, error: "Necesitas iniciar sesion" };
  }

  if (!session.profile.is_active || !isAdminLikeRole(session.profile.role)) {
    return {
      ok: false as const,
      error: "No tienes permisos para gestionar la galeria",
    };
  }

  return {
    ok: true as const,
    user: session.user,
    profile: session.profile,
  };
}

function sanitizeFileSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function revalidateMediaSurfaces(id?: string) {
  revalidatePath("/admin/media");
  revalidatePath("/galeria");
  revalidatePath("/");
  if (id) {
    revalidatePath(`/galeria/${id}`);
  }
}

function parseCheckboxValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  return "jpg";
}

export async function uploadMediaAsset(
  formData: FormData,
): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminMediaActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File) || fileEntry.size === 0) {
    return { error: "Selecciona una imagen para subirla a la galeria" };
  }

  if (!ACCEPTED_MEDIA_TYPES.includes(fileEntry.type)) {
    return { error: "La galeria solo acepta imagenes JPG, PNG, WEBP o AVIF" };
  }

  if (fileEntry.size > MAX_UPLOAD_BYTES) {
    return { error: "Cada imagen debe pesar menos de 15 MB" };
  }

  const parsed = mediaMutationSchema.safeParse({
    title: formData.get("title"),
    caption: formData.get("caption"),
    altText: formData.get("altText"),
    album: formData.get("album"),
    priceLabel: formData.get("priceLabel"),
    purchaseUrl: formData.get("purchaseUrl"),
    sortOrder: Number(formData.get("sortOrder") || 0),
    isVisible: parseCheckboxValue(formData.get("isVisible")),
    isFeatured: parseCheckboxValue(formData.get("isFeatured")),
    downloadEnabled: parseCheckboxValue(formData.get("downloadEnabled")),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Revisa los datos de la imagen",
    };
  }

  const adminClient = createAdminClient();
  const timestamp = new Date();
  const extension = getFileExtension(fileEntry);
  const baseName = sanitizeFileSegment(parsed.data.title);
  const filePath = `${timestamp.getUTCFullYear()}/${String(
    timestamp.getUTCMonth() + 1,
  ).padStart(2, "0")}/${crypto.randomUUID()}-${baseName || "foto"}.${extension}`;

  const { error: uploadError } = await adminClient.storage
    .from(MEDIA_BUCKET)
    .upload(filePath, fileEntry, {
      cacheControl: "3600",
      contentType: fileEntry.type,
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const now = new Date().toISOString();
  const { error: insertError } = await adminClient.from("media").insert({
    url: `${MEDIA_BUCKET}/${filePath}`,
    media_type: "image",
    title: parsed.data.title.trim(),
    caption: normalizeOptionalText(parsed.data.caption),
    alt_text: normalizeOptionalText(parsed.data.altText) ?? parsed.data.title.trim(),
    album: normalizeOptionalText(parsed.data.album),
    storage_bucket: MEDIA_BUCKET,
    storage_path: filePath,
    price_label: normalizeOptionalText(parsed.data.priceLabel),
    purchase_url: normalizeOptionalText(parsed.data.purchaseUrl),
    sort_order: parsed.data.sortOrder,
    is_visible: parsed.data.isVisible,
    is_featured: parsed.data.isFeatured,
    download_enabled: parsed.data.downloadEnabled,
    uploaded_by: actor.user.id,
    created_at: now,
    updated_at: now,
  });

  if (insertError) {
    await adminClient.storage.from(MEDIA_BUCKET).remove([filePath]);
    return { error: insertError.message };
  }

  revalidateMediaSurfaces();
  return { success: true };
}

export async function updateMediaAsset(input: {
  id: string;
  title: string;
  caption?: string;
  altText?: string;
  album?: string;
  priceLabel?: string;
  purchaseUrl?: string;
  sortOrder?: number;
  isVisible: boolean;
  isFeatured: boolean;
  downloadEnabled: boolean;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminMediaActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  const parsed = mediaMutationSchema.safeParse({
    ...input,
    sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Revisa los datos del elemento multimedia",
    };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from("media")
    .update({
      title: parsed.data.title.trim(),
      caption: normalizeOptionalText(parsed.data.caption),
      alt_text: normalizeOptionalText(parsed.data.altText) ?? parsed.data.title.trim(),
      album: normalizeOptionalText(parsed.data.album),
      price_label: normalizeOptionalText(parsed.data.priceLabel),
      purchase_url: normalizeOptionalText(parsed.data.purchaseUrl),
      sort_order: parsed.data.sortOrder,
      is_visible: parsed.data.isVisible,
      is_featured: parsed.data.isFeatured,
      download_enabled: parsed.data.downloadEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) {
    return { error: error.message };
  }

  revalidateMediaSurfaces(input.id);
  return { success: true };
}

export async function deleteMediaAsset(input: {
  id: string;
}): Promise<{ error: string } | { success: true }> {
  const actor = await requireAdminMediaActor();
  if (!actor.ok) {
    return { error: actor.error };
  }

  if (!input.id?.trim()) {
    return { error: "Elemento multimedia no valido" };
  }

  const adminClient = createAdminClient();
  const { data: existingMedia, error: lookupError } = await adminClient
    .from("media")
    .select("id, storage_bucket, storage_path")
    .eq("id", input.id)
    .maybeSingle();

  if (lookupError) {
    return { error: lookupError.message };
  }

  const { error } = await adminClient.from("media").delete().eq("id", input.id);
  if (error) {
    return { error: error.message };
  }

  if (existingMedia?.storage_path) {
    await adminClient.storage
      .from(existingMedia.storage_bucket || MEDIA_BUCKET)
      .remove([existingMedia.storage_path]);
  }

  revalidateMediaSurfaces(input.id);
  return { success: true };
}
