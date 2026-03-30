import type { ProtectedNavIconKey } from "@/components/layout/protected-nav-icons";

export interface AdminNavLink {
  href: string;
  label: string;
  description: string;
  icon: ProtectedNavIconKey;
}

const baseSidebarLinks: AdminNavLink[] = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "Resumen operativo, pendientes y accesos rapidos.",
    icon: "layoutDashboard",
  },
  {
    href: "/admin/evento",
    label: "Evento",
    description: "Datos base del evento, fechas, sede y configuracion.",
    icon: "calendar",
  },
  {
    href: "/admin/categorias",
    label: "Categorias",
    description: "Divisiones, orden y estructura de participacion.",
    icon: "users",
  },
  {
    href: "/admin/equipos",
    label: "Equipos",
    description: "Rosters, atletas y conversion de preinscripciones.",
    icon: "users",
  },
  {
    href: "/admin/personas",
    label: "Personas",
    description: "Registro canonico, vinculos e historial basico.",
    icon: "users",
  },
  {
    href: "/admin/wods",
    label: "WODs",
    description: "Pruebas, stages y estructura de score.",
    icon: "dumbbell",
  },
  {
    href: "/admin/heats",
    label: "Heats",
    description: "Series, horarios y entrada live habilitada.",
    icon: "timer",
  },
  {
    href: "/admin/puntuaciones",
    label: "Puntuaciones",
    description: "Borradores oficiales antes de validacion.",
    icon: "trophy",
  },
  {
    href: "/admin/validacion",
    label: "Validacion",
    description: "Revision oficial antes de publicar resultados.",
    icon: "shieldCheck",
  },
  {
    href: "/admin/patrocinadores",
    label: "Sponsors",
    description: "Marcas, tiers y presencia en la web del evento.",
    icon: "megaphone",
  },
  {
    href: "/admin/voluntarios",
    label: "Voluntarios",
    description: "Solicitudes, asignaciones y operativa de staff.",
    icon: "userCheck",
  },
  {
    href: "/admin/streaming",
    label: "Streaming",
    description: "Embeds, sesiones publicas y directo.",
    icon: "video",
  },
  {
    href: "/admin/media",
    label: "Media",
    description: "Galeria, descargas y compra por imagen.",
    icon: "images",
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    description: "Roles, accesos e invitaciones internas.",
    icon: "users",
  },
];

export function getAdminSidebarLinks({
  isSuperadmin,
  canValidateScores,
}: {
  isSuperadmin: boolean;
  canValidateScores: boolean;
}) {
  return baseSidebarLinks.filter((link) => {
    if (link.href === "/admin/usuarios") return isSuperadmin;
    if (link.href === "/admin/validacion") return canValidateScores;
    return true;
  });
}
