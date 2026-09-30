"use client";

import type { MjoPoint } from "@/types";
import { MJO_INDIA_EFFECT } from "@/data/drivers";

/**
 * Wheeler-Hendon style RMM phase diagram (phases 1-8). Sectors are tinted by
 * the phase's typical effect on Indian monsoon rain (green = active,
 * red = break tendency). The trajectory shows the last 30 days (solid) and
 * a 10-day outlook (dashed).
 */
export function MjoWheel({
  phase,
  amplitude,
  trajectory = [],
  size = 320,
  highlight = null,
  onPhaseHover,
  onPhaseSelect,
  animated = false,
}: {
  phase: number;
  amplitude: number;
  trajectory?: MjoPoint[];
  size?: number;
  /** Phase to spotlight (e.g. the row hovered in a table). */
  highlight?: number | null;
  onPhaseHover?: (phase: number | null) => void;
  onPhaseSelect?: (phase: number) => void;
  /** Draw the trajectory in and fade sectors on mount. */
  animated?: boolean;
}) {
  const interactive = !!(onPhaseHover || onPhaseSelect);
  const c = 160;
  const R = 130; // radius for amplitude 3
  const scale = R / 3;
  const toXY = (rmm1: number, rmm2: number) => [c + rmm1 * scale, c - rmm2 * scale] as const;
  const polar = (deg: number, r: number) => {
    const rad = (deg * Math.PI) / 180;
    return [c + r * Math.cos(rad), c - r * Math.sin(rad)] as const;
  };

  const sector = (p: number) => {
    const a0 = 180 + 45 * (p - 1);
    const a1 = a0 + 45;
    const r0 = scale; // amplitude 1 circle
    const [x0, y0] = polar(a0, r0);
    const [x1, y1] = polar(a0, R);
    const [x2, y2] = polar(a1, R);
    const [x3, y3] = polar(a1, r0);
    return `M${x0},${y0} L${x1},${y1} A${R},${R} 0 0 0 ${x2},${y2} L${x3},${y3} A${r0},${r0} 0 0 1 ${x0},${y0} Z`;
  };

  const tint = (e: number) => (e >= 0.3 ? "#16a34a" : e <= -0.3 ? "#dc2626" : "#eab308");
  const observed = trajectory.filter((p) => !p.forecast);
  const forecast = trajectory.filter((p, i, arr) => p.forecast || (arr[i + 1]?.forecast ?? false));
  const path = (pts: MjoPoint[]) => pts.map((p, i) => `${i ? "L" : "M"}${toXY(p.rmm1, p.rmm2).join(",")}`).join(" ");

  // Current state marker (uses the phase centre if no trajectory is given)
  const last = observed[observed.length - 1];
  const centre = 180 + 45 * (phase - 1) + 22.5;
  const [mx, my] = last && trajectory.length ? toXY(last.rmm1, last.rmm2) : polar(centre, Math.min(amplitude, 3) * scale);

  return (
    <svg
      viewBox="0 0 320 320"
      width="100%"
      style={{ maxWidth: size }}
      role="img"
      aria-label={`MJO phase diagram. Current phase ${phase}, amplitude ${amplitude.toFixed(1)}.`}
      className="mx-auto"
    >
      {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
        const e = MJO_INDIA_EFFECT[p];
        const active = p === phase;
        const lit = highlight === p;
        return (
          <path
            key={p}
            d={sector(p)}
            fill={tint(e)}
            fillOpacity={lit ? 0.62 : active ? 0.45 : highlight ? 0.08 : 0.14}
            stroke={active || lit ? "#0b1d33" : "#ffffff"}
            strokeWidth={active || lit ? 2.5 : 1.5}
            style={{
              transition: "fill-opacity 200ms ease, stroke-width 200ms ease",
              cursor: interactive ? "pointer" : undefined,
              ...(animated ? { animation: `mm-sector-in 0.5s ease-out ${p * 60}ms both` } : {}),
            }}
            onMouseEnter={onPhaseHover ? () => onPhaseHover(p) : undefined}
            onMouseLeave={onPhaseHover ? () => onPhaseHover(null) : undefined}
            onClick={onPhaseSelect ? () => onPhaseSelect(p) : undefined}
          />
        );
      })}
      <circle cx={c} cy={c} r={scale} fill="#f8fafc" stroke="#94a3b8" strokeDasharray="3 3" />
      <text x={c} y={c + 4} textAnchor="middle" fontSize="10" fill="#64748b">
        weak
      </text>
      <line x1={c - R} y1={c} x2={c + R} y2={c} stroke="#cbd5e1" />
      <line x1={c} y1={c - R} x2={c} y2={c + R} stroke="#cbd5e1" />
      <line x1={c - R * 0.707} y1={c - R * 0.707} x2={c + R * 0.707} y2={c + R * 0.707} stroke="#e2e8f0" />
      <line x1={c - R * 0.707} y1={c + R * 0.707} x2={c + R * 0.707} y2={c - R * 0.707} stroke="#e2e8f0" />

      {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
        const [x, y] = polar(180 + 45 * (p - 1) + 22.5, R * 0.83);
        return (
          <text key={p} x={x} y={y + 5} textAnchor="middle" fontSize="15" fontWeight={p === phase ? 800 : 600} fill={p === phase ? "#0b1d33" : "#334155"}>
            {p}
          </text>
        );
      })}

      {/* Region labels */}
      <text x={c} y={c + R + 18} textAnchor="middle" fontSize="11" fill="#475569">
        Indian Ocean
      </text>
      <text x={c} y={c - R - 8} textAnchor="middle" fontSize="11" fill="#475569">
        Western Pacific
      </text>
      <text x={c + R + 4} y={c - 6} fontSize="11" fill="#475569" transform={`rotate(90 ${c + R + 4} ${c - 6})`} textAnchor="middle">
        Maritime Cont.
      </text>
      <text x={c - R - 6} y={c} fontSize="11" fill="#475569" transform={`rotate(-90 ${c - R - 6} ${c})`} textAnchor="middle">
        W. Hem. &amp; Africa
      </text>

      {observed.length > 1 && (
        <path
          d={path(observed)}
          fill="none"
          stroke="#1a4577"
          strokeWidth={2.5}
          strokeLinejoin="round"
          pathLength={animated ? 1 : undefined}
          strokeDasharray={animated ? 1 : undefined}
          style={animated ? { animation: "mm-draw 1.6s ease-out 0.4s both", pointerEvents: "none" } : { pointerEvents: "none" }}
        />
      )}
      {forecast.length > 1 && (
        <path
          d={path(forecast)}
          fill="none"
          stroke="#1a4577"
          strokeWidth={2}
          strokeDasharray="5 4"
          style={animated ? { animation: "mm-fade-in 0.6s ease-out 1.9s both", pointerEvents: "none" } : { pointerEvents: "none" }}
        />
      )}
      {observed[0] && <circle cx={toXY(observed[0].rmm1, observed[0].rmm2)[0]} cy={toXY(observed[0].rmm1, observed[0].rmm2)[1]} r={4} fill="#94a3b8" />}
      <circle cx={mx} cy={my} r={8} fill="#f99f24" stroke="#0b1d33" strokeWidth={2.5}>
        <animate attributeName="r" values="7;10;7" dur="1.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
