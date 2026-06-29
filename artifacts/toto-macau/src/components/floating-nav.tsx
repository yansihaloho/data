import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, TrendingUp, BarChart2, TrendingDown, Hash, Brain, ClipboardList } from "lucide-react";
import { useTodayStats } from "@/hooks/use-today-stats";

const NAV_ITEMS = [
  { href: "/",            label: "Home",    icon: Home,        badge: "LIVE", badgeCls: "bg-emerald-500 text-white", pulse: true,  statKey: null },
  { href: "/ganjil",      label: "Ganjil",  icon: TrendingUp,  badge: null,   badgeCls: "bg-amber-500 text-white",               statKey: "ganjil"    as const },
  { href: "/besar",       label: "Besar",   icon: BarChart2,   badge: null,   badgeCls: "bg-red-500 text-white",                 statKey: "besar"     as const },
  { href: "/genap",       label: "Genap",   icon: TrendingDown,badge: null,   badgeCls: "bg-sky-500 text-white",                 statKey: "genap"     as const },
  { href: "/genap-ekor",  label: "Gp.Ekor", icon: Hash,        badge: null,   badgeCls: "bg-teal-500 text-white",                statKey: "genapEkor" as const },
  { href: "/ganjil-ekor", label: "Gj.Ekor", icon: Hash,        badge: null,   badgeCls: "bg-rose-500 text-white",                statKey: "ganjilEkor" as const },
  { href: "/analisa-harian", label: "Analisa",  icon: BarChart2, badge: "📊", badgeCls: "bg-purple-600 text-white", statKey: null },
  { href: "/prediksi-ai",      label: "Prediksi", icon: Brain,         badge: "AI", badgeCls: "bg-blue-600 text-white",   statKey: null },
  { href: "/riwayat-prediksi", label: "Riwayat",  icon: ClipboardList, badge: "📋", badgeCls: "bg-indigo-600 text-white", statKey: null },
];

export function FloatingNav() {
  const [location] = useLocation();
  const todayStats = useTodayStats();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="border-t border-border/60 bg-background/95 backdrop-blur-xl">
        <div className="relative">
          <div className="flex items-stretch overflow-x-auto scrollbar-none snap-x snap-mandatory">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className="shrink-0 snap-start" style={{ minWidth: "calc(100% / 5.5)" }}>
                  <button
                    className={cn(
                      "relative flex w-full flex-col items-center justify-center gap-1 px-1 pb-4 pt-3 transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {isActive && (
                      <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
                    )}

                    <span className="relative">
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-all duration-200",
                          isActive ? "text-primary scale-110" : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "absolute -right-2.5 -top-2 inline-flex min-w-[1.2rem] items-center justify-center rounded-full px-1 py-0 text-[9px] font-bold leading-none",
                          item.badgeCls,
                          item.pulse && "animate-pulse"
                        )}
                      >
                        {item.statKey && todayStats
                          ? todayStats[item.statKey]
                          : item.badge}
                      </span>
                    </span>

                    <span className={cn(
                      "text-[9px] font-bold leading-none tracking-wide transition-colors whitespace-nowrap",
                      isActive ? "text-primary" : "text-muted-foreground/70"
                    )}>
                      {item.label}
                    </span>
                  </button>
                </Link>
              );
            })}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-background/95 to-transparent" />
        </div>
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </nav>
  );
}
