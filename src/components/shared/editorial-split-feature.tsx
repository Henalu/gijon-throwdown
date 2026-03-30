import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type EditorialSplitFeatureProps = {
  imageSrc: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  description: string;
  highlights?: string[];
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  reverse?: boolean;
  imageClassName?: string;
  className?: string;
};

export function EditorialSplitFeature({
  imageSrc,
  imageAlt,
  eyebrow,
  title,
  description,
  highlights = [],
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  reverse = false,
  imageClassName,
  className,
}: EditorialSplitFeatureProps) {
  return (
    <section className={cn("px-4 py-10 sm:py-12", className)}>
      <div
        className={cn(
          "mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch",
          reverse && "lg:grid-cols-[0.98fr_1.02fr]",
        )}
      >
        <div
          className={cn(
            "relative min-h-[20rem] overflow-hidden rounded-[2rem] ring-1 ring-white/8",
            reverse && "lg:order-2",
          )}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            quality={84}
            sizes="(max-width: 1024px) 100vw, 52vw"
            className={cn("object-cover object-center", imageClassName)}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,9,0.14),rgba(8,10,9,0.58)),radial-gradient(circle_at_top_left,_rgba(255,255,255,0.06),_transparent_34%)]" />
        </div>

        <div
          className={cn(
            "flex flex-col justify-between rounded-[2rem] bg-white/[0.03] p-6 ring-1 ring-white/7 sm:p-8",
            reverse && "lg:order-1",
          )}
        >
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
              {eyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              {title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {description}
            </p>

            {highlights.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-white/82"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {(primaryHref && primaryLabel) || (secondaryHref && secondaryLabel) ? (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryHref && primaryLabel ? (
                <Link
                  href={primaryHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                >
                  {primaryLabel}
                  <ArrowRight size={16} />
                </Link>
              ) : null}
              {secondaryHref && secondaryLabel ? (
                <Link
                  href={secondaryHref}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-black/18 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-black/28"
                >
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
