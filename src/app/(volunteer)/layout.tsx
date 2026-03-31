import type { Metadata, Viewport } from "next";
import {
  ProtectedMobileNav,
  type ProtectedMobileNavLink,
} from "@/components/layout/protected-mobile-nav";
import { VolunteerDesktopSidebar } from "@/components/layout/volunteer-desktop-sidebar";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import {
  getPanelTitle,
  getProfileRoleLabel,
  isJudgeProfile,
} from "@/lib/auth/permissions";
import { requireVolunteerSurfaceProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: "GT Juez",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GT Juez",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0f0d",
};

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
      icon: "layoutDashboard" as const,
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
      <RegisterServiceWorker />
      <ProtectedMobileNav
        title={panelTitle}
        viewer={profile}
        primaryLinks={volunteerLinks}
        siteLinks={siteLinks}
      />

      {isJudgeProfile(profile) ? (
        <div className="flex min-h-[calc(100vh-3.5rem)] md:min-h-screen">
          <VolunteerDesktopSidebar
            title={panelTitle}
            viewer={profile}
            primaryLinks={volunteerLinks}
            siteLinks={siteLinks}
          />
          <main className="min-w-0 flex-1 overflow-auto p-4 pb-8 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
