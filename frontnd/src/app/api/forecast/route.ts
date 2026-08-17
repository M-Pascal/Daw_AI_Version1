import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDiseases, getRegions } from "@/lib/data/store";
import { getForecastSeries, getSeasonalInsight } from "@/lib/data/derive";
import type { DiseaseId, RegionId, TrendStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const diseaseId = searchParams.get("disease") as DiseaseId | null;
  const regionParam = (searchParams.get("region") ?? "national") as RegionId | "national";

  const [diseases, regions] = await Promise.all([getDiseases(), getRegions()]);
  const disease = diseases.find((d) => d.id === diseaseId);

  if (!disease) {
    return NextResponse.json({ error: "Unknown disease." }, { status: 400 });
  }

  if (regionParam !== "national" && !regions.some((r) => r.id === regionParam)) {
    return NextResponse.json({ error: "Unknown region." }, { status: 400 });
  }

  const [series, seasonal] = await Promise.all([
    getForecastSeries(disease.id, regionParam),
    getSeasonalInsight(disease.id),
  ]);

  const historicalPoints = series.filter((p) => p.historical !== null);
  const currentCases = historicalPoints[historicalPoints.length - 1]?.historical ?? 0;
  const previousCases = historicalPoints[historicalPoints.length - 2]?.historical ?? 0;
  const changePercent =
    previousCases === 0 ? 0 : ((currentCases - previousCases) / previousCases) * 100;

  let trendStatus: TrendStatus = "stable";
  if (changePercent > 5) trendStatus = "rising";
  else if (changePercent < -5) trendStatus = "declining";

  const nextForecastPoint = series.find((p) => p.forecast !== null && p.historical === null);

  const regionName =
    regionParam === "national" ? "National (all regions)" : regions.find((r) => r.id === regionParam)?.name ?? "Unknown";

  return NextResponse.json({
    disease,
    regionId: regionParam,
    regionName,
    series,
    seasonal,
    trend: {
      currentCases,
      previousCases,
      changePercent: Math.round(changePercent * 10) / 10,
      status: trendStatus,
    },
    nextMonth: nextForecastPoint
      ? { month: nextForecastPoint.month, cases: nextForecastPoint.forecast }
      : null,
  });
}
