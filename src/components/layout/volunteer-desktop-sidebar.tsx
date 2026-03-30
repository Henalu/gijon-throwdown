"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { protectedNavIcons } from "@/components/layout/protected-nav-icons";
import type { ProtectedMobileNavLink } from "@/components/layout/protected-mobile-nav";
import type { AuthProfile } from "@/lib/auth/permissions";
import { getProfileRoleLabel } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

function matchesPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function VolunteerDesktopSidebar({
  title,
  viewer,
  primaryLinks,
  siteLinks,
}: {
  title: string;
  viewer: AuthProfile;
  primaryLinks: ProtectedMobileNavLink[];
  siteLinks: ProtectedMobileNavLink[];
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-sidebar-background md:flex">
      <div className="border-b border-border p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft size={16} />
          Volver al sitio
        </Link>

        <div className="mt-4 min-w-0 overflow-hidden rounded-[1.4rem] border border-white/8 bg-black/20 p-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-brand-green/80">
            {title}
          </p>
          <p className="mt-3 min-w-0 break-words text-lg font-semibold tracking-[-0.04em] text-white [overflow-wrap:anywhere]">
            {viewer.full_name}
          </p>
          <p className="mt-1 min-w-0 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
            {viewer.email}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
        </div>
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto p-4">
        <section>
          <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Operativa
          </p>
          <div className="space-y-2">
            {primaryLinks.map((link) => {
              const Icon = link.icon ? protectedNavIcons[link.icon] : null;
              const isActive = matchesPath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group flex items-center gap-4 rounded-[1.2rem] px-4 py-4 transition-colors",
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
                    {Icon ? <Icon size={18} /> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-white [overflow-wrap:anywhere]">
                      {link.label}
                    </p>
                    <p className="mt-1 break-words text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]">
                      {link.description}
                    </p>
                  </div>
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
              const Icon = link.icon ? protectedNavIcons[link.icon] : null;
              const isActive = matchesPath(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group flex items-center gap-4 rounded-[1.2rem] px-4 py-4 transition-colors",
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
                    {Icon ? <Icon size={18} /> : null}
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-white [overflow-wrap:anywhere]">
                      {link.label}
                    </p>
                    <p className="mt-1 break-words text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]">
                      {link.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </nav>
    </aside>
  );
}
