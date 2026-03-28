import Link from "next/link";

export function Footer() {
  return (
    <footer className="hidden border-t border-white/6 bg-background/86 md:block">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-lg">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
              Gijon Throwdown
            </p>
            <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">
              Una sola plataforma para seguir la competicion, el directo y la
              clasificacion oficial del evento.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Gijon Throwdown es esfuerzo, dedicacion, caracter y comunidad.
              Esta version concentra la informacion publica y la capa live en un
              entorno mas claro, moderno y facil de seguir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <Link href="/directo" className="transition-colors hover:text-white">
              Directo
            </Link>
            <Link href="/clasificacion" className="transition-colors hover:text-white">
              Clasificacion
            </Link>
            <Link href="/horarios" className="transition-colors hover:text-white">
              Horarios
            </Link>
            <Link href="/faq" className="transition-colors hover:text-white">
              FAQ
            </Link>
            <Link href="/patrocinadores" className="transition-colors hover:text-white">
              Partners
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
