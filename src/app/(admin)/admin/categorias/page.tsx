import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";
import { CategoriasClient } from "./categorias-client";

export default async function CategoriasPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold">Categorias</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gestiona las categorias de competicion
      </p>
      <div className="mt-6">
        <CategoriasClient categories={(categories ?? []) as Category[]} />
      </div>
    </div>
  );
}
