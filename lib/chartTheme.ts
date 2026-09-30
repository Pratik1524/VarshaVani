/**
 * Shared Recharts theme. Keeps every chart in the app on the VarshaVani
 * palette with the same axis type, grid weight and tooltip chrome.
 */

export const CHART = {
  /** Brand series colours, in the order they should be used. */
  navy: "#1f5592",
  navySoft: "#adcdeb",
  green: "#438c35",
  greenSoft: "#bbdcb0",
  amber: "#e67e0b",
  amberSoft: "#fdd38a",
  red: "#dc2626",
  redSoft: "#fca5a5",
  grid: "#e3e6ea",
  axis: "#64748b",
  reference: "#94a3b8",
} as const;

/** Subtle horizontal-only grid. */
export const gridProps = { stroke: CHART.grid, strokeDasharray: "2 4", vertical: false } as const;

export const axisProps = {
  stroke: CHART.grid,
  tick: { fill: CHART.axis, fontSize: 11 },
  tickLine: false,
} as const;

/** Tooltip chrome matching the app's cards. */
export const tooltipProps = {
  contentStyle: {
    borderRadius: 8,
    border: `1px solid ${CHART.grid}`,
    boxShadow: "0 1px 2px rgb(11 29 51 / 0.05), 0 4px 12px rgb(11 29 51 / 0.05)",
    fontSize: 12,
    padding: "6px 10px",
  },
  labelStyle: { color: "#0b1d33", fontWeight: 600, marginBottom: 2 },
  itemStyle: { padding: 0 },
} as const;

export const legendProps = { wrapperStyle: { fontSize: 11.5, paddingTop: 4 } } as const;
