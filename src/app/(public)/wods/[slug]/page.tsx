import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Clock, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const wodTypeLabels: Record<string, string> = {
  for_time: "For Time",
  amrap: "AMRAP",
  emom: "EMOM",
  max_weight: "Max Weight",
  chipper: "Chipper",
  custom: "Custom",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: wod } = await supabase
    .from("workouts")
    .select("name")
    .eq("slug", slug)
    .single();

  return {
    title: wod?.name || "WOD",
  };
}

export default async function WodDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: wod } = await supabase
    .from("workouts")
    .select("*")
    .eq("slug", slug)
    .eq("is_visible", true)
    .single();

  if (!wod) {
    notFound();
  }

  const { data: stages } = await supabase
    .from("workout_stages")
    .select("*")
    .eq("workout_id", wod.id)
    .order("sort_order");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a12] to-background" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <Link
            href="/wods"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Volver a WODs
          </Link>

          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-foreground mb-4">
            {wod.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant="outline"
              className="border-brand-green/40 text-brand-green text-sm px-3 py-1"
            >
              <Dumbbell size={14} className="mr-1.5" />
              {wodTypeLabels[wod.wod_type] || wod.wod_type}
            </Badge>
            {wod.time_cap_seconds && (
              <Badge variant="outline" className="text-sm px-3 py-1">
                <Clock size={14} className="mr-1.5" />
                {Math.floor(wod.time_cap_seconds / 60)} minutos
                {wod.wod_type === "for_time" ? " (time cap)" : ""}
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main: Description */}
            <div className="md:col-span-2 space-y-8">
              <div className="p-6 rounded-xl bg-card border border-border">
                <h2 className="text-lg font-bold text-foreground mb-4 uppercase tracking-wide">
                  Entrenamiento
                </h2>
                <div className="text-foreground whitespace-pre-line leading-relaxed">
                  {wod.description}
                </div>
              </div>

              {wod.standards && (
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h2 className="text-lg font-bold text-foreground mb-4 uppercase tracking-wide">
                    Standards
                  </h2>
                  <div className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm">
                    {wod.standards}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: Stages */}
            <div className="space-y-6">
              {stages && stages.length > 0 && (
                <div className="p-6 rounded-xl bg-card border border-border">
                  <h2 className="text-lg font-bold text-foreground mb-4 uppercase tracking-wide">
                    Fases
                  </h2>
                  <div className="space-y-3">
                    {stages.map((stage, idx) => (
                      <div
                        key={stage.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-green/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-brand-green">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {stage.name}
                          </p>
                          {stage.target_value && (
                            <p className="text-xs text-muted-foreground">
                              {stage.target_value} {stage.unit}
                            </p>
                          )}
                        </div>
                        <CheckCircle
                          size={16}
                          className="text-muted-foreground/30"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6 rounded-xl bg-brand-green/5 border border-brand-green/20">
                <h3 className="font-bold text-brand-green mb-2">Scoring</h3>
                <p className="text-sm text-muted-foreground">
                  {wod.wod_type === "for_time"
                    ? "Gana quien termine mas rapido. Si llegas al time cap, cuenta el trabajo completado."
                    : wod.wod_type === "amrap"
                    ? "Gana quien acumule mas reps/rondas en el tiempo disponible."
                    : wod.wod_type === "max_weight"
                    ? "Gana quien levante mas peso."
                    : "Consulta los standards para detalles del scoring."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
