import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, Images, ShoppingCart } from "lucide-react";
import { GalleryCard } from "@/components/media/gallery-card";
import { getVisibleMediaById, listVisibleMedia } from "@/lib/media";

type GalleryDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: GalleryDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const mediaItem = await getVisibleMediaById(id);

  if (!mediaItem) {
    return {
      title: "Foto no encontrada",
    };
  }

  return {
    title: mediaItem.title ?? "Foto oficial",
    description:
      mediaItem.caption ??
      "Detalle de foto oficial del evento con opciones de descarga o compra segun disponibilidad.",
  };
}

export default async function GalleryDetailPage({
  params,
}: GalleryDetailPageProps) {
  const { id } = await params;
  const mediaItem = await getVisibleMediaById(id);

  if (!mediaItem) {
    notFound();
  }

  const relatedItems = (await listVisibleMedia(6))
    .filter((item) => item.id !== mediaItem.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen">
      <section className="px-4 py-10 sm:py-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="overflow-hidden rounded-[2rem] bg-white/[0.03] ring-1 ring-white/7">
            {mediaItem.preview_url ? (
              <div className="relative aspect-[4/3]">
                <Image
                src={mediaItem.preview_url}
                alt={mediaItem.alt_text ?? mediaItem.title ?? "Imagen de la galeria oficial"}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center bg-white/[0.03] text-muted-foreground">
                Imagen no disponible
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-brand-green/74">
                  Galeria oficial
                </p>
                {mediaItem.album ? (
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                    {mediaItem.album}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
                {mediaItem.title ?? "Foto oficial del evento"}
              </h1>
              {mediaItem.caption ? (
                <p className="mt-5 text-base leading-8 text-muted-foreground">
                  {mediaItem.caption}
                </p>
              ) : null}
            </div>

            <div className="rounded-[1.6rem] bg-white/[0.03] p-5 ring-1 ring-white/7">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
                Acciones disponibles
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {mediaItem.download_href ? (
                  <a
                    href={mediaItem.download_href}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"
                  >
                    <Download size={16} />
                    Descargar imagen
                  </a>
                ) : null}
                {mediaItem.purchase_url ? (
                  <a
                    href={mediaItem.purchase_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-5 py-3 text-sm font-medium text-brand-green"
                  >
                    <ShoppingCart size={16} />
                    Comprar desde la web
                  </a>
                ) : null}
                {!mediaItem.download_href && !mediaItem.purchase_url ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    Esta imagen esta visible para consulta, pero la organizacion
                    todavia no ha activado descarga ni compra.
                  </p>
                ) : null}
              </div>

              {mediaItem.price_label ? (
                <p className="mt-4 text-sm font-medium text-white">
                  {mediaItem.price_label}
                </p>
              ) : null}
            </div>

            <div className="rounded-[1.6rem] bg-white/[0.03] p-5 ring-1 ring-white/7">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
                Sigue explorando
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/galeria"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/18 px-4 py-2 text-sm font-medium text-white"
                >
                  <Images size={15} />
                  Volver a galeria
                </Link>
                <Link
                  href="/directo"
                  className="inline-flex items-center rounded-full border border-white/10 bg-black/18 px-4 py-2 text-sm font-medium text-white"
                >
                  Ver directo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedItems.length > 0 ? (
        <section className="px-4 pb-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-5 max-w-2xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Mas momentos
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                Otras fotos para seguir viviendo el evento.
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {relatedItems.map((item) => (
                <GalleryCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
