import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMenu } from "./mobile-menu";
import { useTodayStats } from "@/hooks/use-today-stats";

const NAV_ITEMS = [
  { href: "/",         label: "Home",      badge: "LIVE", badgeCls: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30", pulse: true, statKey: null },
  { href: "/ganjil",   label: "Ganjil",    badge: null,   badgeCls: "bg-amber-500/20 text-amber-400 border border-amber-500/30",   statKey: "ganjil"  as const },
  { href: "/genap",    label: "Genap",     badge: null,   badgeCls: "bg-sky-500/20 text-sky-400 border border-sky-500/30",         statKey: "genap"   as const },
  { href: "/besar",    label: "Besar",     badge: null,   badgeCls: "bg-red-500/20 text-red-400 border border-red-500/30",         statKey: "besar"   as const },
  { href: "/kecil",      label: "Kecil",      badge: null,   badgeCls: "bg-green-500/20 text-green-400 border border-green-500/30",   statKey: "kecil"     as const },
  { href: "/kecil-ekor", label: "Kecil Ekor", badge: null,   badgeCls: "bg-violet-500/20 text-violet-400 border border-violet-500/30", statKey: "kecilEkor" as const },
  { href: "/besar-ekor",  label: "Besar Ekor",  badge: null, badgeCls: "bg-orange-500/20 text-orange-400 border border-orange-500/30", statKey: "besarEkor"  as const },
  { href: "/genap-ekor",  label: "Genap Ekor",  badge: null, badgeCls: "bg-teal-500/20 text-teal-400 border border-teal-500/30",       statKey: "genapEkor"  as const },
  { href: "/ganjil-ekor", label: "Ganjil Ekor", badge: null, badgeCls: "bg-rose-500/20 text-rose-400 border border-rose-500/30",       statKey: "ganjilEkor" as const },
  { href: "/analisa-harian", label: "Analisa",    badge: "📊",  badgeCls: "bg-purple-500/20 text-purple-400 border border-purple-500/30",  statKey: null },
  { href: "/prediksi-ai",      label: "Prediksi AI",  badge: "AI",  badgeCls: "bg-blue-500/20 text-blue-400 border border-blue-500/30",           statKey: null },
  { href: "/riwayat-prediksi", label: "Riwayat",      badge: "📋",  badgeCls: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",      statKey: null },
];

export function TopNav() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const todayStats = useTodayStats();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
              <span className="text-base leading-none">🎰</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-foreground">Toto Macau</span>
              <span className="text-[10px] text-primary font-semibold tracking-wide">LIVE</span>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    className={cn(
                      "group relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none tracking-wide",
                        item.badgeCls
                      )}
                    >
                      {item.pulse && (
                        <span className="relative mr-1 flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </span>
                      )}
                      {item.statKey && todayStats
                        ? todayStats[item.statKey]
                        : item.badge}
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
                    )}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Mobile/Tablet hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-muted/40 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
