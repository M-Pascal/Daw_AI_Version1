import "server-only";
import { getDiseaseMonthlyData, getDiseases, getRegions } from "@/lib/data/store";
import type {
  DiseaseId,
  ForecastPoint,
  HistoricalPoint,
  MonthlyPoint,
  RegionId,
  TrendStatus,
} from "@/lib/types";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatMonth(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTH_LABELS[m - 1]} ${y}`;
}

export interface NationalOverviewEntry {
  diseaseId: DiseaseId;
  currentMonth: string;
  currentCases: number;
  previousCases: number;
  changePercent: number;
  trendStatus: TrendStatus;
  sparkline: { month: string; cases: number }[];
}

export async function getNationalOverview(): Promise<NationalOverviewEntry[]> {
  const data = await getDiseaseMonthlyData();
  const regions = await getRegions();
  const diseaseIds = Object.keys(data.series) as DiseaseId[];
  const currentMonth = data.meta.currentMonth;
  const months = data.meta.historicalMonths;
  const previousMonth = months[months.length - 2];

  return diseaseIds.map((diseaseId) => {
    const perRegion = data.series[diseaseId];

    const totalsByMonth = new Map<string, number>();
    for (const region of regions) {
      const points = perRegion[region.id] ?? [];
      for (const p of points) {
        if (p.type !== "historical") continue;
        totalsByMonth.set(p.month, (totalsByMonth.get(p.month) ?? 0) + p.cases);
      }
    }

    const currentCases = totalsByMonth.get(currentMonth) ?? 0;
    const previousCases = totalsByMonth.get(previousMonth) ?? 0;
    const changePercent =
      previousCases === 0 ? 0 : ((currentCases - previousCases) / previousCases) * 100;

    const sparklineMonths = months.slice(-6);
    const sparkline = sparklineMonths.map((m) => ({
      month: m,
      cases: totalsByMonth.get(m) ?? 0,
    }));

    return {
      diseaseId,
      currentMonth,
      currentCases,
      previousCases,
      changePercent: Math.round(changePercent * 10) / 10,
      trendStatus: trendStatusFromChange(changePercent),
      sparkline,
    };
  });
}

function trendStatusFromChange(changePercent: number): TrendStatus {
  if (changePercent > 5) return "rising";
  if (changePercent < -5) return "declining";
  return "stable";
}

export interface OutbreakEntry {
  regionId: RegionId;
  regionName: string;
  cases: number;
  intensity: number; // 0..1 normalized against the max region for this disease
  severity: "low" | "moderate" | "high" | "critical";
}

export async function getOutbreakSnapshot(diseaseId: DiseaseId): Promise<OutbreakEntry[]> {
  const data = await getDiseaseMonthlyData();
  const regions = await getRegions();
  const currentMonth = data.meta.currentMonth;
  const perRegion = data.series[diseaseId];

  const raw = regions.map((region) => {
    const points = perRegion[region.id] ?? [];
    const point = points.find((p) => p.month === currentMonth);
    return { region, cases: point?.cases ?? 0 };
  });

  const max = Math.max(1, ...raw.map((r) => r.cases));

  return raw
    .map(({ region, cases }) => {
      const intensity = cases / max;
      let severity: OutbreakEntry["severity"] = "low";
      if (intensity >= 0.85) severity = "critical";
      else if (intensity >= 0.6) severity = "high";
      else if (intensity >= 0.3) severity = "moderate";

      return {
        regionId: region.id,
        regionName: region.name,
        cases,
        intensity,
        severity,
      };
    })
    .sort((a, b) => b.cases - a.cases);
}

export async function getMostAffectedAreas(diseaseId: DiseaseId): Promise<OutbreakEntry[]> {
  return getOutbreakSnapshot(diseaseId);
}

export interface ForecastSeriesPoint {
  month: string;
  monthLabel: string;
  historical: number | null;
  forecast: number | null;
  low: number | null;
  high: number | null;
}

export async function getForecastSeries(
  diseaseId: DiseaseId,
  regionId: RegionId | "national"
): Promise<ForecastSeriesPoint[]> {
  const data = await getDiseaseMonthlyData();
  const regions = await getRegions();
  const perRegion = data.series[diseaseId];

  function pointsFor(rid: RegionId): MonthlyPoint[] {
    return perRegion[rid] ?? [];
  }

  const allMonths = [...data.meta.historicalMonths, ...data.meta.forecastMonths];

  const result: ForecastSeriesPoint[] = allMonths.map((month) => ({
    month,
    monthLabel: formatMonth(month),
    historical: null,
    forecast: null,
    low: null,
    high: null,
  }));

  const byMonth = new Map(result.map((r) => [r.month, r]));

  const regionIds: RegionId[] = regionId === "national" ? regions.map((r) => r.id) : [regionId];

  for (const rid of regionIds) {
    for (const point of pointsFor(rid)) {
      const entry = byMonth.get(point.month);
      if (!entry) continue;
      if (point.type === "historical") {
        entry.historical = (entry.historical ?? 0) + point.cases;
      } else {
        const fp = point as ForecastPoint;
        entry.forecast = (entry.forecast ?? 0) + fp.cases;
        entry.low = (entry.low ?? 0) + fp.low;
        entry.high = (entry.high ?? 0) + fp.high;
      }
    }
  }

  // Bridge the line: carry the last historical point into the forecast series
  // so the chart line is visually continuous between actual and predicted data.
  const lastHistoricalMonth = data.meta.historicalMonths[data.meta.historicalMonths.length - 1];
  const bridgeEntry = byMonth.get(lastHistoricalMonth);
  const firstForecastMonth = data.meta.forecastMonths[0];
  const firstForecastEntry = byMonth.get(firstForecastMonth);
  if (bridgeEntry && firstForecastEntry) {
    firstForecastEntry.forecast = firstForecastEntry.forecast ?? bridgeEntry.historical;
  }

  return result;
}

export interface SeasonalInsight {
  peakMonthLabel: string;
  peakMonthIndex: number;
  lowMonthLabel: string;
  lowMonthIndex: number;
}

export async function getSeasonalInsight(diseaseId: DiseaseId): Promise<SeasonalInsight> {
  const data = await getDiseaseMonthlyData();
  const regions = await getRegions();
  const perRegion = data.series[diseaseId];

  const totalsByMonthIndex = new Array(12).fill(0);
  const countByMonthIndex = new Array(12).fill(0);

  for (const region of regions) {
    const points = (perRegion[region.id] ?? []).filter(
      (p): p is HistoricalPoint => p.type === "historical"
    );
    for (const p of points) {
      const idx = Number(p.month.split("-")[1]) - 1;
      totalsByMonthIndex[idx] += p.cases;
      countByMonthIndex[idx] += 1;
    }
  }

  const averages = totalsByMonthIndex.map((total, i) =>
    countByMonthIndex[i] ? total / countByMonthIndex[i] : 0
  );

  let peakMonthIndex = 0;
  let lowMonthIndex = 0;
  averages.forEach((avg, i) => {
    if (avg > averages[peakMonthIndex]) peakMonthIndex = i;
    if (avg < averages[lowMonthIndex]) lowMonthIndex = i;
  });

  return {
    peakMonthLabel: MONTH_LABELS[peakMonthIndex],
    peakMonthIndex,
    lowMonthLabel: MONTH_LABELS[lowMonthIndex],
    lowMonthIndex,
  };
}

export interface RegionDiseaseTrend {
  regionId: RegionId;
  regionName: string;
  diseaseId: DiseaseId;
  diseaseName: string;
  currentCases: number;
  previousCases: number;
  changePercent: number;
  status: TrendStatus;
  severity: "low" | "moderate" | "high" | "critical";
  nextMonthForecast: number | null;
}

/**
 * The full region x disease matrix (8 regions x 3 diseases = 24 entries) for
 * the current month. This is the foundation for the KPI cards, region grid,
 * priority table, and insights - computed once and sliced/sorted as needed.
 */
export async function getRegionDiseaseTrends(): Promise<RegionDiseaseTrend[]> {
  const data = await getDiseaseMonthlyData();
  const regions = await getRegions();
  const diseases = await getDiseases();
  const currentMonth = data.meta.currentMonth;
  const months = data.meta.historicalMonths;
  const previousMonth = months[months.length - 2];
  const firstForecastMonth = data.meta.forecastMonths[0];

  const results: RegionDiseaseTrend[] = [];

  for (const disease of diseases) {
    const perRegion = data.series[disease.id];

    // Severity is relative to the max region for this disease this month.
    const currentByRegion = regions.map((region) => {
      const points = perRegion[region.id] ?? [];
      const point = points.find((p) => p.month === currentMonth);
      return { region, cases: point?.cases ?? 0 };
    });
    const max = Math.max(1, ...currentByRegion.map((r) => r.cases));

    for (const { region, cases: currentCases } of currentByRegion) {
      const points = perRegion[region.id] ?? [];
      const previousCases = points.find((p) => p.month === previousMonth)?.cases ?? 0;
      const forecastPoint = points.find((p) => p.month === firstForecastMonth);
      const changePercent =
        previousCases === 0 ? 0 : ((currentCases - previousCases) / previousCases) * 100;

      const intensity = currentCases / max;
      let severity: RegionDiseaseTrend["severity"] = "low";
      if (intensity >= 0.85) severity = "critical";
      else if (intensity >= 0.6) severity = "high";
      else if (intensity >= 0.3) severity = "moderate";

      results.push({
        regionId: region.id,
        regionName: region.name,
        diseaseId: disease.id,
        diseaseName: disease.name,
        currentCases,
        previousCases,
        changePercent: Math.round(changePercent * 10) / 10,
        status: trendStatusFromChange(changePercent),
        severity,
        nextMonthForecast:
          forecastPoint && forecastPoint.type === "forecast" ? forecastPoint.cases : null,
      });
    }
  }

  return results;
}

export interface OverviewKpis {
  forecastedNextMonthCases: number;
  risingCount: number;
  decliningCount: number;
  highBurdenCount: number;
  totalPairs: number;
}

export async function getOverviewKpis(): Promise<OverviewKpis> {
  const trends = await getRegionDiseaseTrends();

  return {
    forecastedNextMonthCases: trends.reduce((sum, t) => sum + (t.nextMonthForecast ?? 0), 0),
    risingCount: trends.filter((t) => t.status === "rising").length,
    decliningCount: trends.filter((t) => t.status === "declining").length,
    highBurdenCount: trends.filter((t) => t.severity === "high" || t.severity === "critical")
      .length,
    totalPairs: trends.length,
  };
}

/**
 * The region x disease pairs most worth a decision-maker's attention this
 * month, ranked by a combination of current burden severity and how sharply
 * cases are moving (in either direction).
 */
export async function getPriorityRegions(limit = 8): Promise<RegionDiseaseTrend[]> {
  const trends = await getRegionDiseaseTrends();
  const severityRank: Record<RegionDiseaseTrend["severity"], number> = {
    critical: 3,
    high: 2,
    moderate: 1,
    low: 0,
  };

  return [...trends]
    .sort((a, b) => {
      const scoreA = severityRank[a.severity] * 100 + Math.abs(a.changePercent);
      const scoreB = severityRank[b.severity] * 100 + Math.abs(b.changePercent);
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

export async function getRegionBreakdown(regionId: RegionId): Promise<RegionDiseaseTrend[]> {
  const trends = await getRegionDiseaseTrends();
  return trends.filter((t) => t.regionId === regionId);
}

export interface Insight {
  id: string;
  text: string;
}

/**
 * Short natural-language summaries generated from the current region x
 * disease trend matrix - not hardcoded copy, so they change as the
 * underlying JSON data changes.
 */
export async function getInsights(): Promise<Insight[]> {
  const trends = await getRegionDiseaseTrends();
  const insights: Insight[] = [];

  const biggestRiser = [...trends]
    .filter((t) => t.status === "rising")
    .sort((a, b) => b.changePercent - a.changePercent)[0];
  if (biggestRiser) {
    insights.push({
      id: "biggest-riser",
      text: `${biggestRiser.diseaseName} cases in ${biggestRiser.regionName} are forecast to rise ${biggestRiser.changePercent}% this month, reaching ${biggestRiser.currentCases.toLocaleString("en-US")} reported cases.`,
    });
  }

  const biggestDecliner = [...trends]
    .filter((t) => t.status === "declining")
    .sort((a, b) => a.changePercent - b.changePercent)[0];
  if (biggestDecliner) {
    insights.push({
      id: "biggest-decliner",
      text: `${biggestDecliner.diseaseName} cases in ${biggestDecliner.regionName} have fallen ${Math.abs(biggestDecliner.changePercent)}% since last month, now at ${biggestDecliner.currentCases.toLocaleString("en-US")} reported cases.`,
    });
  }

  const criticalRegion = trends.find((t) => t.severity === "critical");
  if (criticalRegion) {
    insights.push({
      id: "critical-region",
      text: `${criticalRegion.regionName} currently carries the highest ${criticalRegion.diseaseName} case burden of any region, at ${criticalRegion.currentCases.toLocaleString("en-US")} cases this month.`,
    });
  }

  const risingCount = trends.filter((t) => t.status === "rising").length;
  const decliningCount = trends.filter((t) => t.status === "declining").length;
  insights.push({
    id: "national-summary",
    text: `Across Kenya's 8 regions, ${risingCount} region-disease combinations are trending upward this month while ${decliningCount} are trending downward.`,
  });

  return insights;
}
