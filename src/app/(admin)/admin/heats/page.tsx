import { createClient } from "@/lib/supabase/server";
import type { Category, Workout, Heat, Lane, Team } from "@/types";
import { HeatsClient } from "./heats-client";

export type HeatRow = Heat & {
  categories: { name: string } | null;
  workouts: { name: string } | null;
  lanes: (Lane & { teams: { id: string; name: string } | null })[];
};

export default async function HeatsPage() {
  const supabase = await createClient();

  const [
    { data: heats },
    { data: categories },
    { data: workouts },
    { data: teams },
  ] = await Promise.all([
    supabase
      .from("heats")
      .select("*, categories(name), workouts(name), lanes(*, teams(id, name))")
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("workouts")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase.from("teams").select("id, name, category_id").order("name"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Heats</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gestiona las series y asignaciones de lanes
      </p>
      <div className="mt-6">
        <HeatsClient
          heats={(heats ?? []) as HeatRow[]}
          categories={(categories ?? []) as Category[]}
          workouts={(workouts ?? []) as Workout[]}
          teams={
            (teams ?? []) as { id: string; name: string; category_id: string }[]
          }
        />
      </div>
    </div>
  );
}
