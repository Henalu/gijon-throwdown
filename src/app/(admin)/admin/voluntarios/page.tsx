import { createClient } from "@/lib/supabase/server";
import type { UserRole, VolunteerApplication } from "@/types";
import {
  type AssignmentOptionHeat,
  type AssignmentOptionLane,
  type AssignmentOptionVolunteer,
  type VolunteerAssignmentRow,
} from "./volunteer-assignments-client";
import { VolunteersClient } from "./volunteers-client";

interface VolunteerStaffRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_judge: boolean;
  can_validate_scores: boolean;
  setup_completed_at: string | null;
}

interface VolunteerProfileRow {
  id: string;
  full_name: string;
  email: string;
}

interface HeatQueryRow {
  id: string;
  heat_number: number;
  status: string;
  is_live_entry_enabled: boolean;
  category: { name: string } | { name: string }[] | null;
  workout: { name: string } | { name: string }[] | null;
}

interface LaneQueryRow {
  id: string;
  heat_id: string;
  lane_number: number;
  team: { name: string } | { name: string }[] | null;
}

function getSingleRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

interface AssignmentQueryRow {
  id: string;
  volunteer_id: string;
  heat_id: string;
  lane_id: string | null;
  notes: string | null;
}

export default async function VoluntariosPage() {
  const supabase = await createClient();

  const [
    { data: volunteers },
    { data: applications },
    { data: volunteerProfiles },
    { data: heats },
    { data: lanes },
    { data: assignments },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, is_active, is_judge, can_validate_scores, setup_completed_at",
      )
      .in("role", ["volunteer", "admin", "superadmin"])
      .order("created_at"),
    supabase
      .from("volunteer_applications")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "volunteer")
      .eq("is_active", true)
      .order("full_name"),
    supabase
      .from("heats")
      .select(
        "id, heat_number, status, is_live_entry_enabled, category:categories(name), workout:workouts(name)",
      )
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("lanes")
      .select("id, heat_id, lane_number, team:teams(name)")
      .order("lane_number", { ascending: true }),
    supabase
      .from("volunteer_assignments")
      .select("id, volunteer_id, heat_id, lane_id, notes")
      .order("created_at", { ascending: false }),
  ]);

  const heatsWithLanes: AssignmentOptionHeat[] = ((heats ?? []) as HeatQueryRow[]).map(
    (heat) => ({
      id: heat.id,
      heat_number: heat.heat_number,
      status: heat.status,
      is_live_entry_enabled: heat.is_live_entry_enabled,
      category_name: getSingleRelation(heat.category)?.name ?? null,
      workout_name: getSingleRelation(heat.workout)?.name ?? null,
      lanes: ((lanes ?? []) as LaneQueryRow[])
        .filter((lane) => lane.heat_id === heat.id)
        .map(
          (lane): AssignmentOptionLane => ({
            id: lane.id,
            heat_id: lane.heat_id,
            lane_number: lane.lane_number,
            team_name: getSingleRelation(lane.team)?.name ?? null,
          }),
        ),
    }),
  );

  const volunteerOptions: AssignmentOptionVolunteer[] = (
    (volunteerProfiles ?? []) as VolunteerProfileRow[]
  ).map((profile) => ({
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
  }));

  const volunteerById = new Map(volunteerOptions.map((volunteer) => [volunteer.id, volunteer]));
  const heatById = new Map(heatsWithLanes.map((heat) => [heat.id, heat]));
  const laneById = new Map(
    heatsWithLanes.flatMap((heat) => heat.lanes.map((lane) => [lane.id, lane] as const)),
  );

  const assignmentRows: VolunteerAssignmentRow[] = ((assignments ?? []) as AssignmentQueryRow[]).map(
    (assignment) => {
      const volunteer = volunteerById.get(assignment.volunteer_id);
      const heat = heatById.get(assignment.heat_id);
      const lane = assignment.lane_id ? laneById.get(assignment.lane_id) : null;

      return {
        id: assignment.id,
        volunteer_id: assignment.volunteer_id,
        heat_id: assignment.heat_id,
        lane_id: assignment.lane_id,
        notes: assignment.notes,
        volunteer_name: volunteer?.full_name ?? null,
        volunteer_email: volunteer?.email ?? null,
        heat_number: heat?.heat_number ?? null,
        heat_status: heat?.status ?? null,
        heat_live_enabled: heat?.is_live_entry_enabled ?? false,
        category_name: heat?.category_name ?? null,
        workout_name: heat?.workout_name ?? null,
        lane_number: lane?.lane_number ?? null,
        team_name: lane?.team_name ?? null,
      };
    },
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Voluntarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Staff operativo actual y solicitudes publicas pendientes de revision.
        </p>
      </div>

      <VolunteersClient
        volunteers={(volunteers ?? []) as VolunteerStaffRow[]}
        applications={(applications ?? []) as VolunteerApplication[]}
        assignments={assignmentRows}
        assignableVolunteers={volunteerOptions}
        heats={heatsWithLanes}
      />
    </div>
  );
}
