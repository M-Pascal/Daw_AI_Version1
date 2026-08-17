import { ArrowDownRight, ArrowUpRight, Radar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { OverviewKpis } from "@/lib/data/derive";

export function OverviewKpiCards({ kpis }: { kpis: OverviewKpis }) {
  const cards = [
    {
      label: "Forecasted cases",
      value: formatNumber(kpis.forecastedNextMonthCases),
      description: `Next month · 8 regions · 3 diseases`,
      Icon: TrendingUp,
      iconClassName: "bg-primary/10 text-primary",
    },
    {
      label: "Rising trends",
      value: String(kpis.risingCount),
      description: `of ${kpis.totalPairs} region-disease pairs`,
      Icon: ArrowUpRight,
      iconClassName: "bg-shortage/10 text-shortage",
    },
    {
      label: "Declining trends",
      value: String(kpis.decliningCount),
      description: `of ${kpis.totalPairs} region-disease pairs`,
      Icon: ArrowDownRight,
      iconClassName: "bg-surplus/15 text-surplus",
    },
    {
      label: "High-burden regions",
      value: String(kpis.highBurdenCount),
      description: "flagged high or critical this month",
      Icon: Radar,
      iconClassName: "bg-forecast/10 text-forecast",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconClassName}`}>
              <card.Icon className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums text-foreground">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
