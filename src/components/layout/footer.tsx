import Link from "next/link";
import { Camera } from "lucide-react";
import { legalDocumentLinks } from "@/lib/legal-content";

const socialLinks = [
  {
    href: "https://www.instagram.com/gijonthrowdown/",
    label: "Instagram",
    icon: Camera,
  },
] as const;

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden border-t border-white/6 bg-background/86 md:block">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-lg">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-brand-green/72">
              Gijon Throwdown
            </p>
            <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">
              Una sola plataforma para seguir la competicion, el directo y la
              clasificacion oficial del evento.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              La capa publica y la operativa ya conviven en el mismo entorno:
              seguimiento, acceso por rol y registros controlados sin perder el
              tono del evento.
            </p>
          </div>

          <div className="space-y-6 lg:max-w-xl">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Legal
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
                {legalDocumentLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Comunidad
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {socialLinks.map((link) => {
                    const Icon = link.icon;

                    return (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={link.label}
                        className="inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/78 transition-colors hover:bg-white/[0.07] hover:text-white"
                      >
                        <Icon size={18} />
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="text-sm text-muted-foreground sm:text-right">
                <p>gijonthrowdown@gmail.com</p>
                <p className="mt-1">(c) {currentYear} Gijon Throwdown</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
