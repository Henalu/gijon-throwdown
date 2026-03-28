import { createClient } from "@/lib/supabase/server";
import type { Sponsor } from "@/types";
import { PatrocinadoresClient } from "./patrocinadores-client";

export default async function PatrocinadoresPage() {
  const supabase = await createClient();

  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold">Patrocinadores</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gestiona los sponsors del evento
      </p>
      <div className="mt-6">
        <PatrocinadoresClient sponsors={(sponsors ?? []) as Sponsor[]} />
      </div>
    </div>
  );
}
