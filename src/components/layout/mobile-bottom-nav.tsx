"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isPublicNavActive, publicBottomTabs } from "./public-navigation";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div className="mx-auto max-w-xl px-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]">
        <div className="pointer-events-auto rounded-[1.7rem] bg-[linear-gradient(180deg,rgba(22,25,22,0.96),rgba(13,15,13,0.98))] p-2 shadow-[0_-20px_45px_rgba(0,0,0,0.4)] ring-1 ring-white/8 backdrop-blur-2xl">
          <div className="grid min-h-[4.45rem] grid-cols-4 gap-1">
            {publicBottomTabs.map((tab) => {
              const isActive = isPublicNavActive(pathname, tab.href);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-[1.2rem] px-2 transition-colors",
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-muted-foreground active:bg-white/[0.04]"
                  )}
                >
                  <tab.icon
                    size={18}
                    strokeWidth={isActive ? 2.3 : 1.85}
                    className={isActive ? "text-brand-green" : undefined}
                  />
                  <span className="text-[11px] font-semibold leading-tight">
                    {tab.shortLabel ?? tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
