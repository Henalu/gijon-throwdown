import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { LiveHeatView } from "./live-heat-view";

interface PageProps {
  params: Promise<{ heatId: string }>;
}

export default async function LiveHeatPage({ params }: PageProps) {
  const { heatId } = await params;
  const supabase = await createClient();

  const { data: heat } = await supabase
    .from("heats")
    .select(`
      id,
      heat_number,
      status,
      started_at,
      category:categories(name),
      workout:workouts(id, name, wod_type, score_type, time_cap_seconds),
      lanes(id, lane_number, team:teams(id, name, box_name, logo_url))
    `)
    .eq("id", heatId)
    .single();

  if (!heat) notFound();

  // Get initial live state
  const { data: liveUpdates } = await supabase
    .from("live_updates")
    .select("*")
    .eq("heat_id", heatId)
    .order("created_at", { ascending: false });

  const initialLaneStates: Record<string, { cumulative: number; is_finished: boolean }> = {};
  const seen = new Set<string>();
  for (const update of liveUpdates ?? []) {
    if (!seen.has(update.lane_id)) {
      seen.add(update.lane_id);
      initialLaneStates[update.lane_id] = {
        cumulative: update.cumulative,
        is_finished: update.update_type === "finished",
      };
    }
  }

  const workout = heat.workout as unknown as {
    id: string;
    name: string;
    wod_type: string;
    score_type: string;
    time_cap_seconds: number | null;
  } | null;

  const lanes = (heat.lanes as unknown as Array<{
    id: string;
    lane_number: number;
    team: { id: string; name: string; box_name: string | null; logo_url: string | null } | null;
  }>) ?? [];

  return (
    <LiveHeatView
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
    />
  );
}
