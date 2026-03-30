import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { legalDocumentLinks, type LegalDocument } from "@/lib/legal-content";
import { cn } from "@/lib/utils";

type LegalPageShellProps = {
  document: LegalDocument;
  currentHref: string;
};

export function LegalPageShell({
  document,
  currentHref,
}: LegalPageShellProps) {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden border-b border-white/6 px-4 py-12 sm:py-18">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(80,195,166,0.14),_transparent_42%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_65%)]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-brand-green/80">
              {document.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl md:text-6xl">
              {document.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {document.intro}
            </p>
            <p className="mt-4 text-sm text-white/58">
              Ultima actualizacion orientativa: {document.updatedAt}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {legalDocumentLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  currentHref === link.href
                    ? "border-brand-green/30 bg-brand-green/12 text-white"
                    : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-white/18 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:py-14">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(18rem,0.22fr)]">
          <div className="space-y-5">
            {document.sections.map((section) => (
              <article
                key={section.title}
                className="rounded-[1.6rem] border border-white/8 bg-white/[0.02] p-6 sm:p-7"
              >
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
                  {section.title}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-4 text-sm leading-7 text-muted-foreground sm:text-[0.96rem]"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground sm:text-[0.96rem]">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-[0.62rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green/70" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-[1.6rem] border border-white/8 bg-white/[0.02] p-6">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              En corto
            </p>
            <p className="mt-4 text-lg font-semibold tracking-[-0.03em] text-white">
              {document.description}
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Esta capa legal ya vive dentro de la web para que la experiencia
              del evento no te mande fuera a mitad de camino.
            </p>

            <div className="mt-8 rounded-2xl border border-white/8 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">Contacto legal</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                administracion@tajalapizeventssl.es
              </p>
              <a
                href="mailto:administracion@tajalapizeventssl.es"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white transition-colors hover:text-brand-green"
              >
                Escribir a administracion
                <ArrowUpRight size={15} />
              </a>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
