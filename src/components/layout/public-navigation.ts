import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Dumbbell,
  Handshake,
  HelpCircle,
  Home,
  Images,
  Radio,
  Trophy,
} from "lucide-react";

export interface PublicNavItem {
  href: string;
  label: string;
  shortLabel?: string;
  description: string;
  icon: LucideIcon;
}

export const publicPrimaryNav: PublicNavItem[] = [
  {
    href: "/directo",
    label: "Directo",
    description: "Heat activo, stream y estado del evento.",
    icon: Radio,
  },
  {
    href: "/horarios",
    label: "Horarios",
    description: "Programa de heats y bloques del dia.",
    icon: CalendarDays,
  },
  {
    href: "/clasificacion",
    label: "Clasificacion",
    shortLabel: "Ranking",
    description: "Leaderboard oficial y resultados publicados.",
    icon: Trophy,
  },
  {
    href: "/wods",
    label: "WODs",
    description: "Pruebas, standards y formatos de score.",
    icon: Dumbbell,
  },
];

export const publicSecondaryNav: PublicNavItem[] = [
  {
    href: "/",
    label: "Inicio",
    description: "Resumen del evento y accesos generales.",
    icon: Home,
  },
  {
    href: "/patrocinadores",
    label: "Partners",
    description: "Marcas y colaboradores que hacen posible el evento.",
    icon: Handshake,
  },
  {
    href: "/galeria",
    label: "Galeria",
    description: "Fotos oficiales para ver, descargar o comprar desde la web.",
    icon: Images,
  },
  {
    href: "/faq",
    label: "FAQ",
    description: "Preguntas frecuentes y dudas practicas.",
    icon: HelpCircle,
  },
];

export const publicDesktopPrimaryNav = publicPrimaryNav;
export const publicDesktopSecondaryNav = publicSecondaryNav.filter(
  (item) => item.href !== "/"
);
export const publicBottomTabs = publicPrimaryNav;

export const publicOverlaySections = [
  {
    title: "Explora la web",
    items: publicSecondaryNav,
  },
] as const;

export const publicOverlayUtilityLinks = [
  { href: "/directo", label: "Directo" },
  { href: "/horarios", label: "Horarios" },
  { href: "/clasificacion", label: "Ranking" },
  { href: "/wods", label: "WODs" },
  { href: "/galeria", label: "Galeria" },
] as const;

export const publicRegistrationLinks = [
  { href: "/registro/voluntarios", label: "Registro voluntarios" },
  { href: "/registro/equipos", label: "Registro equipos" },
] as const;

export function isPublicNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
