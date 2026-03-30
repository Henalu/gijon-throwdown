import { notFound } from "next/navigation";
import { requireValidationProfile } from "@/lib/auth/session";
import { ValidationDetailClient } from "./validation-detail-client";

interface PageProps {
  params: Promise<{ heatId: string }>;
}

function getSingleRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function ValidationHeatPage({ params }: PageProps) {
  const { heatId } = await params;
  const { supabase } = await requireValidationProfile(
    `/admin/validacion/${heatId}`,
  );

  const [{ data: heat }, { data: scores }, { data: liveUpdates }] =
    await Promise.all([
      supabase
        .from("heats")
        .select(`
          id,
          heat_number,
          status,
          scheduled_at,
          started_at,
          finished_at,
          category:categories(name),
          workout:workouts(id, name, score_type, wod_type),
          lanes(id, lane_number, team:teams(id, name, box_name))
        `)
        .eq("id", heatId)
        .single(),
      supabase
        .from("scores")
        .select(
          "id, team_id, workout_id, heat_id, time_ms, reps, weight_kg, rounds, remaining_reps, points, is_rx, is_cap, penalty_seconds, is_published, notes, verified_by, verified_at, team:teams(name, category_id), workout:workouts(name, score_type)",
        )
        .eq("heat_id", heatId)
        .order("created_at"),
      supabase
        .from("live_updates")
        .select("lane_id, update_type, cumulative, created_at")
        .eq("heat_id", heatId)
        .order("created_at", { ascending: false }),
    ]);

  if (!heat) {
    notFound();
  }

  const latestByLane = new Map<
    string,
    { lane_id: string; update_type: string; cumulative: number; created_at: string }
  >();

  for (const update of liveUpdates ?? []) {
    if (!latestByLane.has(update.lane_id)) {
      latestByLane.set(update.lane_id, update);
    }
  }

  const liveSummary = (
    (heat.lanes as unknown as Array<{
      id: string;
      lane_number: number;
      team: { id: string; name: string; box_name: string | null }[] | null;
    }> | null) ?? []
  )
    .sort((a, b) => a.lane_number - b.lane_number)
    .map((lane) => {
      const latest = latestByLane.get(lane.id);
      const team = getSingleRelation(lane.team);

      return {
        lane_id: lane.id,
        lane_number: lane.lane_number,
        team_name: team?.name ?? "Sin equipo",
        cumulative: latest?.cumulative ?? 0,
        last_update_type: latest?.update_type ?? "sin_datos",
        is_finished: latest?.update_type === "finished",
      };
    });

  return (
    <ValidationDetailClient
      heat={{
        id: heat.id,
        heat_number: heat.heat_number,
        status: heat.status,
        scheduled_at: heat.scheduled_at,
        started_at: heat.started_at,
        finished_at: heat.finished_at,
        category_name: getSingleRelation(heat.category)?.name ?? "",
        workout_id: getSingleRelation(heat.workout)?.id ?? "",
        workout_name: getSingleRelation(heat.workout)?.name ?? "WOD",
      }}
      scores={(scores ?? []) as never[]}
      liveSummary={liveSummary}
    />
  );
}
