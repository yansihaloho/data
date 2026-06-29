import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetTotoLatest,
  useGetTotoMonths,
  useGetTotoSchedule,
  useRefreshTotoData,
  getGetTotoMonthsQueryKey,
  getGetTotoLatestQueryKey,
  getGetTotoScheduleQueryKey,
} from "@workspace/api-client-react";
import { PageSeo } from "@/components/page-seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Clock, Calendar, ChevronDown, ChevronUp, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useCountdown } from "@/hooks/use-countdown";
import { NumberDisplayBadged, NumberDisplay } from "@/components/number-display";
import { useGetNomorTaruhan } from "@workspace/api-client-react";
import { computeHits } from "@/lib/classify";

const DRAW_TIMES = ["0001", "1300", "1600", "1900", "2200", "2300"] as const;
const DRAW_LABELS: Record<string, string> = {
  "0001": "00:01",
  "1300": "13:00",
  "1600": "16:00",
  "1900": "19:00",
  "2200": "22:00",
  "2300": "23:00",
};

type DrawTimeKey = "draw0001" | "draw1300" | "draw1600" | "draw1900" | "draw2200" | "draw2300";
function drawKey(t: string): DrawTimeKey {
  return `draw${t}` as DrawTimeKey;
}


export default function Home() {
  const queryClient = useQueryClient();
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const { isActive: autoActive, lastRefreshed, nextDrawLabel } = useAutoRefresh();
  const countdown = useCountdown();

  const { data: latest, isLoading: latestLoading } = useGetTotoLatest();
  const { data: months, isLoading: monthsLoading } = useGetTotoMonths();
  const { data: schedule } = useGetTotoSchedule();
  const { data: nomorTaruhan } = useGetNomorTaruhan();
  const refreshMutation = useRefreshTotoData();

  const taruhanSet = useMemo(
    () => new Set<string>(nomorTaruhan?.numbers ?? []),
    [nomorTaruhan]
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshMutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: getGetTotoMonthsQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetTotoLatestQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetTotoScheduleQueryKey() });
    } finally {
      setRefreshing(false);
    }
  }

  function toggleMonth(key: string) {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-6 md:pb-6">
      <PageSeo
        title="Home"
        description="Data result Toto Macau live terlengkap. Cek hasil keluaran terbaru."
      />

      {/* Header + Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Toto Macau Live</h1>
            {autoActive && (
              <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-400 border border-green-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                Live
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {autoActive
              ? "Auto-refresh aktif setiap 30 detik"
              : lastRefreshed
              ? `Diperbarui ${lastRefreshed.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · Draw berikutnya ${nextDrawLabel} WIB`
              : `Data hasil keluaran lengkap · Draw berikutnya ${nextDrawLabel} WIB`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Countdown Timer */}
      <div className={cn(
        "rounded-2xl border p-5 transition-all duration-500",
        countdown.isImminent
          ? "border-primary/60 bg-primary/8 shadow-2xl shadow-primary/20 ring-1 ring-primary/20"
          : "border-border bg-card"
      )}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Timer className={cn("h-5 w-5", countdown.isImminent ? "text-primary animate-pulse" : "text-muted-foreground")} />
            <span className="text-sm font-medium text-muted-foreground">
              Draw berikutnya —{" "}
              <span className={cn("font-bold text-base", countdown.isImminent ? "text-primary" : "text-foreground")}>
                {countdown.nextDrawLabel} WIB
              </span>
            </span>
            {countdown.isImminent && (
              <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-bold text-primary border border-primary/40 animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Segera!
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {[
              { value: countdown.hours, label: "JAM" },
              { value: countdown.minutes, label: "MENIT" },
              { value: countdown.seconds, label: "DETIK" },
            ].map(({ value, label }, i) => (
              <div key={label} className="flex items-center gap-3">
                {i > 0 && (
                  <span className={cn(
                    "text-3xl font-black tabular-nums -mt-4",
                    countdown.isImminent ? "text-primary" : "text-muted-foreground/50"
                  )}>:</span>
                )}
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "min-w-[3.5rem] rounded-xl px-3 py-2 text-center text-4xl font-black tabular-nums leading-none tracking-tight",
                    countdown.isImminent
                      ? "bg-primary/20 text-primary shadow-lg shadow-primary/30"
                      : "bg-muted/60 text-foreground"
                  )}>
                    {String(value).padStart(2, "0")}
                  </span>
                  <span className="mt-1.5 text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Draw schedule chips */}
        {schedule && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-4">
            <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground/60">Jadwal:</span>
            {schedule.drawTimes.map((t) => (
              <Badge
                key={t}
                variant={t === countdown.nextDrawLabel ? "default" : "outline"}
                className={cn("font-mono text-xs", t === countdown.nextDrawLabel && "bg-primary/90")}
              >
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Latest */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Hasil Terbaru
        </h2>
        {latestLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : latest ? (
          <div className="rounded-2xl border border-primary/30 bg-card overflow-hidden">
            {/* Day header */}
            <div className="flex items-center gap-2.5 border-b border-border/50 bg-primary/5 px-4 py-3">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span className="font-bold text-foreground">{latest.dayName}, {latest.drawDate}</span>
              <span className="ml-auto flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-bold text-green-400 border border-green-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                LIVE
              </span>
            </div>
            {/* Results grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6">
              {DRAW_TIMES.map((t, i) => {
                const val = latest[drawKey(t)] ?? null;
                const hasResult = !!val;
                return (
                  <div
                    key={t}
                    className={cn(
                      "flex flex-col items-center gap-3 px-2 py-5 text-center",
                      "border-border/30",
                      i % 3 !== 2 && "border-r sm:border-r",
                      i < 3 && "border-b sm:border-b-0",
                      i > 0 && i % 3 === 0 && "sm:border-l",
                      hasResult ? "bg-card" : "bg-muted/20"
                    )}
                  >
                    <div className="text-[10px] font-bold text-muted-foreground tracking-widest">
                      {DRAW_LABELS[t]}
                    </div>
                    <NumberDisplayBadged value={val} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Belum ada data. Klik Refresh untuk mengambil data.
          </div>
        )}
      </div>

      {/* Monthly history */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Riwayat per Bulan
        </h2>
        {monthsLoading ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-none" />
            ))}
          </div>
        ) : months && months.length > 0 ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/60">
            {months.map((monthGroup, idx) => {
              const key = `${monthGroup.year}-${monthGroup.month}`;
              const expanded = expandedMonths.has(key);
              return (
                <div key={key}>
                  <button
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-muted/25 transition-colors"
                    onClick={() => toggleMonth(key)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-2 w-2 rounded-full shrink-0",
                        idx === 0 ? "bg-primary" : "bg-border"
                      )} />
                      <span className="font-semibold text-foreground text-[15px]">
                        {monthGroup.monthName} {monthGroup.year}
                      </span>
                      <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {monthGroup.totalDays} hari
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  {expanded && (
                    <div className="border-t border-border/60 divide-y divide-border/30">
                      {/* Header row */}
                      <div className="flex items-center gap-2 bg-muted/30 px-3 py-2 sm:px-4">
                        <div className="w-[60px] shrink-0 sm:w-[90px]" />
                        {DRAW_TIMES.map((t) => (
                          <div key={t} className="flex-1 text-center text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                            {DRAW_LABELS[t]}
                          </div>
                        ))}
                        {taruhanSet.size > 0 && (
                          <div className="w-8 shrink-0 text-center text-[9px] font-bold uppercase tracking-wider text-primary/70 sm:text-[10px]">
                            HIT
                          </div>
                        )}
                      </div>
                      {/* Data rows */}
                      {monthGroup.results.map((row) => {
                        const rowHits = DRAW_TIMES.reduce((sum, t) => sum + computeHits(row[drawKey(t)] ?? null, taruhanSet), 0);
                        return (
                          <div key={row.drawDate} className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/10 transition-colors sm:px-4 sm:py-3">
                            {/* Date */}
                            <div className="w-[60px] shrink-0 sm:w-[90px]">
                              <div className="text-[9px] font-medium text-muted-foreground leading-none sm:text-[11px]">{row.dayName.slice(0,3)}</div>
                              <div className="mt-0.5 font-mono text-[11px] font-bold leading-tight text-foreground sm:text-sm">
                                {row.drawDate.slice(5).replace('-','/')}
                              </div>
                            </div>
                            {/* Draw slots */}
                            {DRAW_TIMES.map((t) => {
                              const val = row[drawKey(t)] ?? null;
                              const hits = computeHits(val, taruhanSet);
                              const isHit = taruhanSet.size > 0 && hits > 0;
                              return (
                                <div
                                  key={t}
                                  className={cn(
                                    "flex flex-1 items-center justify-center rounded-xl border py-2 text-center transition-colors sm:py-2.5",
                                    isHit
                                      ? "border-amber-500/40 bg-amber-500/15"
                                      : "border-border/30 bg-muted/20"
                                  )}
                                >
                                  <NumberDisplay
                                    value={val}
                                    className={isHit ? "text-amber-100" : undefined}
                                  />
                                </div>
                              );
                            })}
                            {/* Hit count */}
                            {taruhanSet.size > 0 && (
                              <div className="w-8 shrink-0 text-center">
                                {rowHits > 0 ? (
                                  <span className={cn(
                                    "inline-flex items-center justify-center rounded-full border font-bold h-6 w-6 text-xs",
                                    rowHits >= 16 ? "bg-green-500/35 text-green-200 border-green-500/55" :
                                    rowHits >= 8  ? "bg-orange-500/35 text-orange-200 border-orange-500/55" :
                                    rowHits >= 4  ? "bg-amber-500/35 text-amber-200 border-amber-500/55" :
                                                    "bg-amber-500/20 text-amber-300 border-amber-500/35"
                                  )}>{rowHits}</span>
                                ) : (
                                  <span className="text-muted-foreground/20 text-xs">—</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Belum ada data history.
          </div>
        )}
      </div>
    </div>
  );
}
