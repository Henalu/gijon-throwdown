import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Radio, Clock, CheckCircle2 } from "lucide-react";

const statusConfig: Record<string, { label: string; class: string; icon: typeof Radio }> = {
  active: { label: "EN VIVO", class: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse-live", icon: Radio },
  pending: { label: "Pendiente", class: "text-muted-foreground", icon: Clock },
  finished: { label: "Finalizado", class: "text-muted-foreground", icon: CheckCircle2 },
};

export default async function VoluntarioHomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/voluntario");

  // Get heats assigned to this volunteer
  const { data: assignments } = await supabase
    .from("volunteer_assignments")
    .select(`
      id,
      notes,
      lane_id,
      heat:heats(
        id,
        heat_number,
        status,
        scheduled_at,
        category:categories(name),
        workout:workouts(name)
      )
    `)
    .eq("volunteer_id", user.id)
    .order("created_at");

  // Also get all active heats (in case volunteer isn't specifically assigned)
  const { data: activeHeats } = await supabase
    .from("heats")
    .select("id, heat_number, status, category:categories(name), workout:workouts(name)")
    .eq("status", "active")
    .order("scheduled_at");

  const assignedHeatIds = new Set(
    assignments?.map((a) => (a.heat as unknown as Record<string, unknown>)?.id).filter(Boolean)
  );

  const unassignedActiveHeats = (activeHeats ?? []).filter(
    (h) => !assignedHeatIds.has(h.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis Heats</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona un heat para empezar a puntuar
        </p>
      </div>

      {/* Assigned heats */}
      {assignments && assignments.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Asignados
          </h2>
          {assignments.map((assignment) => {
            const heat = assignment.heat as unknown as Record<string, unknown> | null;
            if (!heat) return null;
            const status = heat.status as string;
            const config = statusConfig[status] || statusConfig.pending;
            const Icon = config.icon;

            return (
              <Link
                key={assignment.id}
                href={`/voluntario/heat/${heat.id}`}
                className="block p-4 rounded-xl bg-card border border-border hover:border-brand-green/40 transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-foreground">
                      {(heat.workout as Record<string, string>)?.name} - Heat {heat.heat_number as number}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(heat.category as Record<string, string>)?.name}
                      {assignment.notes ? ` | ${assignment.notes}` : ""}
                    </p>
                  </div>
                  <Badge className={config.class}>
                    <Icon size={12} className="mr-1" />
                    {config.label}
                  </Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Unassigned active heats */}
      {unassignedActiveHeats.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Heats activos
          </h2>
          {unassignedActiveHeats.map((heat) => (
            <Link
              key={heat.id}
              href={`/voluntario/heat/${heat.id}`}
              className="block p-4 rounded-xl bg-card border border-brand-green/20 hover:border-brand-green/40 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">
                    {(heat.workout as unknown as Record<string, string> | null)?.name} - Heat {heat.heat_number}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(heat.category as unknown as Record<string, string> | null)?.name}
                  </p>
                </div>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse-live">
                  <Radio size={12} className="mr-1" />
                  EN VIVO
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      {(!assignments || assignments.length === 0) && unassignedActiveHeats.length === 0 && (
        <div className="text-center py-16">
          <Clock className="mx-auto text-muted-foreground mb-4" size={48} />
          <p className="text-muted-foreground">
            No tienes heats asignados ni hay heats activos.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Espera a que el admin active un heat.
          </p>
        </div>
      )}
    </div>
  );
}
