import { createClient } from "@/lib/supabase/server";
import type { Workout } from "@/types";
import { WodsClient } from "./wods-client";

export default async function WodsPage() {
  const supabase = await createClient();

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold">WODs</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gestiona los workouts de la competicion
      </p>
      <div className="mt-6">
        <WodsClient workouts={(workouts ?? []) as Workout[]} />
      </div>
    </div>
  );
}
