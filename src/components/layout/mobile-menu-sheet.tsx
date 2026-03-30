"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";
import { SignOutButton } from "./sign-out-button";
import { useContextualMenuScroll } from "./use-contextual-menu-scroll";
import {
  getAccountShortcuts,
  getProfileRoleLabel,
  type AuthProfile,
} from "@/lib/auth/permissions";
import {
  isPublicNavActive,
  publicOverlaySections,
  publicOverlayUtilityLinks,
  publicRegistrationLinks,
} from "./public-navigation";
import { cn } from "@/lib/utils";

interface MobileMenuSheetProps {
  open: boolean;
  onClose: () => void;
  viewer: AuthProfile | null;
}

export function MobileMenuSheet({
  open,
  onClose,
  viewer,
}: MobileMenuSheetProps) {
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const accountShortcuts = useMemo(
    () => getAccountShortcuts(viewer),
    [viewer],
  );
  const overlaySectionHrefs = useMemo(
    () => publicOverlaySections.flatMap((section) => section.items.map((item) => item.href)),
    [],
  );
  const shortcutHrefSet = useMemo(
    () => new Set(accountShortcuts.map((shortcut) => shortcut.href)),
    [accountShortcuts],
  );
  const overlaySectionHrefSet = useMemo(
    () => new Set(overlaySectionHrefs),
    [overlaySectionHrefs],
  );
  const utilityTrackedHrefs = useMemo(
    () =>
      publicOverlayUtilityLinks
        .map((link) => link.href)
        .filter(
          (href) =>
            !shortcutHrefSet.has(href) && !overlaySectionHrefSet.has(href),
        ),
    [overlaySectionHrefSet, shortcutHrefSet],
  );
  const utilityTrackedHrefSet = useMemo(
    () => new Set(utilityTrackedHrefs),
    [utilityTrackedHrefs],
  );
  const trackedHrefs = useMemo(
    () => [
      ...accountShortcuts.map((shortcut) => shortcut.href),
      ...overlaySectionHrefs,
      ...utilityTrackedHrefs,
    ],
    [accountShortcuts, overlaySectionHrefs, utilityTrackedHrefs],
  );
  const activeHref = useMemo(
    () => trackedHrefs.find((href) => isPublicNavActive(pathname, href)) ?? null,
    [pathname, trackedHrefs],
  );
  const { scrollContainerRef, registerItemRef } = useContextualMenuScroll({
    open,
    activeHref,
  });

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      const closeButton = closeButtonRef.current;
      if (!closeButton) return;

      try {
        closeButton.focus({ preventScroll: true });
      } catch {}
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/72 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(124,199,167,0.12),_transparent_36%),linear-gradient(180deg,rgba(12,16,13,0.98),rgba(9,10,9,1))]"
      >
        <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-[calc(env(safe-area-inset-top)+0.85rem)]">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-[17rem]">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-brand-green/72">
                Gijon Throwdown
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                Menu
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Todo el evento en una capa clara: acceso, informacion general y
                atajos segun tu rol.
              </p>
            </div>

            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.05] text-white transition-colors active:bg-white/[0.08]"
              aria-label="Cerrar menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 rounded-[1.5rem] bg-white/[0.04] p-4">
            {viewer ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    {viewer.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{viewer.email}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-brand-green/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-brand-green">
                    {getProfileRoleLabel(viewer)}
                  </span>
                  <SignOutButton
                    label="Salir"
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white"
                  />
                </div>
                <div className="space-y-2">
                  {accountShortcuts.map((shortcut) => (
                    <Link
                      key={shortcut.href}
                      ref={registerItemRef(shortcut.href)}
                      data-menu-href={shortcut.href}
                      href={shortcut.href}
                      className="flex items-center justify-between rounded-[1.1rem] bg-black/20 px-4 py-3"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="text-sm font-medium text-white">
                          {shortcut.label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {shortcut.description}
                        </p>
                      </div>
                      <ArrowRight size={16} className="shrink-0 text-brand-green" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Acceso y registros
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Si ya formas parte del equipo operativo, entra con tu
                    usuario. Si no, deja tu solicitud y la organizacion la
                    revisara contigo.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Link
                    href="/auth/login"
                    className="flex items-center justify-between rounded-[1.1rem] bg-white/[0.08] px-4 py-3 text-sm font-medium text-white"
                  >
                    Entrar
                    <ArrowRight size={16} className="text-brand-green" />
                  </Link>
                  {publicRegistrationLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center justify-between rounded-[1.1rem] bg-black/20 px-4 py-3 text-sm text-white/88"
                    >
                      {link.label}
                      <ArrowRight size={16} className="text-brand-green" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-8">
            {publicOverlaySections.map((section) => (
              <section key={section.title}>
                <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  {section.title}
                </p>
                <div className="space-y-2">
                  {section.items.map((link) => {
                    const isActive = isPublicNavActive(pathname, link.href);

                    return (
                      <Link
                        key={link.href}
                        ref={registerItemRef(link.href)}
                        data-menu-href={link.href}
                        href={link.href}
                        className={cn(
                          "group flex items-center gap-4 rounded-[1.45rem] px-4 py-4 transition-colors",
                          isActive
                            ? "bg-white/[0.08]"
                            : "bg-white/[0.03] hover:bg-white/[0.05]",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-[1rem]",
                            isActive
                              ? "bg-brand-green/12 text-brand-green"
                              : "bg-black/20 text-white/88",
                          )}
                        >
                          <link.icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-medium text-white">
                            {link.label}
                          </p>
                          <p className="mt-1 text-sm leading-5 text-muted-foreground">
                            {link.description}
                          </p>
                        </div>
                        <ArrowRight
                          size={16}
                          className={cn(
                            "transition-transform group-hover:translate-x-0.5",
                            isActive ? "text-brand-green" : "text-muted-foreground",
                          )}
                        />
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-auto pt-8">
            <div className="rounded-[1.45rem] bg-white/[0.03] px-4 py-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Accesos directos
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {publicOverlayUtilityLinks.map((link) => (
                  <Link
                    key={link.href}
                    ref={
                      utilityTrackedHrefSet.has(link.href)
                        ? registerItemRef(link.href)
                        : undefined
                    }
                    data-menu-href={link.href}
                    href={link.href}
                    className="rounded-full bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/86"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
