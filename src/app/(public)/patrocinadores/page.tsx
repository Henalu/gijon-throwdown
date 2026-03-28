import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Patrocinadores",
  description: "Partners y patrocinadores que impulsan Gijon Throwdown",
};

const tierLabels: Record<string, string> = {
  title: "Title Sponsor",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
  partner: "Partner",
};

const tierColors: Record<string, string> = {
  title: "border-brand-green text-brand-green",
  gold: "border-yellow-500 text-yellow-500",
  silver: "border-gray-400 text-gray-400",
  bronze: "border-orange-600 text-orange-600",
  partner: "border-muted-foreground text-muted-foreground",
};

export default async function PatrocinadoresPage() {
  const supabase = await createClient();

  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="min-h-screen">
      <section className="relative py-12 sm:py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a12] to-background" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter text-foreground">
            Patrocinadores
          </h1>
          <p className="text-muted-foreground text-lg mt-4">
            Marcas, colaboradores y partners que hacen posible el evento.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          {sponsors && sponsors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sponsors.map((sponsor) => (
                <a
                  key={sponsor.id}
                  href={sponsor.website_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-6 rounded-xl bg-card border border-border hover:border-brand-green/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-foreground">
                      {sponsor.name}
                    </h3>
                    <ExternalLink
                      size={16}
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <Badge
                    variant="outline"
                    className={tierColors[sponsor.tier] || tierColors.partner}
                  >
                    {tierLabels[sponsor.tier] || sponsor.tier}
                  </Badge>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-20">
              La informacion de partners y patrocinadores se publicara muy pronto.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
