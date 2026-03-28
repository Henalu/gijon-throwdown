import { createClient } from "@/lib/supabase/server";
import type { Category, Team } from "@/types";
import { EquiposClient } from "./equipos-client";

export default async function EquiposPage() {
  const supabase = await createClient();

  const [{ data: teams }, { data: categories }] = await Promise.all([
    supabase
      .from("teams")
      .select("*, categories(name)")
      .order("name", { ascending: true }),
    supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Equipos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gestiona los equipos participantes
      </p>
      <div className="mt-6">
        <EquiposClient
          teams={(teams ?? []) as TeamWithCategory[]}
          categories={(categories ?? []) as Category[]}
        />
      </div>
    </div>
  );
}

type TeamWithCategory = Team & {
  categories: { name: string } | null;
};
