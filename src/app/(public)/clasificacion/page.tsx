import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clasificacion",
  description: "Leaderboard y resultados de la competicion",
};

export default async function ClasificacionPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  const { data: leaderboard } = await supabase
    .from("leaderboard")
    .select("*");

  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061a12] to-background" />
        <div className="relative z-10 max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-foreground">
            Clasificacion
          </h1>
          <p className="text-muted-foreground text-lg mt-4">
            Resultados en vivo y ranking general por categorias.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          {categories && categories.length > 0 ? (
            <div className="space-y-12">
              {categories.map((cat) => {
                const entries = (leaderboard || [])
                  .filter((e) => e.category_id === cat.id)
                  .sort(
                    (a: { rank: number }, b: { rank: number }) =>
                      a.rank - b.rank
                  );

                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-3 mb-6">
                      <Trophy className="text-brand-green" size={24} />
                      <h2 className="text-2xl font-bold text-foreground">
                        {cat.name}
                      </h2>
                    </div>

                    {entries.length > 0 ? (
                      <div className="space-y-3">
                        {entries.map(
                          (entry: {
                            team_id: string;
                            rank: number;
                            team_name: string;
                            box_name: string | null;
                            total_points: number;
                          }) => {
                            const isTop3 = entry.rank <= 3;
                            const medalColors: Record<number, string> = {
                              1: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
                              2: "text-gray-300 bg-gray-300/10 border-gray-300/30",
                              3: "text-orange-500 bg-orange-500/10 border-orange-500/30",
                            };

                            return (
                              <div
                                key={entry.team_id}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                                  isTop3
                                    ? medalColors[entry.rank] || "bg-card border-border"
                                    : "bg-card border-border"
                                }`}
                              >
                                <div
                                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                                    isTop3
                                      ? ""
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {entry.rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-foreground">
                                    {entry.team_name}
                                  </p>
                                  {entry.box_name && (
                                    <p className="text-xs text-muted-foreground">
                                      {entry.box_name}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-black text-foreground tabular-nums">
                                    {entry.total_points}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    pts
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm p-4 bg-card rounded-xl border border-border">
                        Sin resultados publicados todavia.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-20">
              Las categorias se publicaran pronto.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
