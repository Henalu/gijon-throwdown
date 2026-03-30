"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminSidebarLinks } from "@/components/layout/admin-navigation";
import { protectedNavIcons } from "@/components/layout/protected-nav-icons";

export function AdminSidebar({
  isSuperadmin,
  canValidateScores,
}: {
  isSuperadmin: boolean;
  canValidateScores: boolean;
}) {
  const pathname = usePathname();
  const sidebarLinks = getAdminSidebarLinks({
    isSuperadmin,
    canValidateScores,
  });

  return (
    <aside className="w-64 border-r border-border bg-sidebar-background flex flex-col shrink-0 hidden md:flex">
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={16} />
          Volver al sitio
        </Link>
        <h2 className="mt-3 text-lg font-bold text-foreground">Admin Panel</h2>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {sidebarLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/admin" && pathname.startsWith(link.href));
          const Icon = protectedNavIcons[link.icon];
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
