"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { axisProps, CHART, gridProps, tooltipProps } from "@/lib/chartTheme";

/** 12-month index mini chart with ±threshold reference lines. */
export function IndexChart({
  data,
  threshold,
  color,
  unit = "°C",
  goodSide = "negative",
}: {
  data: { month: string; value: number }[];
  threshold: number;
  color: string;
  unit?: string;
  /** Which sign of the index usually helps the Indian monsoon. */
  goodSide?: "positive" | "negative";
}) {
  const id = `g-${color.replace("#", "")}`;
  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="month" interval={1} {...axisProps} />
          <YAxis domain={[-1.2, 1.2]} {...axisProps} />
          <ReferenceLine y={0} stroke={CHART.reference} />
          <ReferenceLine y={threshold} stroke={goodSide === "positive" ? CHART.green : CHART.red} strokeDasharray="4 3" />
          <ReferenceLine y={-threshold} stroke={goodSide === "positive" ? CHART.red : CHART.green} strokeDasharray="4 3" />
          <Tooltip {...tooltipProps} formatter={(v) => [`${Number(v).toFixed(2)} ${unit}`, "Index"]} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${id})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
