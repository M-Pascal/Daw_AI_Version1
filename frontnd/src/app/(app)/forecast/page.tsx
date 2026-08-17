import { getDiseases, getRegions } from "@/lib/data/store";
import { getForecastSeries, getSeasonalInsight } from "@/lib/data/derive";
import { ForecastExplorer } from "@/components/forecast/forecast-explorer";
import type { DiseaseId, RegionId } from "@/lib/types";

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: Promise<{ disease?: string; region?: string }>;
}) {
  const params = await searchParams;
  const [diseases, regions] = await Promise.all([getDiseases(), getRegions()]);

  const requestedDisease = diseases.find((d) => d.id === (params.disease as DiseaseId));
  const defaultDisease = requestedDisease ?? diseases[0];

  const requestedRegion = regions.find((r) => r.id === (params.region as RegionId));
  const defaultRegionId: RegionId | "national" = requestedRegion ? requestedRegion.id : "national";
  const defaultRegionName = requestedRegion ? requestedRegion.name : "National (all regions)";

  const [series, seasonal] = defaultDisease
    ? await Promise.all([
        getForecastSeries(defaultDisease.id, defaultRegionId),
        getSeasonalInsight(defaultDisease.id),
      ])
    : [[], null];

  const historicalPoints = series.filter((p) => p.historical !== null);
  const currentCases = historicalPoints[historicalPoints.length - 1]?.historical ?? 0;
  const previousCases = historicalPoints[historicalPoints.length - 2]?.historical ?? 0;
  const changePercent =
    previousCases === 0 ? 0 : ((currentCases - previousCases) / previousCases) * 100;
  const trendStatus = changePercent > 5 ? "rising" : changePercent < -5 ? "declining" : "stable";
  const nextForecastPoint = series.find((p) => p.forecast !== null && p.historical === null);

  const initialData = defaultDisease
    ? {
        disease: defaultDisease,
        regionId: defaultRegionId,
        regionName: defaultRegionName,
        series,
        seasonal,
        trend: {
          currentCases,
          previousCases,
          changePercent: Math.round(changePercent * 10) / 10,
          status: trendStatus as "rising" | "declining" | "stable",
        },
        nextMonth: nextForecastPoint
          ? { month: nextForecastPoint.month, cases: nextForecastPoint.forecast }
          : null,
      }
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Disease Forecast
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Predicted monthly disease burden by region, generated from historical
          case patterns to help identify rising disease activity early.
        </p>
      </div>

      {diseases.length > 0 ? (
        <ForecastExplorer
          diseases={diseases}
          regions={regions}
          initialData={initialData}
          initialDiseaseId={defaultDisease?.id}
          initialRegionId={defaultRegionId}
        />
      ) : (
        <p className="text-sm text-muted-foreground">No forecast data available.</p>
      )}
    </div>
  );
}
