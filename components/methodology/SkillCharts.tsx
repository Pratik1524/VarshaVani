"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { axisProps, CHART, gridProps, legendProps, tooltipProps } from "@/lib/chartTheme";

/** ILLUSTRATIVE reliability curve: forecast probability bins vs observed frequency. */
const RELIABILITY = [
  { p: 5, perfect: 5, obs: 7, n: 820 },
  { p: 15, perfect: 15, obs: 16, n: 640 },
  { p: 25, perfect: 25, obs: 23, n: 510 },
  { p: 35, perfect: 35, obs: 31, n: 420 },
  { p: 45, perfect: 45, obs: 42, n: 360 },
  { p: 55, perfect: 55, obs: 53, n: 300 },
  { p: 65, perfect: 65, obs: 61, n: 240 },
  { p: 75, perfect: 75, obs: 70, n: 170 },
  { p: 85, perfect: 85, obs: 78, n: 110 },
  { p: 95, perfect: 95, obs: 86, n: 60 },
];

/** ILLUSTRATIVE Brier skill score vs climatology by lead week. */
const SKILL = [
  { week: "Week 1", onset: 0.42, break: 0.38, heavy: 0.31 },
  { week: "Week 2", onset: 0.29, break: 0.27, heavy: 0.18 },
  { week: "Week 3", onset: 0.14, break: 0.15, heavy: 0.07 },
  { week: "Week 4", onset: 0.07, break: 0.08, heavy: 0.02 },
];

const LABEL = { fontSize: 11, fill: CHART.axis } as const;

export function ReliabilityChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={RELIABILITY} margin={{ top: 8, right: 12, left: -10, bottom: 8 }}>
          <CartesianGrid {...gridProps} vertical />
          <XAxis
            dataKey="p"
            type="number"
            domain={[0, 100]}
            unit="%"
            {...axisProps}
            label={{ value: "Forecast probability", position: "insideBottom", offset: -4, ...LABEL }}
          />
          <YAxis
            type="number"
            domain={[0, 100]}
            unit="%"
            {...axisProps}
            label={{ value: "Observed frequency", angle: -90, position: "insideLeft", offset: 22, ...LABEL }}
          />
          <Tooltip {...tooltipProps} />
          <Legend {...legendProps} verticalAlign="top" />
          <Line dataKey="perfect" name="Perfect reliability" stroke={CHART.reference} strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
          <Line dataKey="obs" name="Dry-spell forecasts (illustrative)" stroke={CHART.navy} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: CHART.navy }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SkillByLeadChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={SKILL} margin={{ top: 8, right: 12, left: -10, bottom: 8 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="week" {...axisProps} />
          <YAxis domain={[-0.05, 0.5]} {...axisProps} label={{ value: "Brier skill score", angle: -90, position: "insideLeft", offset: 22, ...LABEL }} />
          <ReferenceLine
            y={0}
            stroke={CHART.red}
            strokeDasharray="4 4"
            label={{ value: "Climatology (no skill)", position: "insideBottomRight", fontSize: 10.5, fill: CHART.red }}
          />
          <Tooltip {...tooltipProps} />
          <Legend {...legendProps} verticalAlign="top" />
          <Line dataKey="onset" name="Onset" stroke={CHART.green} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: CHART.green }} />
          <Line dataKey="break" name="Dry spell" stroke={CHART.amber} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: CHART.amber }} />
          <Line dataKey="heavy" name="Heavy rain" stroke={CHART.navy} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: CHART.navy }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
