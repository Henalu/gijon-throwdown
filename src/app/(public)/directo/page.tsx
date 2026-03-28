import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Radio, MonitorPlay } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "En Directo",
  description: "Seguimiento en vivo de la competicion",
};

export default async function DirectoPage() {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("event_config")
    .select("stream_url, status")
    .single();

  const { data: activeHeats } = await supabase
    .from("heats")
    .select(
      "*, category:categories(name), workout:workouts(name), lanes(id, lane_number, team:teams(name, box_name))"
    )
    .eq("status", "active")
    .order("scheduled_at");

  const { data: pendingHeats } = await supabase
    .from("heats")
    .select(
      "*, category:categories(name), workout:workouts(name)"
    )
    .eq("status", "pending")
    .order("scheduled_at")
    .limit(3);

  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a12] to-background" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-foreground">
              En Directo
            </h1>
            {activeHeats && activeHeats.length > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse-live">
                <Radio size={12} className="mr-1" />
                LIVE
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-lg">
            Seguimiento en tiempo real de los heats activos.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Stream embed */}
          {event?.stream_url && (
            <div className="rounded-2xl overflow-hidden border border-border">
              <div className="aspect-video bg-black">
                <iframe
                  src={event.stream_url.replace("watch?v=", "embed/")}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Stream en directo"
                />
              </div>
            </div>
          )}

          {/* Active heats */}
          {activeHeats && activeHeats.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Radio size={20} className="text-brand-green" />
                Heats en curso
              </h2>
              {activeHeats.map((heat) => (
                <Link
                  key={heat.id}
                  href={`/live/${heat.id}`}
                  className="block p-6 rounded-xl bg-card border border-brand-green/20 hover:border-brand-green/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {heat.workout?.name} - Heat {heat.heat_number}
                      </h3>
                      <p className="text-sm text-brand-green">
                        {heat.category?.name}
                      </p>
                    </div>
                    <Badge className="bg-brand-green/10 text-brand-green border-brand-green/30">
                      Ver en vivo
                    </Badge>
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
                              className="p-3 rounded-lg bg-muted/50 text-center"
                            >
                              <p className="text-xs text-muted-foreground">
                                Calle {lane.lane_number}
                              </p>
                              <p className="font-bold text-foreground text-sm">
                                {lane.team?.name || "---"}
                              </p>
                            </div>
                          )
                        )}
                    </div>
                  )}
                </Link>
              ))}
            </>
          ) : (
            <div className="text-center py-16">
              <MonitorPlay
                className="mx-auto text-muted-foreground mb-4"
                size={48}
              />
              <p className="text-muted-foreground text-lg mb-2">
                No hay heats en curso ahora mismo.
              </p>
              <p className="text-muted-foreground text-sm">
                Cuando un heat se active, aparecera aqui con datos en tiempo real.
              </p>
            </div>
          )}

          {/* Upcoming heats */}
          {pendingHeats && pendingHeats.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-foreground mt-8">
                Proximos heats
              </h2>
              <div className="space-y-3">
                {pendingHeats.map((heat) => (
                  <div
                    key={heat.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {heat.workout?.name} - Heat {heat.heat_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {heat.category?.name}
                      </p>
                    </div>
                    {heat.scheduled_at && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(heat.scheduled_at).toLocaleString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
