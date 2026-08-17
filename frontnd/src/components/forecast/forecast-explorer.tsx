"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status-badge";
import { cn, formatNumber } from "@/lib/utils";
import { ForecastChart } from "@/components/forecast/forecast-chart";
import type { Disease, DiseaseId, Region, RegionId, TrendStatus } from "@/lib/types";
import type { ForecastSeriesPoint, SeasonalInsight } from "@/lib/data/derive";

interface ForecastPayload {
  disease: Disease;
  regionId: RegionId | "national";
  regionName: string;
  series: ForecastSeriesPoint[];
  seasonal: SeasonalInsight | null;
  trend: {
    currentCases: number;
    previousCases: number;
    changePercent: number;
    status: TrendStatus;
  };
  nextMonth: { month: string; cases: number | null } | null;
}

export function ForecastExplorer({
  diseases,
  regions,
  initialData,
  initialDiseaseId,
  initialRegionId,
}: {
  diseases: Disease[];
  regions: Region[];
  initialData: ForecastPayload | null;
  initialDiseaseId?: DiseaseId;
  initialRegionId?: RegionId | "national";
}) {
  const [diseaseId, setDiseaseId] = useState<DiseaseId>(initialDiseaseId ?? diseases[0]?.id ?? "hiv");
  const [regionId, setRegionId] = useState<RegionId | "national">(initialRegionId ?? "national");
  const [data, setData] = useState<ForecastPayload | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (initialData) return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`/api/forecast?disease=${diseaseId}&region=${regionId}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load forecast data.");
        return res.json();
      })
      .then((payload: ForecastPayload) => setData(payload))
      .catch((err) => {
        if (err.name !== "AbortError") setError("Couldn't load the forecast. Please try again.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diseaseId, regionId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {diseases.map((disease) => (
            <button
              key={disease.id}
              type="button"
              onClick={() => setDiseaseId(disease.id)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                diseaseId === disease.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary"
              )}
            >
              {disease.name}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Region
          <select
            value={regionId}
            onChange={(e) => setRegionId(e.target.value as RegionId | "national")}
            className="rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="national">National (all regions)</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>
            {data?.disease.fullName ?? "Disease"} forecast &middot; {data?.regionName ?? "—"}
          </CardTitle>
          <CardDescription>
            Historical monthly cases and projected future burden. Shaded band shows the
            forecast&apos;s uncertainty range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
              Loading forecast&hellip;
            </div>
          ) : data && data.series.length > 0 ? (
            <div className={cn(loading && "opacity-60 transition-opacity")}>
              <ForecastChart
                data={data.series}
                diseaseName={data.disease.name}
                lastHistoricalMonth={
                  data.series.filter((p) => p.historical !== null).slice(-1)[0]?.month ?? ""
                }
              />
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
              No forecast data available for this selection.
            </div>
          )}
        </CardContent>
      </Card>

      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Latest reported month</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {formatNumber(data.trend.currentCases)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusBadge status={data.trend.status} />
              <p className="mt-2 text-xs text-muted-foreground">
                {data.trend.changePercent > 0 ? "+" : ""}
                {data.trend.changePercent}% vs previous month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Next month projection
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {data.nextMonth?.cases !== null && data.nextMonth?.cases !== undefined
                  ? formatNumber(data.nextMonth.cases)
                  : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {data.nextMonth
                  ? `Projected cases for ${data.nextMonth.month}`
                  : "No projection available."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5">
                <CalendarRange className="h-3.5 w-3.5" /> Seasonal pattern
              </CardDescription>
              <CardTitle className="text-2xl">{data.seasonal?.peakMonthLabel ?? "—"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Historical peak month for {data.disease.name}. Lowest burden typically in{" "}
                {data.seasonal?.lowMonthLabel ?? "—"}.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
