import { createClient } from "@/lib/supabase/server";
import { getVolunteerHeatBuckets } from "@/lib/auth/live-access";
import { requireVolunteerSurfaceProfile } from "@/lib/auth/session";
import { VolunteerDashboardClient } from "./volunteer-dashboard-client";

export default async function VoluntarioHomePage() {
  const { user, profile } = await requireVolunteerSurfaceProfile("/voluntario");
  const supabase = await createClient();
  const { assigned, available, unavailable } = await getVolunteerHeatBuckets({
    supabase,
    profile,
    userId: user.id,
  });

  return (
    <VolunteerDashboardClient
      assigned={assigned}
      available={available}
      unavailable={unavailable}
    />
  );
}
