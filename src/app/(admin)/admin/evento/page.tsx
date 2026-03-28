import { createClient } from "@/lib/supabase/server";
import type { EventConfig } from "@/types";
import { EventForm } from "./event-form";

export default async function EventoPage() {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("event_config")
    .select("*")
    .limit(1)
    .single();

  if (!event) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Evento</h1>
        <p className="mt-4 text-muted-foreground">
          No se encontro la configuracion del evento.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Evento</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configuracion general del evento
      </p>
      <div className="mt-6 max-w-2xl">
        <EventForm event={event as EventConfig} />
      </div>
    </div>
  );
}
