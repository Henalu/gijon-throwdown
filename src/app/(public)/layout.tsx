import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { getCurrentSessionProfile } from "@/lib/auth/session";
import { isActiveProfile } from "@/lib/auth/permissions";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getCurrentSessionProfile();
  const viewer = isActiveProfile(profile) ? profile : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar viewer={viewer} />
      <main className="flex-1 pb-28 md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
