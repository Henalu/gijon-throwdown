import { NextResponse } from "next/server";
import { buildMediaDownloadFilename, MEDIA_BUCKET } from "@/lib/media";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type DownloadRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: DownloadRouteContext,
) {
  const { id } = await context.params;
  const adminClient = createAdminClient();

  const { data: mediaItem, error } = await adminClient
    .from("media")
    .select(
      "id, title, storage_bucket, storage_path, is_visible, download_enabled",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (
    !mediaItem ||
    !mediaItem.is_visible ||
    !mediaItem.download_enabled ||
    !mediaItem.storage_path
  ) {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 404 });
  }

  const filename = buildMediaDownloadFilename({
    title: mediaItem.title,
    storage_path: mediaItem.storage_path,
  });

  const { data: signedUrl, error: signedUrlError } = await adminClient.storage
    .from(mediaItem.storage_bucket || MEDIA_BUCKET)
    .createSignedUrl(mediaItem.storage_path, 60, {
      download: filename,
    });

  if (signedUrlError) {
    return NextResponse.json({ error: signedUrlError.message }, { status: 500 });
  }

  return NextResponse.redirect(signedUrl.signedUrl);
}
