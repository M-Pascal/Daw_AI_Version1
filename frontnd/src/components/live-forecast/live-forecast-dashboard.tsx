"use client";

import { useEffect, useState } from "react";
import { Pill } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatNumber } from "@/lib/utils";
import type { Disease, DiseaseId, Region, RegionId } from "@/lib/types";

const FORECAST_API_URL = process.env.NEXT_PUBLIC_FORECAST_API_URL ?? "http://127.0.0.1:8000";
const MONTH_OPTIONS = [1, 3, 6, 12] as const;
type MonthOption = (typeof MONTH_OPTIONS)[number];

const SELECT_CLASSNAME =
  "rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Mock standard dosage units consumed per reported case, per disease -- a
// planning heuristic for sizing drug allocation, not a clinical dosing figure.
const DOSAGE_UNITS_PER_CASE: Record<DiseaseId, number> = {
  malaria: 3,
  tb: 4,
  hiv: 2,
};
const BLENDED_DOSAGE_UNITS_PER_CASE = 3; // used when "All diseases" is selected

interface ForecastApiResponse {
  region: string;
  regionName: string;
  disease: DiseaseId | null;
  diseaseName: string;
  requestedMonths: number;
  availableMonths: number;
  truncated: boolean;
  source: "json_export" | "lightgbm_live";
  modelNote: string;
  timeline: string[];
  cases: number[];
  low: number[];
  high: number[];
  history: { month: string; cases: number }[];
  totalForecastedCases: number;
}

interface ChartPoint {
  month: string;
  historical: number | null;
  forecast: number | null;
  low: number | null;
  high: number | null;
}

function buildChartData(data: ForecastApiResponse): ChartPoint[] {
  const points: ChartPoint[] = [
    ...data.history.map((h) => ({
      month: h.month,
      historical: h.cases,
      forecast: null,
      low: null,
      high: null,
    })),
    ...data.timeline.map((month, i) => ({
      month,
      historical: null,
      forecast: data.cases[i],
      low: data.low[i],
      high: data.high[i],
    })),
  ];

  // Bridge the line: carry the last historical point into the first forecast
  // point so the chart line is visually continuous, not a gap.
  const lastHistoricalIndex = data.history.length - 1;
  const firstForecastPoint = points[data.history.length];
  if (lastHistoricalIndex >= 0 && firstForecastPoint) {
    firstForecastPoint.forecast = firstForecastPoint.forecast ?? points[lastHistoricalIndex].historical;
  }

  return points;
}

export function LiveForecastDashboard({
  regions,
  diseases,
}: {
  regions: Region[];
  diseases: Disease[];
}) {
  const [regionId, setRegionId] = useState<RegionId | "national">("national");
  const [months, setMonths] = useState<MonthOption>(6);
  const [diseaseId, setDiseaseId] = useState<DiseaseId | "">("");
  const [data, setData] = useState<ForecastApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ region: regionId, months: String(months) });
    if (diseaseId) params.set("disease", diseaseId);

    fetch(`${FORECAST_API_URL}/api/forecast?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.detail ?? `Forecast API returned ${res.status}.`);
        }
        return res.json() as Promise<ForecastApiResponse>;
      })
      .then(setData)
      .catch((err) => {
        if (err?.name === "AbortError") return;
        if (err instanceof TypeError) {
          setError(`Couldn't reach the forecasting API at ${FORECAST_API_URL}. Is it running?`);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load forecast.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [regionId, months, diseaseId]);

  const chartData = data ? buildChartData(data) : [];
  const dosagePerCase = diseaseId ? DOSAGE_UNITS_PER_CASE[diseaseId] : BLENDED_DOSAGE_UNITS_PER_CASE;
  const allocationUnits = data ? Math.round(data.totalForecastedCases * dosagePerCase) : 0;
  const horizonLabel = data?.availableMonths ?? months;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Region
          <select
            value={regionId}
            onChange={(e) => setRegionId(e.target.value as RegionId | "national")}
            className={SELECT_CLASSNAME}
          >
            <option value="national">National (all regions)</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Disease
          <select
            value={diseaseId}
            onChange={(e) => setDiseaseId(e.target.value as DiseaseId | "")}
            className={SELECT_CLASSNAME}
          >
            <option value="">All diseases</option>
            {diseases.map((disease) => (
              <option key={disease.id} value={disease.id}>
                {disease.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Horizon
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value) as MonthOption)}
            className={SELECT_CLASSNAME}
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} month{m > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}
      {data?.truncated && (
        <Alert>
          The model is trained to a {data.availableMonths}-month horizon, so it's showing{" "}
          {data.availableMonths} months instead of the requested {data.requestedMonths}.
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {data?.diseaseName ?? "Disease"} forecast &middot; {data?.regionName ?? "—"}
            </CardTitle>
            <CardDescription>
              {data
                ? `Served from ${data.source === "lightgbm_live" ? "live LightGBM inference" : "the notebook's forecast export"}.`
                : "Recent history and projected case burden from the forecasting model."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
                Loading forecast&hellip;
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatNumber(v)}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                    width={64}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value, name) => {
                      if (value === null || value === undefined) return ["-", name];
                      return [`${formatNumber(Number(value))} cases`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    dataKey={(point: ChartPoint) =>
                      point.low !== null && point.high !== null ? [point.low, point.high] : null
                    }
                    name="Forecast range"
                    stroke="none"
                    fill="var(--color-forecast)"
                    fillOpacity={0.12}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="historical"
                    name="Historical"
                    stroke="var(--color-primary)"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    name="Forecast"
                    stroke="var(--color-forecast)"
                    strokeWidth={2.5}
                    strokeDasharray="6 4"
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
                No forecast data available for this selection.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-kenya-accent/30 bg-kenya-accent/5">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Pill className="h-3.5 w-3.5" /> Suggested drug allocation
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums text-kenya-accent">
              {formatNumber(allocationUnits)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>
              Dosage units for {data ? formatNumber(data.totalForecastedCases) : "—"} forecasted
              cases over the next {horizonLabel} month{horizonLabel > 1 ? "s" : ""} in{" "}
              {data?.regionName ?? "—"}.
            </p>
            <p>
              Estimated at {dosagePerCase} unit{dosagePerCase > 1 ? "s" : ""}/case (
              {diseaseId ? data?.diseaseName : "blended"} average) &mdash; a planning heuristic, not
              a clinical dosing guideline.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
