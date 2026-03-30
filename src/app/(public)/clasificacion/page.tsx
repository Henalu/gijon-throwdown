import type { Metadata } from "next";
import { Medal, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Clasificacion",
  description: "Clasificacion oficial y resultados validados de la competicion",
};

const podiumTone: Record<number, string> = {
  1: "bg-[rgba(165,132,38,0.15)] text-yellow-200",
  2: "bg-[rgba(182,188,194,0.12)] text-slate-200",
  3: "bg-[rgba(183,102,49,0.14)] text-orange-200",
};

export default async function ClasificacionPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: leaderboard }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("leaderboard").select("*"),
  ]);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-white/6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(120,199,167,0.11),_transparent_42%),linear-gradient(180deg,rgba(14,16,14,1),rgba(13,15,13,1))]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:pb-14 sm:pt-14">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-brand-green/74">
              Clasificacion
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-white sm:text-6xl">
              Clasificacion oficial del evento.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
              Aqui se consolidan los resultados validados y la posicion oficial
              de cada equipo dentro de su categoria, en un formato de 4
              personas con 1 chica y 3 chicos por equipo.
            </p>
          </div>
        </div>
      </section>

      {categories && categories.length > 0 ? (
        <>
          <section className="sticky top-16 z-20 bg-background/88 backdrop-blur-2xl">
            <div className="scrollbar-none mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`#category-${category.slug}`}
                  className="whitespace-nowrap rounded-full bg-white/[0.04] px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-white"
                >
                  {category.name}
                </a>
              ))}
            </div>
          </section>

          <section className="px-4 py-10 sm:py-12">
            <div className="mx-auto max-w-7xl space-y-12">
              {categories.map((category) => {
                const entries = (leaderboard || [])
                  .filter((entry) => entry.category_id === category.id)
                  .sort(
                    (a: { rank: number }, b: { rank: number }) => a.rank - b.rank
                  );

                const podium = entries.slice(0, 3);
                const rest = entries.slice(3);

                return (
                  <section
                    key={category.id}
                    id={`category-${category.slug}`}
                    className="scroll-mt-28"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
                          Categoria
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
                          {category.name}
                        </h2>
                      </div>
                      <Trophy className="mt-1 text-brand-green" size={18} />
                    </div>

                    {entries.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid gap-3 lg:grid-cols-3">
                          {podium.map(
                            (entry: {
                              team_id: string;
                              rank: number;
                              team_name: string;
                              box_name: string | null;
                              total_points: number;
                            }) => (
                              <div
                                key={entry.team_id}
                                className={`rounded-[1.7rem] px-5 py-5 ring-1 ring-white/7 ${podiumTone[entry.rank] || "bg-white/[0.03] text-white"}`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <Medal size={16} />
                                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em]">
                                      Puesto {entry.rank}
                                    </span>
                                  </div>
                                  <span className="text-xl font-semibold tabular-nums">
                                    {entry.total_points}
                                  </span>
                                </div>
                                <p className="mt-5 text-xl font-medium text-white">
                                  {entry.team_name}
                                </p>
                                <p className="mt-2 text-sm text-white/68">
                                  {entry.box_name || "Box por confirmar"}
                                </p>
                              </div>
                            )
                          )}
                        </div>

                        <div className="rounded-[1.8rem] bg-white/[0.03] ring-1 ring-white/7">
                          {rest.length > 0 ? (
                            <div className="divide-y divide-white/7">
                              {rest.map(
                                (entry: {
                                  team_id: string;
                                  rank: number;
                                  team_name: string;
                                  box_name: string | null;
                                  total_points: number;
                                }) => (
                                  <div
                                    key={entry.team_id}
                                    className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 px-4 py-4 sm:px-5"
                                  >
                                    <div className="text-sm font-semibold text-muted-foreground">
                                      {entry.rank}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-white sm:text-base">
                                        {entry.team_name}
                                      </p>
                                      <p className="mt-1 truncate text-xs text-muted-foreground">
                                        {entry.box_name || "Box por confirmar"}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-semibold tabular-nums text-white">
                                        {entry.total_points}
                                      </p>
                                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                                        pts
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="px-5 py-6 text-sm leading-6 text-muted-foreground">
                              En cuanto haya mas resultados validados, esta
                              clasificacion se completara automaticamente.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[1.7rem] bg-white/[0.03] px-5 py-6 text-sm leading-6 text-muted-foreground ring-1 ring-white/7">
                        Todavia no hay resultados publicados para esta
                        categoria. Los puestos apareceran aqui una vez se validen.
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <section className="px-4 py-16">
          <div className="mx-auto max-w-4xl rounded-[1.9rem] bg-white/[0.03] px-5 py-10 text-center ring-1 ring-white/7">
            <p className="text-xl font-medium text-white">
              Las categorias todavia no estan publicadas.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              En cuanto se publiquen, veras aqui la clasificacion oficial por
              categorias y puestos.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
