"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { TrendChart, type TrendChartSeries } from "@/components/overview/trend-chart";
import type { Disease, DiseaseId, Region, RegionId, TrendStatus } from "@/lib/types";
import type { ForecastSeriesPoint } from "@/lib/data/derive";

const DISEASE_COLORS: Record<DiseaseId, string> = {
  hiv: "var(--color-primary)",
  tb: "var(--color-forecast)",
  malaria: "var(--color-surplus)",
};

const PERIOD_OPTIONS = [
  { label: "1 year", months: 12 },
  { label: "2 years", months: 24 },
  { label: "3 years", months: 36 },
  { label: "4 years", months: 48 },
  { label: "5 years", months: 60 },
  { label: "All (2021-2026)", months: 67 },
];

interface ForecastApiResponse {
  disease: Disease;
  series: ForecastSeriesPoint[];
  trend: { status: TrendStatus };
}

export function TrendExplorer({
  diseases,
  regions,
}: {
  diseases: Disease[];
  regions: Region[];
}) {
  const [diseaseFilter, setDiseaseFilter] = useState<DiseaseId | "all">("all");
  const [regionFilter, setRegionFilter] = useState<RegionId | "national">("national");
  const [periodMonths, setPeriodMonths] = useState(67);
  const [statusFilter, setStatusFilter] = useState<TrendStatus | "all">("all");

  const [chartData, setChartData] = useState<Record<string, string | number | null>[]>([]);
  const [chartSeries, setChartSeries] = useState<TrendChartSeries[]>([]);
  const [boundaryLabel, setBoundaryLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const targetDiseases = diseaseFilter === "all" ? diseases : diseases.filter((d) => d.id === diseaseFilter);
    const controller = new AbortController();
    // Standard loading-state-for-fetch pattern, same as ForecastExplorer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    Promise.all(
      targetDiseases.map((disease) =>
        fetch(`/api/forecast?disease=${disease.id}&region=${regionFilter}`, {
          signal: controller.signal,
        }).then(async (res) => {
          if (!res.ok) throw new Error("Failed to load trend data.");
          return (await res.json()) as ForecastApiResponse;
        })
      )
    )
      .then((results) => {
        const included = statusFilter === "all" ? results : results.filter((r) => r.trend.status === statusFilter);

        if (included.length === 0) {
          setChartData([]);
          setChartSeries([]);
          setBoundaryLabel(null);
          return;
        }

        const merged = new Map<string, Record<string, string | number | null>>();
        let boundary: string | null = null;

        for (const result of included) {
          const historicalPoints = result.series.filter((p) => p.historical !== null);
          const forecastPoints = result.series.filter((p) => p.historical === null);
          const trimmed = [...historicalPoints.slice(-periodMonths), ...forecastPoints];

          if (!boundary && historicalPoints.length > 0) {
            boundary = historicalPoints[historicalPoints.length - 1].monthLabel;
          }

          for (const point of trimmed) {
            const entry = merged.get(point.month) ?? { month: point.month, monthLabel: point.monthLabel };
            entry[`${result.disease.id}_historical`] = point.historical;
            entry[`${result.disease.id}_forecast`] = point.forecast;
            merged.set(point.month, entry);
          }
        }

        const sortedData = Array.from(merged.values()).sort((a, b) =>
          String(a.month).localeCompare(String(b.month))
        );

        setChartData(sortedData);
        setChartSeries(
          included.map((r) => ({
            diseaseId: r.disease.id,
            diseaseName: r.disease.name,
            color: DISEASE_COLORS[r.disease.id],
          }))
        );
        setBoundaryLabel(boundary);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError("Couldn't load trend data. Please try again.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diseaseFilter, regionFilter, periodMonths, statusFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case trend &mdash; historical and forecast</CardTitle>
        <CardDescription>
          Reported cases aggregated over the selected filters. Dashed section is the forecast.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Disease
            <select
              value={diseaseFilter}
              onChange={(e) => setDiseaseFilter(e.target.value as DiseaseId | "all")}
              className="block w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All diseases</option>
              {diseases.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Region
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value as RegionId | "national")}
              className="block w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="national">All regions</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Time period
            <select
              value={periodMonths}
              onChange={(e) => setPeriodMonths(Number(e.target.value))}
              className="block w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.months} value={opt.months}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Trend
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TrendStatus | "all")}
              className="block w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All trends</option>
              <option value="rising">Rising</option>
              <option value="declining">Declining</option>
              <option value="stable">Stable</option>
            </select>
          </label>
        </div>

        {error && <Alert variant="destructive" className="mb-4">{error}</Alert>}

        {loading && chartData.length === 0 ? (
          <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
            Loading trend data&hellip;
          </div>
        ) : chartSeries.length > 0 ? (
          <TrendChart data={chartData} series={chartSeries} boundaryLabel={boundaryLabel} />
        ) : (
          <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
            No diseases match the selected filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
