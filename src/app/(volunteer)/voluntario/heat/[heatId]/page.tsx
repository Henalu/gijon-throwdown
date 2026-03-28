import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScoringInterface } from "./scoring-interface";

interface PageProps {
  params: Promise<{ heatId: string }>;
}

export default async function VolunteerHeatPage({ params }: PageProps) {
  const { heatId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?redirect=/voluntario");

  // Get heat with workout details and lanes
  const { data: heat } = await supabase
    .from("heats")
    .select(`
      id,
      heat_number,
      status,
      started_at,
      category:categories(name),
      workout:workouts(id, name, wod_type, score_type, time_cap_seconds, higher_is_better),
      lanes(id, lane_number, team:teams(id, name, box_name))
    `)
    .eq("id", heatId)
    .single();

  if (!heat) redirect("/voluntario");

  // Get initial live state
  const { data: liveUpdates } = await supabase
    .from("live_updates")
    .select("*")
    .eq("heat_id", heatId)
    .order("created_at", { ascending: false });

  // Build initial lane states
  const initialLaneStates: Record<string, { cumulative: number; is_finished: boolean; update_type: string }> = {};
  const seen = new Set<string>();
  for (const update of liveUpdates ?? []) {
    if (!seen.has(update.lane_id)) {
      seen.add(update.lane_id);
      initialLaneStates[update.lane_id] = {
        cumulative: update.cumulative,
        is_finished: update.update_type === "finished",
        update_type: update.update_type,
      };
    }
  }

  const lanes = (heat.lanes as unknown as Array<{
    id: string;
    lane_number: number;
    team: { id: string; name: string; box_name: string | null } | null;
  }>) ?? [];

  const workout = heat.workout as unknown as {
    id: string;
    name: string;
    wod_type: string;
    score_type: string;
    time_cap_seconds: number | null;
    higher_is_better: boolean;
  } | null;

  return (
    <ScoringInterface
      heatId={heatId}
      heatNumber={heat.heat_number}
      heatStatus={heat.status}
      heatStartedAt={heat.started_at}
      workoutName={workout?.name ?? "WOD"}
      workoutType={workout?.wod_type ?? "for_time"}
      scoreType={workout?.score_type ?? "reps"}
      timeCap={workout?.time_cap_seconds ?? null}
      categoryName={(heat.category as unknown as { name: string } | null)?.name ?? ""}
      lanes={lanes.sort((a, b) => a.lane_number - b.lane_number)}
      initialLaneStates={initialLaneStates}
      userId={user.id}
    />
  );
}
