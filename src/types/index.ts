// ============================================================
// Domain Types - Gijon Throwdown
// ============================================================

export type UserRole = "superadmin" | "admin" | "volunteer" | "athlete";

export type HeatStatus = "pending" | "active" | "finished";

export type WodType = "for_time" | "amrap" | "emom" | "max_weight" | "chipper" | "custom";

export type ScoreType = "time" | "reps" | "weight" | "rounds_reps" | "points";

export type SponsorTier = "title" | "gold" | "silver" | "bronze" | "partner";
export type RegistrationStatus = "pending" | "approved" | "rejected";
export type RegistrationMemberGender = "male" | "female";
export type EditionParticipationRole = "athlete" | "volunteer" | "staff";

export type SlotPosition =
  | "hero_section"
  | "leaderboard_header"
  | "leaderboard_leader"
  | "heat_highlight"
  | "stream_overlay"
  | "top_split"
  | "footer_banner"
  | "wod_sponsor";

export type LiveUpdateType =
  | "reps"
  | "calories"
  | "weight"
  | "rounds"
  | "stage_complete"
  | "finished"
  | "no_rep";

export type LiveMetricType =
  | "reps"
  | "calories"
  | "weight"
  | "rounds"
  | "points";

export type LiveLaneCloseReason = "completed" | "time_cap" | "manual";

// ============================================================
// Table Types
// ============================================================

export interface Profile {
  id: string;
  person_id: string | null;
  role: UserRole;
  full_name: string;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
  is_judge: boolean;
  can_validate_scores: boolean;
  invited_at: string | null;
  setup_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventConfig {
  id: string;
  active_edition_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  date: string;
  end_date: string | null;
  location: string | null;
  venue_name: string | null;
  venue_address: string | null;
  maps_url: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  stream_url: string | null;
  rules_url: string | null;
  faq: FaqItem[];
  status: "draft" | "published" | "live" | "finished";
  created_at: string;
  updated_at: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_team: boolean;
  team_size: number;
  max_teams: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  edition_id: string | null;
  category_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  box_name: string | null;
  country: string;
  city: string | null;
  seed_rank: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Athlete {
  id: string;
  edition_id: string | null;
  person_id: string | null;
  team_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  instagram: string | null;
  sort_order: number;
  created_at: string;
}

export interface Workout {
  id: string;
  name: string;
  slug: string;
  wod_type: WodType;
  score_type: ScoreType;
  time_cap_seconds: number | null;
  description: string | null;
  standards: string | null;
  sort_order: number;
  is_visible: boolean;
  higher_is_better: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutStage {
  id: string;
  workout_id: string;
  name: string;
  description: string | null;
  target_value: number | null;
  unit: string;
  sort_order: number;
  created_at: string;
}

export interface Heat {
  id: string;
  category_id: string;
  workout_id: string;
  heat_number: number;
  name: string | null;
  status: HeatStatus;
  is_live_entry_enabled: boolean;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lane {
  id: string;
  heat_id: string;
  team_id: string;
  lane_number: number;
  created_at: string;
}

export interface LiveUpdate {
  id: string;
  lane_id: string;
  heat_id: string;
  workout_stage_id: string | null;
  update_type: LiveUpdateType;
  value: number;
  cumulative: number;
  submitted_by: string;
  created_at: string;
}

export interface LiveLaneResult {
  id: string;
  heat_id: string;
  lane_id: string;
  close_reason: LiveLaneCloseReason;
  final_value: number;
  final_metric_type: LiveMetricType;
  final_elapsed_ms: number | null;
  judge_notes: string | null;
  closed_by: string;
  closed_at: string;
  updated_at: string;
}

export interface LiveCheckpoint {
  id: string;
  heat_id: string;
  lane_id: string;
  value: number;
  metric_type: LiveMetricType;
  elapsed_ms: number | null;
  submitted_by: string;
  created_at: string;
}

export interface Score {
  id: string;
  team_id: string;
  workout_id: string;
  heat_id: string | null;
  time_ms: number | null;
  reps: number | null;
  weight_kg: number | null;
  rounds: number | null;
  remaining_reps: number | null;
  points: number | null;
  is_rx: boolean;
  is_cap: boolean;
  penalty_seconds: number;
  is_published: boolean;
  notes: string | null;
  submitted_by: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  tier: SponsorTier;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SponsorSlot {
  id: string;
  sponsor_id: string;
  position: SlotPosition;
  label: string | null;
  is_active: boolean;
  priority: number;
  created_at: string;
}

export interface VolunteerAssignment {
  id: string;
  volunteer_id: string;
  heat_id: string;
  lane_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface StreamSession {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string | null;
  is_live: boolean;
  is_public: boolean;
  sort_order: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VolunteerApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  shirt_size: string;
  dietary_restrictions: string | null;
  is_judge: boolean;
  consent_accepted_at: string;
  status: RegistrationStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  converted_person_id: string | null;
  converted_profile_id: string | null;
  converted_at: string | null;
  converted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  url: string;
  thumbnail_url: string | null;
  media_type: string;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  album: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  price_label: string | null;
  purchase_url: string | null;
  sort_order: number;
  is_visible: boolean;
  download_enabled: boolean;
  is_featured: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamRegistration {
  id: string;
  category_id: string;
  team_name: string;
  leader_name: string;
  leader_email: string;
  consent_accepted_at: string;
  status: RegistrationStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  converted_team_id: string | null;
  converted_at: string | null;
  converted_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamRegistrationMember {
  id: string;
  team_registration_id: string;
  full_name: string;
  email: string;
  shirt_size: string;
  gender: RegistrationMemberGender;
  sort_order: number;
  converted_person_id: string | null;
  converted_athlete_id: string | null;
  created_at: string;
}

export interface Person {
  id: string;
  first_name: string;
  last_name: string | null;
  full_name: string;
  primary_email: string | null;
  gender: RegistrationMemberGender | null;
  shirt_size: string | null;
  dietary_restrictions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventEdition {
  id: string;
  slug: string;
  label: string;
  year: number | null;
  starts_on: string | null;
  ends_on: string | null;
  venue_name: string | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EditionParticipation {
  id: string;
  edition_id: string;
  person_id: string;
  profile_id: string | null;
  team_id: string | null;
  category_id: string | null;
  athlete_id: string | null;
  role: EditionParticipationRole;
  invited_at: string | null;
  activated_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Joined / Extended Types
// ============================================================

export interface LaneWithTeam extends Lane {
  team: Team;
}

export interface HeatWithDetails extends Heat {
  category: Category;
  workout: Workout;
  lanes: LaneWithTeam[];
}

export interface TeamWithAthletes extends Team {
  athletes: Athlete[];
}

export interface LeaderboardEntry {
  team_id: string;
  team_name: string;
  box_name: string | null;
  category_id: string;
  total_points: number;
  rank: number;
  wod_results: {
    workout_id: string;
    workout_name: string;
    rank: number;
    points: number;
    result_display: string;
  }[];
}
