import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Sparkline } from "@/components/overview/sparkline";
import { formatMonth } from "@/lib/data/derive";
import { formatNumber } from "@/lib/utils";
import type { NationalOverviewEntry } from "@/lib/data/derive";
import type { Disease } from "@/lib/types";

export function NationalOverviewCards({
  overview,
  diseases,
}: {
  overview: NationalOverviewEntry[];
  diseases: Disease[];
}) {
  const diseaseById = new Map(diseases.map((d) => [d.id, d]));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {overview.map((entry) => {
        const disease = diseaseById.get(entry.diseaseId);
        if (!disease) return null;

        return (
          <Card key={entry.diseaseId}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <p className="text-sm text-muted-foreground">{disease.fullName}</p>
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {disease.name}
                </p>
              </div>
              <StatusBadge status={entry.trendStatus} />
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold tabular-nums text-foreground">
                    {formatNumber(entry.currentCases)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    reported cases &middot; {formatMonth(entry.currentMonth)}
                  </p>
                </div>
                <p
                  className={
                    entry.changePercent > 0
                      ? "text-sm font-medium text-shortage"
                      : entry.changePercent < 0
                        ? "text-sm font-medium text-surplus"
                        : "text-sm font-medium text-muted-foreground"
                  }
                >
                  {entry.changePercent > 0 ? "+" : ""}
                  {entry.changePercent}% mo/mo
                </p>
              </div>
              <div className="mt-3">
                <Sparkline data={entry.sparkline} id={entry.diseaseId} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
