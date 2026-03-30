import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { requireValidationProfile } from "@/lib/auth/session";

function getSingleRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getValidationState(
  scores: Array<{ is_published: boolean; verified_at: string | null }>,
) {
  if (scores.length === 0) {
    return {
      label: "Sin borrador",
      className: "border-yellow-500/30 text-yellow-500",
    };
  }

  if (scores.every((score) => score.is_published)) {
    return {
      label: "Publicado",
      className: "border-brand-green/30 text-brand-green",
    };
  }

  if (scores.every((score) => Boolean(score.verified_at))) {
    return {
      label: "Validado",
      className: "border-brand-cyan/30 text-brand-cyan",
    };
  }

  return {
    label: "Borrador",
    className: "border-orange-500/30 text-orange-500",
  };
}

export default async function ValidacionPage() {
  const { supabase } = await requireValidationProfile("/admin/validacion");

  const { data: heats } = await supabase
    .from("heats")
    .select(`
      id,
      heat_number,
      status,
      scheduled_at,
      category:categories(name),
      workout:workouts(id, name),
      scores(id, is_published, verified_at),
      live_lane_results(judge_notes)
    `)
    .eq("status", "finished")
    .order("scheduled_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Validacion oficial</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisa los heats finalizados, valida los scores oficiales y publica
          solo cuando todo cuadre con la hoja buena.
        </p>
      </div>

      <div className="space-y-3">
        {(heats ?? []).map((heat) => {
          const state = getValidationState(
            ((heat.scores as Array<{
              is_published: boolean;
              verified_at: string | null;
            }>) ?? []),
          );
          const hasJudgeNotes = ((heat.live_lane_results as Array<{
            judge_notes: string | null;
          }> | null) ?? []).some((lane) => Boolean(lane.judge_notes));

          return (
            <div
              key={heat.id}
              className="rounded-2xl border border-border/60 bg-card/80 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-foreground">
                      {getSingleRelation(heat.workout)?.name} - Heat #{heat.heat_number}
                    </p>
                    <Badge variant="outline" className={state.className}>
                      {state.label}
                    </Badge>
                    {hasJudgeNotes && (
                      <Badge
                        variant="outline"
                        className="border-orange-500/30 text-orange-500"
                      >
                        Observaciones juez
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getSingleRelation(heat.category)?.name} ·{" "}
                    {heat.scheduled_at
                      ? new Date(heat.scheduled_at).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Sin hora programada"}
                  </p>
                </div>

                <Link
                  href={`/admin/validacion/${heat.id}`}
                  className={buttonVariants()}
                >
                  Abrir validacion
                </Link>
              </div>
            </div>
          );
        })}

        {(heats ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Todavia no hay heats finalizados pendientes de validacion.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
