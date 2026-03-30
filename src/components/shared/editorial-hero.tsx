import Image from "next/image";
import { cn } from "@/lib/utils";

type EditorialHeroProps = {
  imageSrc: string;
  imageAlt: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  imageClassName?: string;
  overlayClassName?: string;
  preload?: boolean;
};

export function EditorialHero({
  imageSrc,
  imageAlt,
  children,
  className,
  contentClassName,
  imageClassName,
  overlayClassName,
  preload = false,
}: EditorialHeroProps) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden border-b border-white/6",
        className
      )}
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        preload={preload}
        quality={82}
        sizes="100vw"
        className={cn("object-cover object-center", imageClassName)}
      />
      <div className="absolute inset-0 bg-black/28" />
      <div
        className={cn(
          "absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,9,0.38)_0%,rgba(8,11,9,0.58)_42%,rgba(8,11,9,0.88)_100%),linear-gradient(90deg,rgba(8,11,9,0.94)_0%,rgba(8,11,9,0.74)_42%,rgba(8,11,9,0.46)_100%),radial-gradient(circle_at_top_left,_rgba(120,199,167,0.18),_transparent_36%),radial-gradient(circle_at_78%_16%,_rgba(126,207,209,0.10),_transparent_28%)]",
          overlayClassName
        )}
      />
      <div
        className={cn(
          "relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:pb-14 sm:pt-14",
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
