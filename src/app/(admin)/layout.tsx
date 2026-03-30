import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { getAdminSidebarLinks } from "@/components/layout/admin-navigation";
import {
  ProtectedMobileNav,
  type ProtectedMobileNavLink,
} from "@/components/layout/protected-mobile-nav";
import { getPanelTitle, getProfileRoleLabel } from "@/lib/auth/permissions";
import { requireAdminLikeProfile } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdminLikeProfile("/admin");
  const canValidateScores =
    profile.role === "superadmin" ||
    (profile.role === "admin" && profile.can_validate_scores);
  const adminLinks = getAdminSidebarLinks({
    isSuperadmin: profile.role === "superadmin",
    canValidateScores,
  });
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
        title={getPanelTitle(profile)}
        viewer={profile}
        primaryLinks={adminLinks}
        siteLinks={siteLinks}
      />

      <div className="flex min-h-[calc(100vh-3.5rem)] md:min-h-screen">
        <AdminSidebar
          isSuperadmin={profile.role === "superadmin"}
          canValidateScores={canValidateScores}
        />
        <main className="min-w-0 flex-1 overflow-auto p-4 pb-8 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
