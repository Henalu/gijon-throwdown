import { createClient } from "@/lib/supabase/server";
import { PuntuacionesClient } from "./puntuaciones-client";

export default async function PuntuacionesPage() {
  const supabase = await createClient();

  const [scoresRes, heatsRes, workoutsRes] = await Promise.all([
    supabase
      .from("scores")
      .select("*, team:teams(name, category_id), workout:workouts(name, score_type)")
      .order("created_at", { ascending: false }),
    supabase
      .from("heats")
      .select("id, heat_number, status, workout:workouts(name), category:categories(name)")
      .order("scheduled_at"),
    supabase
      .from("workouts")
      .select("id, name")
      .order("sort_order"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Puntuaciones</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gestiona scores, publica resultados y calcula puntos
      </p>
      <div className="mt-6">
        <PuntuacionesClient
          scores={(scoresRes.data ?? []) as never[]}
          heats={(heatsRes.data ?? []) as never[]}
          workouts={(workoutsRes.data ?? []) as never[]}
        />
      </div>
    </div>
  );
}
