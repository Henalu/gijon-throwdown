"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { MobileMenuSheet } from "./mobile-menu-sheet";
import { SignOutButton } from "./sign-out-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getAccountShortcuts,
  getProfileRoleLabel,
  type AuthProfile,
} from "@/lib/auth/permissions";
import {
  isPublicNavActive,
  publicDesktopPrimaryNav,
  publicDesktopSecondaryNav,
  publicRegistrationLinks,
} from "./public-navigation";
import { cn } from "@/lib/utils";

function getViewerInitials(fullName: string | null | undefined) {
  if (!fullName) return "GT";

  const parts = fullName
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "GT";
}

function DesktopAccountMenu({ viewer }: { viewer: AuthProfile }) {
  const shortcuts = getAccountShortcuts(viewer);
  const initials = getViewerInitials(viewer.full_name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-2 text-left text-white transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold uppercase tracking-[0.18em] text-white/90">
          {initials}
        </span>
        <div className="hidden min-w-0 xl:block">
          <p className="truncate text-sm font-medium text-white">Mi cuenta</p>
          <p className="truncate text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-white/46">
            {getProfileRoleLabel(viewer)}
          </p>
        </div>
        <ChevronDown size={16} className="text-white/58" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[22rem] min-w-[22rem] rounded-[1.5rem] border border-white/10 bg-[#0d100f]/96 p-2 text-white shadow-[0_22px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
      >
        <div className="rounded-[1.15rem] border border-white/8 bg-white/[0.04] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-green/14 text-sm font-bold uppercase tracking-[0.18em] text-brand-green">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {viewer.full_name}
              </p>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {viewer.email}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="rounded-full border border-white/8 bg-black/20 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/72">
              {getProfileRoleLabel(viewer)}
            </span>
            <p className="text-xs text-muted-foreground">
              Accesos segun tu perfil
            </p>
          </div>
        </div>

        <div className="mt-2 space-y-1">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="block rounded-[1rem] px-4 py-3 transition-colors hover:bg-white/[0.05]"
            >
              <p className="text-sm font-medium text-white">{shortcut.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {shortcut.description}
              </p>
            </Link>
          ))}
        </div>

        <DropdownMenuSeparator className="bg-white/8" />

        <div className="p-2 pt-1">
          <SignOutButton
            label="Salir"
            variant="ghost"
            size="sm"
            className="w-full justify-center rounded-full bg-white/[0.04] text-white/82 hover:bg-white/[0.08] hover:text-white"
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar({ viewer }: { viewer: AuthProfile | null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const hasViewer = useMemo(() => Boolean(viewer), [viewer]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/6 bg-background/82 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 lg:gap-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 md:max-w-[17.5rem] xl:max-w-[23rem]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[1.15rem] bg-white/[0.05] text-sm font-black uppercase tracking-[0.18em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              GT
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-brand-green/75">
                Gijon Throwdown
              </p>
              <p className="hidden truncate text-sm font-medium text-white/82 xl:block">
                Competicion, live y leaderboard en un solo sitio
              </p>
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
            <div className="flex items-center gap-4 xl:gap-6">
              {publicDesktopPrimaryNav.map((link) => {
                const isActive = isPublicNavActive(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative py-2 text-sm font-medium transition-colors",
                      isActive ? "text-white" : "text-muted-foreground hover:text-white/90",
                    )}
                  >
                    {link.label}
                    <span
                      className={cn(
                        "absolute inset-x-0 -bottom-[1.05rem] h-px origin-left bg-brand-green transition-transform",
                        isActive ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-3 md:flex">
            {publicDesktopSecondaryNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-white/90"
              >
                {link.label}
              </Link>
            ))}

            {hasViewer && viewer ? (
              <div className="ml-2 flex items-center border-l border-white/8 pl-4">
                <DesktopAccountMenu viewer={viewer} />
              </div>
            ) : (
              <div className="ml-2 flex items-center gap-3 border-l border-white/8 pl-3">
                {publicRegistrationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/auth/login"
                  className="rounded-full bg-white/[0.06] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/[0.09]"
                >
                  Entrar
                </Link>
              </div>
            )}
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.05] text-white transition-colors active:bg-white/[0.08] md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </nav>

      <MobileMenuSheet open={menuOpen} onClose={closeMenu} viewer={viewer} />
    </>
  );
}
