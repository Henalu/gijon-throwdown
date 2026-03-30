import {
  ProtectedMobileNav,
  type ProtectedMobileNavLink,
} from "@/components/layout/protected-mobile-nav";
import {
  getPanelTitle,
  getProfileRoleLabel,
  isJudgeProfile,
} from "@/lib/auth/permissions";
import { requireVolunteerSurfaceProfile } from "@/lib/auth/session";

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireVolunteerSurfaceProfile("/voluntario");
  const panelTitle = getPanelTitle(profile);
  const volunteerLinks = [
    {
      href: "/voluntario",
      label: isJudgeProfile(profile) ? "Dashboard juez" : "Dashboard voluntario",
      description: isJudgeProfile(profile)
        ? "Heats asignados, arbitraje en pista y acceso rapido al live."
        : "Heats asignados, disponibles y acceso rapido al live.",
    },
  ];
  const siteLinks: ProtectedMobileNavLink[] = [
    {
      href: "/",
      label: "Inicio",
      description: "Volver a la portada publica del evento.",
      icon: "home",
    },
    {
      href: "/cuenta",
      label: "Mi cuenta",
      description: `Resumen de acceso para ${getProfileRoleLabel(profile).toLowerCase()}.`,
      icon: "user",
    },
    {
      href: "/directo",
      label: "Directo",
      description: "Heat activo, stream y estado publico del evento.",
      icon: "radio",
    },
    {
      href: "/clasificacion",
      label: "Clasificacion",
      description: "Leaderboard oficial y resultados publicados.",
      icon: "trophy",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ProtectedMobileNav
        title={panelTitle}
        viewer={profile}
        primaryLinks={volunteerLinks}
        siteLinks={siteLinks}
      />

      <header className="sticky top-0 z-50 hidden h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur-md md:flex">
        <span className="text-sm font-bold uppercase tracking-tight">
          <span className="text-white">GT</span>
          <span className="text-brand-green"> {getProfileRoleLabel(profile)}</span>
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {profile.full_name}
        </span>
      </header>
      <main className="p-4 pb-8">{children}</main>
    </div>
  );
}
