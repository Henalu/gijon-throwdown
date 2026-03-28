import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: cat } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", slug)
    .single();
  return { title: cat?.name || "Categoria" };
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const { data: teams } = await supabase
    .from("teams")
    .select("*, athletes(*)")
    .eq("category_id", category.id)
    .eq("is_active", true)
    .order("seed_rank");

  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a12] to-background" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={16} />
            Inicio
          </Link>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-foreground">
            {category.name}
          </h1>
          <p className="text-muted-foreground text-lg mt-4">
            {category.description}
          </p>
          <Badge variant="outline" className="mt-4 border-brand-green/30 text-brand-green">
            Equipos de {category.team_size}
          </Badge>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Equipos ({teams?.length || 0})
          </h2>
          {teams && teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="p-6 rounded-xl bg-card border border-border"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center">
                      <Users className="text-brand-green" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">
                        {team.name}
                      </h3>
                      {team.box_name && (
                        <p className="text-sm text-muted-foreground">
                          {team.box_name}
                        </p>
                      )}
                    </div>
                  </div>
                  {team.city && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <MapPin size={12} />
                      {team.city}
                    </div>
                  )}
                  {team.athletes && team.athletes.length > 0 && (
                    <div className="space-y-2 mt-4 pt-4 border-t border-border">
                      {team.athletes
                        .sort(
                          (a: { sort_order: number }, b: { sort_order: number }) =>
                            a.sort_order - b.sort_order
                        )
                        .map(
                          (athlete: {
                            id: string;
                            first_name: string;
                            last_name: string;
                          }) => (
                            <div
                              key={athlete.id}
                              className="flex items-center gap-2"
                            >
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                {athlete.first_name[0]}
                              </div>
                              <span className="text-sm text-foreground">
                                {athlete.first_name} {athlete.last_name}
                              </span>
                            </div>
                          )
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Sin equipos todavia.</p>
          )}
        </div>
      </section>
    </div>
  );
}
