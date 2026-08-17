"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OutbreakEntry } from "@/lib/data/derive";
import { formatNumber } from "@/lib/utils";

export function MostAffectedChart({
  data,
  diseaseName,
}: {
  data: OutbreakEntry[];
  diseaseName: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No regional data available for {diseaseName}.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
        barCategoryGap={10}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => formatNumber(v)}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="regionName"
          width={100}
          tick={{ fill: "var(--color-foreground)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--color-secondary)" }}
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`${formatNumber(Number(value))} cases`, diseaseName]}
        />
        <Bar dataKey="cases" radius={[0, 6, 6, 0]} maxBarSize={22} isAnimationActive={false}>
          {data.map((entry, index) => (
            <Cell
              key={entry.regionId}
              fill={index === 0 ? "var(--color-kenya-accent)" : "var(--color-primary)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
