import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { OverlayView } from "./overlay-view";

interface PageProps {
  params: Promise<{ heatId: string }>;
}

export default async function OverlayPage({ params }: PageProps) {
  const { heatId } = await params;
  const supabase = await createClient();

  const { data: heat } = await supabase
    .from("heats")
    .select(`
      id,
      heat_number,
      status,
      started_at,
      workout:workouts(name, score_type, time_cap_seconds),
      lanes(id, lane_number, team:teams(name))
    `)
    .eq("id", heatId)
    .single();

  if (!heat) notFound();

  // Initial state
  const { data: liveUpdates } = await supabase
    .from("live_updates")
    .select("lane_id, cumulative, update_type")
    .eq("heat_id", heatId)
    .order("created_at", { ascending: false });

  const initialStates: Record<string, { cumulative: number; is_finished: boolean }> = {};
  const seen = new Set<string>();
  for (const u of liveUpdates ?? []) {
    if (!seen.has(u.lane_id)) {
      seen.add(u.lane_id);
      initialStates[u.lane_id] = {
        cumulative: u.cumulative,
        is_finished: u.update_type === "finished",
      };
    }
  }

  const workout = heat.workout as unknown as { name: string; score_type: string; time_cap_seconds: number | null } | null;
  const lanes = (heat.lanes as unknown as Array<{ id: string; lane_number: number; team: { name: string } | null }>) ?? [];

  return (
    <OverlayView
      heatId={heatId}
      heatStatus={heat.status}
      heatStartedAt={heat.started_at}
      workoutName={workout?.name ?? "WOD"}
      scoreType={workout?.score_type ?? "reps"}
      timeCap={workout?.time_cap_seconds ?? null}
      lanes={lanes.sort((a, b) => a.lane_number - b.lane_number)}
      initialStates={initialStates}
    />
  );
}
