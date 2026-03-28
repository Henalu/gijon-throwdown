import { createClient } from "@/lib/supabase/server";
import { CountdownTimer } from "@/components/home/countdown-timer";
import { SponsorGrid } from "@/components/sponsors/sponsor-grid";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Users,
  Dumbbell,
  Trophy,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("event_config")
    .select("*")
    .single();

  const { data: categories } = await supabase
    .from("categories")
    .select("*, teams(count)")
    .order("sort_order");

  const { data: workouts } = await supabase
    .from("workouts")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order")
    .limit(3);

  const { data: sponsors } = await supabase
    .from("sponsors")
    .select("*, sponsor_slots(*)")
    .eq("is_active", true)
    .order("sort_order");

  const eventDate = event?.date || "2026-06-20";

  return (
    <div className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative flex items-center justify-center min-h-[90vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#061a12] to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-brand-green)_0%,_transparent_60%)] opacity-10" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-green/30 to-transparent" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <Badge
            variant="outline"
            className="mb-6 border-brand-green/30 text-brand-green bg-brand-green/5 px-4 py-1"
          >
            {event?.location || "Gijon, Asturias"}
          </Badge>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-none mb-6">
            <span className="text-white">Gijon</span>
            <br />
            <span className="bg-gradient-to-r from-brand-green to-brand-cyan bg-clip-text text-transparent">
              Throwdown
            </span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
            {event?.description}
          </p>

          <div className="mb-12">
            <CountdownTimer targetDate={eventDate} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/wods"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-green text-black font-bold rounded-lg hover:bg-brand-green/90 transition-all duration-200 text-lg hover:scale-105"
            >
              Ver WODs
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/clasificacion"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white font-bold rounded-lg hover:bg-white/5 transition-all duration-200 text-lg"
            >
              Clasificacion
            </Link>
          </div>
        </div>
      </section>

      {/* ===== INFO EVENTO ===== */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border">
              <div className="p-3 rounded-lg bg-brand-green/10">
                <Calendar className="text-brand-green" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Fecha</h3>
                <p className="text-muted-foreground text-sm">
                  {event?.date
                    ? new Date(event.date).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Proximamente"}
                  {event?.end_date && (
                    <>
                      {" - "}
                      {new Date(event.end_date).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                      })}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border">
              <div className="p-3 rounded-lg bg-brand-green/10">
                <MapPin className="text-brand-green" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Ubicacion</h3>
                <p className="text-muted-foreground text-sm">
                  {event?.venue_name}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {event?.venue_address}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border">
              <div className="p-3 rounded-lg bg-brand-green/10">
                <Users className="text-brand-green" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Categorias</h3>
                <p className="text-muted-foreground text-sm">
                  {categories?.map((c) => c.name).join(", ")}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Equipos de 2 personas
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WODs PREVIEW ===== */}
      {workouts && workouts.length > 0 && (
        <section className="py-20 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground">
                  WODs
                </h2>
                <p className="text-muted-foreground mt-2">
                  Los entrenamientos de la competicion
                </p>
              </div>
              <Link
                href="/wods"
                className="hidden md:inline-flex items-center gap-2 text-brand-green hover:text-brand-green/80 font-medium transition-colors"
              >
                Ver todos
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workouts.map((wod) => (
                <Link
                  key={wod.id}
                  href={`/wods/${wod.slug}`}
                  className="group relative p-6 rounded-xl bg-card border border-border hover:border-brand-green/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-brand-green/10 group-hover:bg-brand-green/20 transition-colors">
                      <Dumbbell className="text-brand-green" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">
                        {wod.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="text-xs border-brand-green/30 text-brand-green"
                        >
                          {wod.wod_type.replace("_", " ").toUpperCase()}
                        </Badge>
                        {wod.time_cap_seconds && (
                          <Badge variant="outline" className="text-xs">
                            {Math.floor(wod.time_cap_seconds / 60)} min
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-3 whitespace-pre-line">
                    {wod.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-sm text-brand-green opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver detalle <ArrowRight size={14} />
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href="/wods"
              className="md:hidden mt-6 inline-flex items-center gap-2 text-brand-green font-medium"
            >
              Ver todos los WODs <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      {/* ===== CATEGORIAS ===== */}
      {categories && categories.length > 0 && (
        <section className="py-20 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground mb-10">
              Categorias
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categorias/${cat.slug}`}
                  className="group p-6 rounded-xl bg-card border border-border hover:border-brand-green/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Trophy className="text-brand-green" size={20} />
                    <h3 className="text-xl font-bold text-foreground">
                      {cat.name}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    {cat.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">
                      Equipos de {cat.team_size}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== SPONSORS ===== */}
      {sponsors && sponsors.length > 0 && (
        <section className="py-16 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-center text-muted-foreground text-sm tracking-[0.25em] uppercase mb-10">
              Patrocinadores
            </h2>
            <SponsorGrid sponsors={sponsors} />
          </div>
        </section>
      )}
    </div>
  );
}
