import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black uppercase tracking-tight">
              <span className="text-white">Gijon</span>{" "}
              <span className="text-brand-green">Throwdown</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/patrocinadores" className="hover:text-foreground transition-colors">
              Sponsors
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            EST 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
