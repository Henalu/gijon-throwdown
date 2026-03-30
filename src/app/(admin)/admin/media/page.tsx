import { listAdminMedia } from "@/lib/media";
import { MediaClient } from "./media-client";

export default async function MediaPage() {
  const mediaItems = await listAdminMedia();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Media</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube galerias, controla visibilidad, descarga y compra, y deja lista
          la biblioteca publica del evento.
        </p>
      </div>

      <MediaClient mediaItems={mediaItems} />
    </div>
  );
}
