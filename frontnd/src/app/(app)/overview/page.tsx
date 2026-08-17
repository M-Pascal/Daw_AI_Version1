import { getDiseases, getRegions } from "@/lib/data/store";
import {
  getInsights,
  getNationalOverview,
  getOutbreakSnapshot,
  getOverviewKpis,
  getPriorityRegions,
  getRegionDiseaseTrends,
} from "@/lib/data/derive";
import { NationalOverviewCards } from "@/components/overview/national-overview-cards";
import { OverviewKpiCards } from "@/components/overview/overview-kpi-cards";
import { TrendExplorer } from "@/components/overview/trend-explorer";
import { RegionStatusGrid } from "@/components/overview/region-status-grid";
import { DiseaseExplorer } from "@/components/overview/disease-explorer";
import { PriorityTable } from "@/components/overview/priority-table";
import { InsightsPanel } from "@/components/overview/insights-panel";
import type { DiseaseId } from "@/lib/types";
import type { OutbreakEntry } from "@/lib/data/derive";

export default async function OverviewPage() {
  const [diseases, regions, overview, kpis, regionTrends, priorityRows, insights] =
    await Promise.all([
      getDiseases(),
      getRegions(),
      getNationalOverview(),
      getOverviewKpis(),
      getRegionDiseaseTrends(),
      getPriorityRegions(8),
      getInsights(),
    ]);

  const outbreakEntries = await Promise.all(
    diseases.map(async (disease) => [disease.id, await getOutbreakSnapshot(disease.id)] as const)
  );
  const outbreaksByDisease = Object.fromEntries(outbreakEntries) as Record<
    DiseaseId,
    OutbreakEntry[]
  >;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          National picture for HIV, TB, and Malaria across Kenya&apos;s 8 regions.
        </p>
      </div>

      {overview.length > 0 ? (
        <NationalOverviewCards overview={overview} diseases={diseases} />
      ) : (
        <p className="text-sm text-muted-foreground">No disease data available.</p>
      )}

      <OverviewKpiCards kpis={kpis} />

      <TrendExplorer diseases={diseases} regions={regions} />

      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Kenya regional status
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a region to inspect its disease trends.
        </p>
        <div className="mt-4">
          <RegionStatusGrid regions={regions} trends={regionTrends} />
        </div>
      </div>

      <DiseaseExplorer diseases={diseases} outbreaksByDisease={outbreaksByDisease} />

      <PriorityTable rows={priorityRows} />

      <InsightsPanel insights={insights} />
    </div>
  );
}
