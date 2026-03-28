"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Dumbbell,
  Timer,
  Trophy,
  Megaphone,
  UserCheck,
  Video,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/evento", label: "Evento", icon: Calendar },
  { href: "/admin/categorias", label: "Categorias", icon: Users },
  { href: "/admin/equipos", label: "Equipos", icon: Users },
  { href: "/admin/wods", label: "WODs", icon: Dumbbell },
  { href: "/admin/heats", label: "Heats", icon: Timer },
  { href: "/admin/puntuaciones", label: "Puntuaciones", icon: Trophy },
  { href: "/admin/patrocinadores", label: "Sponsors", icon: Megaphone },
  { href: "/admin/voluntarios", label: "Voluntarios", icon: UserCheck },
  { href: "/admin/streaming", label: "Streaming", icon: Video },
];

export function AdminSidebar() {
  const pathname = usePathname();

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
          const Icon = link.icon;
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
