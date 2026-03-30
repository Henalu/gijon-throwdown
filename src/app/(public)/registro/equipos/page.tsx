import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";
import { TeamRegistrationForm } from "./team-registration-form";

export default async function RegistroEquiposPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_team", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
        <section className="rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 md:p-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
            Registro equipos
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white md:text-4xl">
            Preinscribe a tu equipo para la proxima edicion
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
            Completa la preinscripcion del equipo entero en un solo paso. El
            formato actual es de 4 personas por equipo, con 1 chica y 3
            chicos. La primera persona del formulario quedara como responsable
            de contacto. En esta fase no se crean cuentas automaticas:
            recogemos la informacion, la revisamos y despues decidimos el
            siguiente paso.
          </p>

          <div className="mt-8 space-y-3">
            <div className="rounded-[1.35rem] bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Formato actual</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                4 personas por equipo con composicion obligatoria de 1 chica y
                3 chicos.
              </p>
            </div>
            <div className="rounded-[1.35rem] bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Despues del envio</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                La preinscripcion queda pendiente hasta que la organizacion la
                revise. No genera plazas confirmadas de forma automatica.
              </p>
            </div>
          </div>
        </section>

        <TeamRegistrationForm categories={(categories ?? []) as Category[]} />
      </div>
    </div>
  );
}
