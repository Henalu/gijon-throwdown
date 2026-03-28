import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WODs",
  description: "Los entrenamientos de la competicion",
};

const wodTypeLabels: Record<string, string> = {
  for_time: "For Time",
  amrap: "AMRAP",
  emom: "EMOM",
  max_weight: "Max Weight",
  chipper: "Chipper",
  custom: "Custom",
};

export default async function WodsPage() {
  const supabase = await createClient();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a12] to-background" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-foreground">
            WODs
          </h1>
          <p className="text-muted-foreground text-lg mt-4 max-w-2xl">
            Los entrenamientos que definen el Gijon Throwdown. Preparate para darlo todo.
          </p>
        </div>
      </section>

      {/* WOD Cards */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto space-y-8">
          {workouts && workouts.length > 0 ? (
            workouts.map((wod, index) => (
              <Link
                key={wod.id}
                href={`/wods/${wod.slug}`}
                className="group block relative p-8 rounded-2xl bg-card border border-border hover:border-brand-green/30 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Number */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-brand-green/10 flex items-center justify-center">
                    <span className="text-2xl font-black text-brand-green">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h2 className="text-2xl md:text-3xl font-black text-foreground">
                        {wod.name}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge
                        variant="outline"
                        className="border-brand-green/40 text-brand-green"
                      >
                        <Dumbbell size={12} className="mr-1" />
                        {wodTypeLabels[wod.wod_type] || wod.wod_type}
                      </Badge>
                      {wod.time_cap_seconds && (
                        <Badge variant="outline">
                          <Clock size={12} className="mr-1" />
                          {Math.floor(wod.time_cap_seconds / 60)} min
                          {wod.wod_type === "for_time" ? " cap" : ""}
                        </Badge>
                      )}
                      {wod.higher_is_better && (
                        <Badge variant="outline" className="border-brand-cyan/40 text-brand-cyan">
                          Mas es mejor
                        </Badge>
                      )}
                    </div>

                    <p className="text-muted-foreground whitespace-pre-line text-sm md:text-base leading-relaxed">
                      {wod.description}
                    </p>

                    <div className="mt-4 flex items-center gap-1 text-sm text-brand-green opacity-0 group-hover:opacity-100 transition-opacity">
                      Ver standards y detalle <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-20">
              <Dumbbell className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground text-lg">
                Los WODs se anunciaran pronto.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
