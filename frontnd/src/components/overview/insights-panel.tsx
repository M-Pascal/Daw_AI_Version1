import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Insight } from "@/lib/data/derive";

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">DawAI Insights</p>
            <p className="text-xs text-muted-foreground">
              Generated from this month&apos;s disease trend data.
            </p>
          </div>
        </div>

        {insights.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No insights available yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {insights.map((insight) => (
              <div key={insight.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                <p className="text-sm text-foreground">{insight.text}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
