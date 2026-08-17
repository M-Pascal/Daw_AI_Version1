"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn, formatNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import type { Region, RegionId } from "@/lib/types";
import type { RegionDiseaseTrend } from "@/lib/data/derive";

const GRID_LAYOUT: Record<RegionId, { col: number; row: number; span: number }> = {
  western: { col: 1, row: 1, span: 1 },
  nyanza: { col: 1, row: 2, span: 1 },
  riftValley: { col: 2, row: 1, span: 3 },
  central: { col: 3, row: 1, span: 1 },
  nairobi: { col: 3, row: 2, span: 1 },
  eastern: { col: 3, row: 3, span: 1 },
  northEastern: { col: 4, row: 1, span: 2 },
  coast: { col: 4, row: 3, span: 1 },
};

const COL_START: Record<number, string> = { 1: "col-start-1", 2: "col-start-2", 3: "col-start-3", 4: "col-start-4" };
const ROW_START: Record<number, string> = { 1: "row-start-1", 2: "row-start-2", 3: "row-start-3" };
const ROW_SPAN: Record<number, string> = { 1: "row-span-1", 2: "row-span-2", 3: "row-span-3" };

const STATUS_DOT: Record<RegionDiseaseTrend["status"], string> = {
  rising: "bg-shortage",
  declining: "bg-surplus",
  stable: "bg-balanced",
};

const severityRank = { critical: 3, high: 2, moderate: 1, low: 0 };

export function RegionStatusGrid({
  regions,
  trends,
}: {
  regions: Region[];
  trends: RegionDiseaseTrend[];
}) {
  const trendsByRegion = useMemo(() => {
    const map = new Map<RegionId, RegionDiseaseTrend[]>();
    for (const t of trends) {
      const list = map.get(t.regionId) ?? [];
      list.push(t);
      map.set(t.regionId, list);
    }
    return map;
  }, [trends]);

  const dominantByRegion = useMemo(() => {
    const map = new Map<RegionId, RegionDiseaseTrend>();
    for (const [regionId, list] of trendsByRegion) {
      const dominant = [...list].sort(
        (a, b) => severityRank[b.severity] - severityRank[a.severity]
      )[0];
      map.set(regionId, dominant);
    }
    return map;
  }, [trendsByRegion]);

  const [selectedId, setSelectedId] = useState<RegionId>(regions[0]?.id ?? "nairobi");
  const selectedRegion = regions.find((r) => r.id === selectedId);
  const selectedTrends = trendsByRegion.get(selectedId) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="grid grid-cols-4 grid-rows-3 gap-3">
          {regions.map((region) => {
            const layout = GRID_LAYOUT[region.id];
            const dominant = dominantByRegion.get(region.id);
            const isSelected = region.id === selectedId;

            return (
              <button
                key={region.id}
                type="button"
                onClick={() => setSelectedId(region.id)}
                className={cn(
                  "flex flex-col items-start justify-end gap-1 rounded-xl border-2 bg-secondary/40 p-3 text-left transition-colors hover:bg-secondary",
                  COL_START[layout.col],
                  ROW_START[layout.row],
                  ROW_SPAN[layout.span],
                  isSelected ? "border-primary" : "border-transparent"
                )}
              >
                <span
                  className={cn("h-2 w-2 rounded-full", dominant ? STATUS_DOT[dominant.status] : "bg-muted")}
                />
                <span className="text-sm font-medium text-foreground">{region.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-shortage" /> Rising
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-surplus" /> Declining
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-balanced" /> Stable
          </span>
          <span>Schematic layout &mdash; not a geographic map.</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {selectedRegion?.name ?? "Region"}
        </p>
        <p className="mt-1 text-lg font-semibold text-foreground">Disease trends this month</p>

        <div className="mt-4 space-y-3">
          {selectedTrends.map((t) => (
            <div key={t.diseaseId} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{t.diseaseName}</p>
                <StatusBadge status={t.status} />
              </div>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Trend</dt>
                  <dd className="font-medium text-foreground">
                    {t.changePercent > 0 ? "+" : ""}
                    {t.changePercent}%
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cases</dt>
                  <dd className="font-medium text-foreground">{formatNumber(t.currentCases)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Next mo.</dt>
                  <dd className="font-medium text-foreground">
                    {t.nextMonthForecast !== null ? formatNumber(t.nextMonthForecast) : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <Link
          href={`/forecast?disease=${selectedTrends[0]?.diseaseId ?? "hiv"}&region=${selectedId}`}
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          View full forecast for {selectedRegion?.name} &rarr;
        </Link>
      </div>
    </div>
  );
}
