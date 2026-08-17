import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatNumber } from "@/lib/utils";
import type { RegionDiseaseTrend } from "@/lib/data/derive";

export function PriorityTable({ rows }: { rows: RegionDiseaseTrend[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority regions</CardTitle>
        <CardDescription>
          The region-disease combinations most worth attention this month, ranked by current
          burden and how sharply cases are moving.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Region</th>
                  <th className="py-2 pr-4 font-medium">Disease</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Cases</th>
                  <th className="py-2 pr-4 font-medium">Trend</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={`${row.regionId}-${row.diseaseId}`}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-foreground">{row.regionName}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{row.diseaseName}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-foreground">
                      {formatNumber(row.currentCases)}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-foreground">
                      {row.changePercent > 0 ? "+" : ""}
                      {row.changePercent}%
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/forecast?disease=${row.diseaseId}&region=${row.regionId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        View forecast &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
