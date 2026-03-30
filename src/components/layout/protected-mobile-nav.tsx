"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { SignOutButton } from "./sign-out-button";
import { useContextualMenuScroll } from "./use-contextual-menu-scroll";
import {
  getAccountShortcuts,
  getProfileRoleLabel,
  type AuthProfile,
} from "@/lib/auth/permissions";
import {
  protectedNavIcons,
  type ProtectedNavIconKey,
} from "@/components/layout/protected-nav-icons";
import { cn } from "@/lib/utils";

export interface ProtectedMobileNavLink {
  href: string;
  label: string;
  description: string;
  icon?: ProtectedNavIconKey;
}

interface ProtectedMobileNavProps {
  title: string;
  viewer: AuthProfile;
  primaryLinks: ProtectedMobileNavLink[];
  siteLinks: ProtectedMobileNavLink[];
  homeHref?: string;
}

function matchesPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProtectedMobileNav({
  title,
  viewer,
  primaryLinks,
  siteLinks,
  homeHref = "/",
}: ProtectedMobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const accountShortcuts = useMemo(() => {
    const reservedHrefs = new Set([
      ...primaryLinks.map((link) => link.href),
      ...siteLinks.map((link) => link.href),
    ]);

    return getAccountShortcuts(viewer).filter(
      (shortcut) => !reservedHrefs.has(shortcut.href),
    );
  }, [primaryLinks, siteLinks, viewer]);
  const trackedHrefs = useMemo(
    () => [
      ...accountShortcuts.map((shortcut) => shortcut.href),
      ...primaryLinks.map((link) => link.href),
      ...siteLinks.map((link) => link.href),
    ],
    [accountShortcuts, primaryLinks, siteLinks],
  );
  const activeHref = useMemo(
    () =>
      trackedHrefs
        .filter((href) => matchesPath(pathname, href))
        .sort((left, right) => right.length - left.length)[0] ?? null,
    [pathname, trackedHrefs],
  );
  const { scrollContainerRef, registerItemRef } = useContextualMenuScroll({
    open,
    activeHref,
  });

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
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-white/8 bg-background/88 px-4 backdrop-blur-xl md:hidden">
        <Link href={homeHref} className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[1rem] bg-white/[0.05] text-xs font-black uppercase tracking-[0.18em] text-white">
            GT
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{title}</p>
            <p className="truncate text-[0.68rem] uppercase tracking-[0.22em] text-white/48">
              {getProfileRoleLabel(viewer)}
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Abrir menu de ${title.toLowerCase()}`}
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white transition-colors active:bg-white/[0.08]"
        >
          <Menu size={18} />
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[80] md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/72 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div
            ref={scrollContainerRef}
            className="absolute inset-0 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(80,195,166,0.12),_transparent_38%),linear-gradient(180deg,rgba(12,16,13,0.98),rgba(9,10,9,1))]"
          >
            <div className="mx-auto flex min-h-full max-w-2xl flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-[calc(env(safe-area-inset-top)+0.85rem)]">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-[17rem]">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-brand-green/72">
                    Gijon Throwdown
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                    {title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Navegacion interna clara para moverte sin quedarte atrapado
                    dentro de la operativa.
                  </p>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.05] text-white transition-colors active:bg-white/[0.08]"
                  aria-label="Cerrar menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 rounded-[1.5rem] bg-white/[0.04] p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    {viewer.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{viewer.email}</p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
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

                {accountShortcuts.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {accountShortcuts.map((shortcut) => (
                      <Link
                        key={shortcut.href}
                        ref={registerItemRef(shortcut.href)}
                        data-menu-href={shortcut.href}
                        href={shortcut.href}
                        onClick={() => setOpen(false)}
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
                ) : null}
              </div>

              <div className="mt-8 space-y-8">
                <section>
                  <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    Navegacion interna
                  </p>
                  <div className="space-y-2">
                    {primaryLinks.map((link) => {
                      const isActive = activeHref === link.href;
                      const Icon = link.icon
                        ? protectedNavIcons[link.icon]
                        : null;

                      return (
                        <Link
                          key={link.href}
                          ref={registerItemRef(link.href)}
                          data-menu-href={link.href}
                          href={link.href}
                          onClick={() => setOpen(false)}
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
                            {Icon ? <Icon size={18} /> : <ArrowRight size={16} />}
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

                <section>
                  <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                    Salir a la web
                  </p>
                  <div className="space-y-2">
                    {siteLinks.map((link) => {
                      const isActive = activeHref === link.href;
                      const Icon = link.icon
                        ? protectedNavIcons[link.icon]
                        : null;

                      return (
                        <Link
                          key={link.href}
                          ref={registerItemRef(link.href)}
                          data-menu-href={link.href}
                          href={link.href}
                          onClick={() => setOpen(false)}
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
                            {Icon ? <Icon size={18} /> : <ArrowRight size={16} />}
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
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
