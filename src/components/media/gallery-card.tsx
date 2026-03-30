import Image from "next/image";
import Link from "next/link";
import { Download, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryCardItem {
  id: string;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  album: string | null;
  preview_url: string | null;
  price_label: string | null;
  purchase_url: string | null;
  download_href: string | null;
  is_featured?: boolean;
}

export function GalleryCard({
  item,
  className,
}: {
  item: GalleryCardItem;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[1.75rem] bg-white/[0.03] ring-1 ring-white/7 transition-colors hover:bg-white/[0.05]",
        className,
      )}
    >
      <Link href={`/galeria/${item.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-white/[0.03]">
          {item.preview_url ? (
            <Image
              src={item.preview_url}
              alt={item.alt_text ?? item.title ?? "Imagen de la galeria oficial"}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Imagen pendiente
            </div>
          )}
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-medium tracking-[-0.04em] text-white">
              {item.title ?? "Galeria oficial"}
            </p>
            {item.is_featured ? (
              <span className="rounded-full bg-brand-green/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-brand-green">
                Destacada
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {item.album ? <span>{item.album}</span> : null}
            {item.price_label ? <span>{item.price_label}</span> : null}
          </div>
        </div>

        {item.caption ? (
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {item.caption}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/galeria/${item.id}`}
            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
          >
            Ver foto
          </Link>
          {item.download_href ? (
            <a
              href={item.download_href}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/18 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black/30"
            >
              <Download size={14} />
              Descargar
            </a>
          ) : null}
          {item.purchase_url ? (
            <a
              href={item.purchase_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/10 px-4 py-2 text-sm font-medium text-brand-green transition-colors hover:bg-brand-green/14"
            >
              <ShoppingCart size={14} />
              Comprar
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
