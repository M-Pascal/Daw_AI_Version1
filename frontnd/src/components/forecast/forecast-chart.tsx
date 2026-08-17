"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/utils";

export interface ForecastChartPoint {
  month: string;
  monthLabel: string;
  historical: number | null;
  forecast: number | null;
  low: number | null;
  high: number | null;
}

export function ForecastChart({
  data,
  diseaseName,
  lastHistoricalMonth,
}: {
  data: ForecastChartPoint[];
  diseaseName: string;
  lastHistoricalMonth: string;
}) {
  const boundary = data.find((d) => d.month === lastHistoricalMonth)?.monthLabel;
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
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {boundary && (
          <ReferenceLine
            x={boundary}
            stroke="var(--color-muted-foreground)"
            strokeDasharray="3 3"
            label={{ value: "Forecast starts", position: "insideTopRight", fontSize: 11, fill: "var(--color-muted-foreground)" }}
          />
        )}
        <Area
          dataKey={(point: ForecastChartPoint) =>
            point.low !== null && point.high !== null ? [point.low, point.high] : null
          }
          name="Forecast range"
          stroke="none"
          fill="var(--color-forecast)"
          fillOpacity={0.12}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="historical"
          name={`${diseaseName} (historical)`}
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          dot={false}
          connectNulls={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="forecast"
          name={`${diseaseName} (forecast)`}
          stroke="var(--color-forecast)"
          strokeWidth={2.5}
          strokeDasharray="6 4"
          dot={false}
          connectNulls
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
