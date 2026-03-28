"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { MobileMenuSheet } from "./mobile-menu-sheet";
import {
  isPublicNavActive,
  publicDesktopPrimaryNav,
  publicDesktopSecondaryNav,
  publicSecondaryNav,
} from "./public-navigation";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const currentSection = useMemo(() => {
    const allItems = [...publicDesktopPrimaryNav, ...publicSecondaryNav];
    return allItems.find((item) => isPublicNavActive(pathname, item.href));
  }, [pathname]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/6 bg-background/82 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[1.15rem] bg-white/[0.05] text-sm font-black uppercase tracking-[0.18em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              GT
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-brand-green/75">
                Gijon Throwdown
              </p>
              <p className="truncate text-sm font-medium text-white/86">
                {currentSection?.label ?? "Inicio"}
              </p>
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
            <div className="flex items-center gap-6">
              {publicDesktopPrimaryNav.map((link) => {
                const isActive = isPublicNavActive(pathname, link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative py-2 text-sm font-medium transition-colors",
                      isActive ? "text-white" : "text-muted-foreground hover:text-white/90"
                    )}
                  >
                    {link.label}
                    <span
                      className={cn(
                        "absolute inset-x-0 -bottom-[1.05rem] h-px origin-left bg-brand-green transition-transform",
                        isActive ? "scale-x-100" : "scale-x-0"
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden items-center gap-5 md:flex">
            {publicDesktopSecondaryNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-white/90"
              >
                {link.label}
              </Link>
            ))}
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

      <MobileMenuSheet open={menuOpen} onClose={closeMenu} />
    </>
  );
}
