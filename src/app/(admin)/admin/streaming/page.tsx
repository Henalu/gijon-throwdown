import { createClient } from "@/lib/supabase/server";
import { StreamingClient } from "./streaming-client";
import type { StreamSession } from "@/types";

export default async function StreamingPage() {
  const supabase = await createClient();

  const [{ data: event }, { data: sessions }] = await Promise.all([
    supabase
      .from("event_config")
      .select("id, stream_url")
      .single(),
    supabase
      .from("stream_sessions")
      .select("*")
      .order("is_live", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("started_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Streaming</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Controla el embed principal del directo y las sesiones publicas que
          luego se muestran en la web del evento.
        </p>
      </div>
      <div>
        <StreamingClient
          eventId={event?.id ?? ""}
          currentUrl={event?.stream_url ?? ""}
          sessions={(sessions ?? []) as StreamSession[]}
        />
      </div>
    </div>
  );
}
