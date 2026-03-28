import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Horarios",
  description: "Programa de heats y horarios de la competicion",
};

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pendiente",
    className: "border-yellow-500/40 text-yellow-500",
  },
  active: {
    label: "En curso",
    className: "border-brand-green/40 text-brand-green animate-pulse-live",
  },
  finished: {
    label: "Finalizado",
    className: "border-muted-foreground/40 text-muted-foreground",
  },
};

export default async function HorariosPage() {
  const supabase = await createClient();

  const { data: heats } = await supabase
    .from("heats")
    .select(
      "*, category:categories(name, slug), workout:workouts(name, slug, wod_type), lanes(id, lane_number, team:teams(name, box_name))"
    )
    .order("scheduled_at", { ascending: true });

  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a12] to-background" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-foreground">
            Horarios
          </h1>
          <p className="text-muted-foreground text-lg mt-4">
            Programa completo de heats y sus equipos asignados.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
          {heats && heats.length > 0 ? (
            heats.map((heat) => {
              const status = statusLabels[heat.status] || statusLabels.pending;
              return (
                <div
                  key={heat.id}
                  className="p-6 rounded-xl bg-card border border-border"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-foreground">
                          Heat {heat.heat_number}
                        </h3>
                        <Badge
                          variant="outline"
                          className={status.className}
                        >
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {heat.workout?.name} &middot;{" "}
                        <span className="text-brand-green">
                          {heat.category?.name}
                        </span>
                      </p>
                    </div>
                    {heat.scheduled_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={16} />
                        {new Date(heat.scheduled_at).toLocaleString("es-ES", {
                          weekday: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>

                  {heat.lanes && heat.lanes.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {heat.lanes
                        .sort(
                          (a: { lane_number: number }, b: { lane_number: number }) =>
                            a.lane_number - b.lane_number
                        )
                        .map(
                          (lane: {
                            id: string;
                            lane_number: number;
                            team: { name: string; box_name: string | null } | null;
                          }) => (
                            <div
                              key={lane.id}
                              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-brand-green">
                                  {lane.lane_number}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {lane.team?.name || "Sin equipo"}
                                </p>
                                {lane.team?.box_name && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {lane.team.box_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-20">
              <Users
                className="mx-auto text-muted-foreground mb-4"
                size={48}
              />
              <p className="text-muted-foreground text-lg">
                Los horarios se publicaran pronto.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
