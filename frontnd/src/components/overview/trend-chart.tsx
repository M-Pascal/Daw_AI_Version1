"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/utils";

export interface TrendChartSeries {
  diseaseId: string;
  diseaseName: string;
  color: string;
}

export function TrendChart({
  data,
  series,
  boundaryLabel,
}: {
  data: Record<string, string | number | null>[];
  series: TrendChartSeries[];
  boundaryLabel: string | null;
}) {
  const tickInterval = Math.max(2, Math.ceil(data.length / 12) - 1);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="monthLabel"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
          interval={tickInterval}
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
        <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 12, paddingBottom: 16 }} />
        {boundaryLabel && (
          <ReferenceLine
            x={boundaryLabel}
            stroke="var(--color-muted-foreground)"
            strokeDasharray="3 3"
            label={{
              value: "Forecast start",
              position: "insideTopRight",
              fontSize: 11,
              fill: "var(--color-muted-foreground)",
            }}
          />
        )}
        {series.map((s) => (
          <Line
            key={`${s.diseaseId}-historical`}
            type="monotone"
            dataKey={`${s.diseaseId}_historical`}
            name={`${s.diseaseName} cases`}
            stroke={s.color}
            strokeWidth={3}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
        {series.map((s) => (
          <Line
            key={`${s.diseaseId}-forecast`}
            type="monotone"
            dataKey={`${s.diseaseId}_forecast`}
            name={`${s.diseaseName} cases`}
            legendType="none"
            stroke={s.color}
            strokeWidth={3}
            strokeDasharray="6 4"
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
