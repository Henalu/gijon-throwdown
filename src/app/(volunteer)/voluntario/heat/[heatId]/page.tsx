import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScoringInterface } from "./scoring-interface";
import { canUserOperateHeat } from "@/lib/auth/live-access";
import { fetchHeatLaneResults, fetchLatestLaneSnapshots } from "@/lib/live-results-server";
import { requireVolunteerSurfaceProfile } from "@/lib/auth/session";
import type { LiveCheckpoint, LiveLaneResult, LiveMetricType } from "@/types";

interface PageProps {
  params: Promise<{ heatId: string }>;
}

export default async function VolunteerHeatPage({ params }: PageProps) {
  const { heatId } = await params;
  const { user, profile } = await requireVolunteerSurfaceProfile(`/voluntario/heat/${heatId}`);
  const supabase = await createClient();
  const access = await canUserOperateHeat({
    supabase,
    profile,
    userId: user.id,
    heatId,
  });
  if (!access.allowed) redirect("/voluntario");

  // Get heat with workout details and lanes
  const { data: heat } = await supabase
    .from("heats")
    .select(`
      id,
      heat_number,
      status,
      is_live_entry_enabled,
      started_at,
      category:categories(name),
      workout:workouts(id, name, wod_type, score_type, time_cap_seconds, higher_is_better),
      lanes(id, lane_number, team:teams(id, name, box_name))
    `)
    .eq("id", heatId)
    .single();

  if (!heat) redirect("/voluntario");

  const workout = heat.workout as unknown as {
    id: string;
    name: string;
    wod_type: string;
    score_type: string;
    time_cap_seconds: number | null;
    higher_is_better: boolean;
  } | null;

  const [{ data: checkpoints }, latestSnapshots, laneResults] =
    await Promise.all([
      supabase
        .from("live_checkpoints")
        .select("*")
        .eq("heat_id", heatId)
        .order("created_at"),
      fetchLatestLaneSnapshots(
        supabase,
        heatId,
        workout?.score_type ?? "reps",
      ),
      fetchHeatLaneResults(supabase, heatId),
    ]);

  const initialLaneStates: Record<
    string,
    {
      cumulative: number;
      is_finished: boolean;
      update_type: string;
      close_reason: string | null;
      final_metric_type: LiveMetricType | null;
      final_elapsed_ms: number | null;
      judge_notes: string | null;
      closed_at: string | null;
    }
  > = {};

  for (const snapshot of Object.values(latestSnapshots)) {
    initialLaneStates[snapshot.lane_id] = {
      cumulative: snapshot.cumulative,
      is_finished: false,
      update_type: snapshot.update_type,
      close_reason: null,
      final_metric_type: null,
      final_elapsed_ms: null,
      judge_notes: null,
      closed_at: null,
    };
  }

  for (const result of Object.values(laneResults) as LiveLaneResult[]) {
    initialLaneStates[result.lane_id] = {
      cumulative: result.final_value,
      is_finished: true,
      update_type: result.final_metric_type,
      close_reason: result.close_reason,
      final_metric_type: result.final_metric_type,
      final_elapsed_ms: result.final_elapsed_ms,
      judge_notes: result.judge_notes,
      closed_at: result.closed_at,
    };
  }

  const initialCheckpoints = ((checkpoints ?? []) as LiveCheckpoint[]).reduce<
    Record<
      string,
      Array<{
        id: string;
        value: number;
        metric_type: LiveMetricType;
        elapsed_ms: number | null;
        created_at: string;
      }>
    >
  >((acc, checkpoint) => {
    const current = acc[checkpoint.lane_id] ?? [];
    current.push({
      id: checkpoint.id,
      value: checkpoint.value,
      metric_type: checkpoint.metric_type,
      elapsed_ms: checkpoint.elapsed_ms,
      created_at: checkpoint.created_at,
    });
    acc[checkpoint.lane_id] = current;
    return acc;
  }, {});

  const lanes = (heat.lanes as unknown as Array<{
    id: string;
    lane_number: number;
    team: { id: string; name: string; box_name: string | null } | null;
  }>) ?? [];

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
      initialCheckpoints={initialCheckpoints}
      userId={user.id}
    />
  );
}
