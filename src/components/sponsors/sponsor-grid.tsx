import { cn } from "@/lib/utils";
import type { Sponsor } from "@/types";

interface SponsorGridProps {
  sponsors: (Sponsor & { sponsor_slots?: unknown[] })[];
}

const tierSizes: Record<string, string> = {
  title: "text-2xl md:text-3xl",
  gold: "text-xl md:text-2xl",
  silver: "text-lg md:text-xl",
  bronze: "text-base md:text-lg",
  partner: "text-sm md:text-base",
};

const tierOpacity: Record<string, string> = {
  title: "opacity-100",
  gold: "opacity-90",
  silver: "opacity-75",
  bronze: "opacity-60",
  partner: "opacity-50",
};

export function SponsorGrid({ sponsors }: SponsorGridProps) {
  if (!sponsors || sponsors.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
      {sponsors.map((sponsor) => (
        <a
          key={sponsor.id}
          href={sponsor.website_url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "font-bold tracking-tight text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105",
            tierSizes[sponsor.tier] || tierSizes.partner,
            tierOpacity[sponsor.tier] || tierOpacity.partner
          )}
        >
          {sponsor.name}
        </a>
      ))}
    </div>
  );
}
