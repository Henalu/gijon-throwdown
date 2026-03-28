import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export default async function VoluntariosPage() {
  const supabase = await createClient();

  const { data: volunteers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "volunteer")
    .order("created_at");

  return (
    <div>
      <h1 className="text-2xl font-bold">Voluntarios</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gestion de voluntarios/jueces. Para crear nuevos voluntarios, usa el dashboard de Supabase (Auth &gt; Users) con role = volunteer.
      </p>

      <div className="mt-6 space-y-3">
        {volunteers && volunteers.length > 0 ? (
          volunteers.map((vol) => (
            <div key={vol.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div>
                <p className="font-bold text-foreground">{vol.full_name}</p>
                <p className="text-xs text-muted-foreground">{vol.id.slice(0, 8)}...</p>
              </div>
              <Badge variant="outline" className="border-brand-green/40 text-brand-green">
                {vol.role}
              </Badge>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No hay voluntarios registrados.
          </p>
        )}
      </div>
    </div>
  );
}
