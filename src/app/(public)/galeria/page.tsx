import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { Download, Images, ShoppingCart } from "lucide-react";
import { GalleryCard } from "@/components/media/gallery-card";
import { listVisibleMedia } from "@/lib/media";

export const metadata: Metadata = {
  title: "Galeria",
  description:
    "Fotos oficiales del evento para revivir el esfuerzo, descargar momentos y acceder a compra cuando este disponible.",
};

export default async function GaleriaPage() {
  const mediaItems = await listVisibleMedia();
  const featuredItem = mediaItems.find((item) => item.is_featured) ?? mediaItems[0] ?? null;
  const remainingItems = featuredItem
    ? mediaItems.filter((item) => item.id !== featuredItem.id)
    : mediaItems;

  return (
    <div className="min-h-screen">
      <section className="border-b border-white/6 px-4 py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-brand-green/76">
              Galeria oficial
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl">
              Esfuerzo, equipo y momentos para volver a sentir la arena.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              Aqui vive la capa visual del evento: fotos para seguir el ambiente,
              descargar recuerdos y activar compras cuando la organizacion o el
              fotografo las deje publicadas.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white">
                <Images size={15} />
                {mediaItems.length} imagenes publicadas
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white">
                <Download size={15} />
                Descarga segun disponibilidad
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white">
                <ShoppingCart size={15} />
                Compra configurable por foto
              </span>
            </div>
          </div>

          {featuredItem ? (
            <div className="overflow-hidden rounded-[2rem] bg-white/[0.03] ring-1 ring-white/7">
              <div className="relative aspect-[16/10] bg-white/[0.03]">
                {featuredItem.preview_url ? (
                  <Image
                    src={featuredItem.preview_url}
                    alt={
                      featuredItem.alt_text ??
                      featuredItem.title ??
                      "Imagen destacada de la galeria oficial"
                    }
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="space-y-3 px-5 py-5">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-brand-green/74">
                  Imagen destacada
                </p>
                <p className="text-2xl font-medium tracking-[-0.04em] text-white">
                  {featuredItem.title ?? "Momentos del evento"}
                </p>
                {featuredItem.caption ? (
                  <p className="text-sm leading-6 text-muted-foreground">
                    {featuredItem.caption}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/galeria/${featuredItem.id}`}
                    className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
                  >
                    Ver detalle
                  </Link>
                  {featuredItem.purchase_url ? (
                    <a
                      href={featuredItem.purchase_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full border border-brand-green/20 bg-brand-green/10 px-4 py-2 text-sm font-medium text-brand-green"
                    >
                      Comprar
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[2rem] bg-white/[0.03] p-8 ring-1 ring-white/7">
              <p className="text-lg font-medium text-white">La galeria se esta preparando.</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                En cuanto el equipo empiece a subir imagenes del evento, apareceran aqui.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl">
          {remainingItems.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {remainingItems.map((item) => (
                <GalleryCard key={item.id} item={item} />
              ))}
            </div>
          ) : !featuredItem ? (
            <div className="rounded-[1.8rem] bg-white/[0.03] px-5 py-10 text-center ring-1 ring-white/7">
              <p className="text-xl font-medium text-white">
                Todavia no hay fotos publicadas
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                La organizacion podra subirlas desde el panel de media y activar
                descarga o compra por imagen cuando lo necesite.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
