export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 h-14 flex items-center">
        <span className="text-sm font-bold uppercase tracking-tight">
          <span className="text-white">GT</span>
          <span className="text-brand-green"> Voluntario</span>
        </span>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
