import { createClient } from "@/lib/supabase/server";
import { StreamingClient } from "./streaming-client";

export default async function StreamingPage() {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("event_config")
    .select("id, stream_url")
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold">Streaming</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configura la URL del stream de YouTube para embedderlo en la pagina de directo.
      </p>
      <div className="mt-6">
        <StreamingClient
          eventId={event?.id ?? ""}
          currentUrl={event?.stream_url ?? ""}
        />
      </div>
    </div>
  );
}
