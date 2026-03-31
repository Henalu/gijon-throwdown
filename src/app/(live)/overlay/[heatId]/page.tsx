import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { OverlayView } from "./overlay-view";
import { fetchHeatLaneResults, fetchLatestLaneSnapshots } from "@/lib/live-results-server";
import type { LiveLaneResult, LiveMetricType } from "@/types";

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

  const workout = heat.workout as unknown as {
    name: string;
    score_type: string;
    time_cap_seconds: number | null;
  } | null;
  const [latestSnapshots, laneResults] = await Promise.all([
    fetchLatestLaneSnapshots(supabase, heatId, workout?.score_type ?? "reps"),
    fetchHeatLaneResults(supabase, heatId),
  ]);

  const initialStates: Record<
    string,
    {
      cumulative: number;
      is_finished: boolean;
      close_reason: string | null;
      final_metric_type: LiveMetricType | null;
      final_elapsed_ms: number | null;
    }
  > = {};
  for (const snapshot of Object.values(latestSnapshots)) {
    initialStates[snapshot.lane_id] = {
      cumulative: snapshot.cumulative,
      is_finished: false,
      close_reason: null,
      final_metric_type: null,
      final_elapsed_ms: null,
    };
  }

  for (const result of Object.values(laneResults) as LiveLaneResult[]) {
    initialStates[result.lane_id] = {
      cumulative: result.final_value,
      is_finished: true,
      close_reason: result.close_reason,
      final_metric_type: result.final_metric_type,
      final_elapsed_ms: result.final_elapsed_ms,
    };
  }
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
