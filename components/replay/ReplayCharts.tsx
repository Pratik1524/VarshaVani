"use client";

import { useMemo, useState, type ComponentType } from "react";
import { motion } from "framer-motion";
import { BellRing, CloudRain, CloudSun, Droplets, Sprout, Sun, Umbrella, type LucideIcon } from "lucide-react";
import {
  Area,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Rectangle,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryReplay, Zone } from "@/types";
import { axisProps, CHART, gridProps } from "@/lib/chartTheme";
import { fmtDate } from "@/lib/i18n";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

/* ---------------- Palette (no dark reds) ---------------- */

/** Soft coral for dry-spell data. */
export const CORAL = "#f4845f";
/** Warm peach wash for the actual dry-spell period. */
export const DRY_ZONE = "#fde7d3";
export const BROWN = "#b08968";
const SUN = "#fbb84d";
const BAR_COLORS = [CORAL, CHART.green, CHART.amber, CHART.navy, CHART.navySoft, BROWN];
const gradId = (hex: string) => `rp-bar-${hex.replace("#", "")}`;

const d = (iso: string) => fmtDate("en", iso);

/** Mix two hex colours (t = 0 → a, 1 → b). */
function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}
type BarShapeProps = React.ComponentProps<typeof Rectangle> & { payload?: { rain?: number } };
const rainColor = (mm: number) => mix("#bcd6ee", "#173a63", Math.min(1, mm / 32));

/* ---------------- Shared SVG bits ---------------- */

/** Round icon pin drawn at the top of a reference line. */
function EventPin({
  viewBox,
  color,
  icon: Icon,
  text,
  row = 0,
}: {
  viewBox?: { x?: number; y?: number };
  color: string;
  icon: LucideIcon;
  text: string;
  /** 0 = top row, 1 = one row lower (avoids overlapping neighbours). */
  row?: number;
}) {
  if (!viewBox || viewBox.x === undefined || viewBox.y === undefined) return null;
  const x = viewBox.x;
  const y = viewBox.y + row * 26;
  const I = Icon as ComponentType<{ x: number; y: number; width: number; height: number; color: string; strokeWidth: number }>;
  return (
    <g style={{ pointerEvents: "none" }}>
      <circle cx={x} cy={y - 13} r={11} fill={color} stroke="#fff" strokeWidth={2.5} style={{ filter: "drop-shadow(0 2px 3px rgb(11 29 51 / 0.25))" }} />
      <I x={x - 6.5} y={y - 19.5} width={13} height={13} color="#fff" strokeWidth={2.4} />
      <text x={x + 15} y={y - 9} fontSize={10.5} fontWeight={700} fill={color} paintOrder="stroke" stroke="#fff" strokeWidth={3}>
        {text}
      </text>
    </g>
  );
}

/* ================================================================
 * 1. Daily rainfall story chart
 * ================================================================ */

interface Phase {
  key: string;
  label: string;
  from: number; // index into daily
  to: number; // exclusive
  cls: string;
  icon: LucideIcon;
}

export function RainfallStoryChart({ replay }: { replay: HistoryReplay }) {
  const ev = useMemo(() => Object.fromEntries(replay.events.map((e) => [e.kind, e.date])) as Record<string, string>, [replay]);

  const data = useMemo(() => {
    const running = replay.daily.reduce<number[]>((acc, day) => [...acc, (acc[acc.length - 1] ?? 0) + day.rainMm], []);
    return replay.daily.map((day, i) => {
      const cum = running[i];
      const wk = replay.predictedBreak.find((p) => {
        const end = new Date(`${p.weekStart}T00:00:00Z`);
        end.setUTCDate(end.getUTCDate() + 7);
        return day.date >= p.weekStart && day.date < end.toISOString().slice(0, 10);
      });
      return { date: day.date, rain: day.rainMm, predicted: wk ? wk.prob : null, cum: +cum.toFixed(1) };
    });
  }, [replay]);

  const [range, setRange] = useState({ start: 0, end: data.length - 1 });
  const idx = (iso?: string) => (iso ? data.findIndex((x) => x.date === iso) : -1);

  // Headline numbers
  const total = data[data.length - 1]?.cum ?? 0;
  const rainyDays = data.filter((x) => x.rain >= 2.5).length;
  let longestDry = 0;
  for (let run = 0, i = 0; i < data.length; i++) {
    run = data[i].rain < 1 ? run + 1 : 0;
    longestDry = Math.max(longestDry, run);
  }
  const peak = Math.max(...replay.predictedBreak.map((p) => p.prob));

  // Story ribbon: phases of the season, clipped to the zoomed window.
  const iEarly = Math.max(0, idx(ev.early_rain));
  const iDry = Math.max(iEarly, idx(ev.dry_spell));
  const iRev = Math.max(iDry, idx(ev.revival));
  const phases: Phase[] = [
    { key: "pre", label: "Pre-monsoon", from: 0, to: iEarly, cls: "bg-slate-100 text-slate-600", icon: CloudSun },
    { key: "early", label: "Early showers & sowing", from: iEarly, to: iDry, cls: "bg-monsoon-100 text-monsoon-800", icon: CloudRain },
    { key: "dry", label: `Dry spell · ${replay.dryDays} days`, from: iDry, to: iRev, cls: "bg-[#fcd9c2] text-[#9a3412]", icon: Sun },
    { key: "rev", label: "Monsoon revives", from: iRev, to: data.length, cls: "bg-leaf-100 text-leaf-800", icon: Umbrella },
  ];
  const visible = range.end - range.start + 1;
  const clipped = phases
    .map((p) => ({ ...p, n: Math.max(0, Math.min(p.to, range.end + 1) - Math.max(p.from, range.start)) }))
    .filter((p) => p.n > 0);

  // Reference items only render when inside the zoomed window.
  const inView = (iso?: string) => {
    const i = idx(iso);
    return i >= range.start && i <= range.end;
  };
  const clampDate = (iso: string) => data[Math.min(range.end, Math.max(range.start, idx(iso)))]?.date;
  const dryShown = ev.dry_spell && ev.revival && idx(ev.revival) >= range.start && idx(ev.dry_spell) <= range.end;

  const pins: { kind: string; color: string; icon: LucideIcon; text: string; dashed?: boolean }[] = [
    { kind: "warning", color: CHART.green, icon: BellRing, text: "Warning" },
    { kind: "early_rain", color: CHART.navy, icon: CloudRain, text: "Early rain" },
    { kind: "sowing", color: CHART.amber, icon: Sprout, text: "Sowing", dashed: true },
    { kind: "revival", color: "#4a89c7", icon: Umbrella, text: "Revival", dashed: true },
  ];

  // Pins closer than ~12% of the visible window drop to a second row.
  const placedPins = pins
    .filter((p) => ev[p.kind] && inView(ev[p.kind]))
    .map((p) => ({ ...p, i: idx(ev[p.kind]) }))
    .sort((a, b) => a.i - b.i)
    .reduce<(typeof pins[number] & { i: number; row: number })[]>((acc, p) => {
      const prev = acc[acc.length - 1];
      const close = prev && p.i - prev.i < visible * 0.12;
      acc.push({ ...p, row: close ? (prev.row === 0 ? 1 : 0) : 0 });
      return acc;
    }, []);

  const LEFT = 48;
  const RIGHT = 44;

  return (
    <div>
      {/* Stat chips */}
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { icon: Droplets, label: "Total rain, Jun–Jul", value: `${Math.round(total)} mm`, tone: "from-monsoon-50 text-monsoon-800 ring-monsoon-100" },
          { icon: CloudRain, label: "Rainy days (≥ 2.5 mm)", value: `${rainyDays} of ${data.length}`, tone: "from-sky-50 text-sky-800 ring-sky-100" },
          { icon: Sun, label: "Longest dry run", value: `${longestDry} days`, tone: "from-orange-50 text-orange-800 ring-orange-100" },
          { icon: BellRing, label: "Peak warning issued", value: `${peak}%`, tone: "from-leaf-50 text-leaf-800 ring-leaf-100" },
        ].map((s, i) => (
          <motion.li
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-control bg-gradient-to-br to-white px-3 py-2.5 ring-1 ${s.tone}`}
          >
            <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.07em] opacity-80">
              <s.icon className="h-3.5 w-3.5" aria-hidden /> {s.label}
            </p>
            <p className="mt-1 text-[1.15rem] font-bold leading-none tabular-nums text-ink">{s.value}</p>
          </motion.li>
        ))}
      </ul>

      <div className="mt-4 rounded-card bg-gradient-to-b from-monsoon-50/70 via-white to-white p-2 pb-1 ring-1 ring-line">
        {/* Season ribbon, aligned with the plot area */}
        <div className="flex h-7 gap-0.5 overflow-hidden" style={{ marginLeft: LEFT, marginRight: RIGHT }} aria-label="Season phases">
          {clipped.map((p) => (
            <motion.div
              key={p.key}
              layout
              className={`flex min-w-0 items-center justify-center gap-1 rounded-md px-1.5 text-[10.5px] font-semibold ${p.cls}`}
              style={{ flexGrow: p.n, flexBasis: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              title={`${p.label}: ${p.n} days`}
            >
              <p.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{p.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="mm-brush h-[22rem]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 34, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rp-prob-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={CORAL} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CORAL} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="rp-prob-stroke" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor={SUN} />
                  <stop offset="100%" stopColor={CORAL} />
                </linearGradient>
                <linearGradient id="rp-cum" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7aaddc" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#7aaddc" stopOpacity={0} />
                </linearGradient>
                <pattern id="rp-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="8" height="8" fill={DRY_ZONE} />
                  <line x1="0" y1="0" x2="0" y2="8" stroke={CORAL} strokeOpacity={0.22} strokeWidth={3} />
                </pattern>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="date" tickFormatter={d} minTickGap={28} {...axisProps} />
              <YAxis yAxisId="rain" unit="mm" width={LEFT} {...axisProps} />
              <YAxis yAxisId="p" orientation="right" domain={[0, 100]} unit="%" width={RIGHT} {...axisProps} />
              <YAxis yAxisId="cum" hide domain={[0, (max: number) => max * 1.15]} />
              <Tooltip
                cursor={{ stroke: CHART.reference, strokeDasharray: "3 3" }}
                content={
                  <ChartTooltip
                    labelFormatter={(v) => fmtDate("en", v, { weekday: "short", day: "numeric", month: "short" })}
                    valueFormatter={(v, name) => (name === "Dry-spell chance" ? `${v}%` : `${v} mm`)}
                    colorFor={(name) => (name === "Dry-spell chance" ? CORAL : name === "Daily rain" ? "#2c6cae" : "#7aaddc")}
                    footer={(p) => {
                      const day = String((p[0] as { payload?: { date?: string } } | undefined)?.payload?.date ?? "");
                      return ev.dry_spell && ev.revival && day >= ev.dry_spell && day < ev.revival ? "☀ Inside the actual dry spell" : null;
                    }}
                  />
                }
              />
              {dryShown && (
                <ReferenceArea yAxisId="rain" x1={clampDate(ev.dry_spell)} x2={clampDate(ev.revival)} fill="url(#rp-hatch)" fillOpacity={1} stroke={CORAL} strokeOpacity={0.35} />
              )}
              <Area
                yAxisId="cum"
                type="monotone"
                dataKey="cum"
                name="Rain so far"
                stroke="#7aaddc"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="url(#rp-cum)"
                dot={false}
                activeDot={false}
                animationDuration={1400}
              />
              <Bar
                yAxisId="rain"
                dataKey="rain"
                name="Daily rain"
                radius={[4, 4, 0, 0]}
                maxBarSize={12}
                animationDuration={900}
                // Colour from each bar's own value, so it stays right when the brush zooms.
                shape={(props: BarShapeProps) => <Rectangle {...props} fill={rainColor(Number(props.payload?.rain ?? 0))} />}
              />
              <Area
                yAxisId="p"
                type="stepAfter"
                dataKey="predicted"
                name="Dry-spell chance"
                stroke="url(#rp-prob-stroke)"
                strokeWidth={3}
                fill="url(#rp-prob-fill)"
                dot={false}
                activeDot={{ r: 5, fill: "#fff", stroke: CORAL, strokeWidth: 2.5 }}
                connectNulls={false}
                animationDuration={1300}
              />
              {placedPins.map((p) => (
                <ReferenceLine
                  key={p.kind}
                  yAxisId="rain"
                  x={ev[p.kind]}
                  stroke={p.color}
                  strokeWidth={p.dashed ? 1.5 : 2}
                  strokeDasharray={p.dashed ? "4 3" : undefined}
                  label={<EventPin color={p.color} icon={p.icon} text={p.text} row={p.row} />}
                />
              ))}
              <Brush
                dataKey="date"
                height={30}
                travellerWidth={9}
                stroke="#4a89c7"
                fill="#f8fafc"
                tickFormatter={d}
                startIndex={range.start}
                endIndex={range.end}
                onChange={(r) => {
                  const s = r.startIndex ?? 0;
                  const e = r.endIndex ?? data.length - 1;
                  if (s !== range.start || e !== range.end) setRange({ start: s, end: e });
                }}
              >
                <BarChart data={data}>
                  <Bar dataKey="rain" fill="#adcdeb" />
                </BarChart>
              </Brush>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key + zoom hint */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] font-medium text-body">
          <li className="flex items-center gap-1.5">
            <span className="flex h-3 items-end gap-px" aria-hidden>
              {[4, 8, 12].map((h, i) => (
                <span key={h} className="w-1 rounded-sm" style={{ height: h, background: rainColor(i * 14 + 2) }} />
              ))}
            </span>
            Daily rain (darker = heavier)
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-0 w-4 border-t-2 border-dashed border-[#7aaddc]" aria-hidden /> Rain so far
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-4 rounded-sm border-t-[3px]" style={{ borderColor: CORAL, background: `${CORAL}33` }} aria-hidden /> Dry-spell chance
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-3 w-4 rounded-sm" style={{ background: `repeating-linear-gradient(45deg, ${DRY_ZONE} 0 3px, #fbcfb3 3px 5px)` }} aria-hidden /> Actual
            dry spell
          </li>
        </ul>
        <p className="text-[11px] text-muted">
          Drag the handles below the chart to zoom{visible < data.length && ` · showing ${visible} of ${data.length} days`}
          {visible < data.length && (
            <button type="button" onClick={() => setRange({ start: 0, end: data.length - 1 })} className="ml-2 font-semibold text-monsoon-700 hover:underline">
              Reset zoom
            </button>
          )}
        </p>
      </div>
    </div>
  );
}

/* ================================================================
 * 2. Year-wise / block-wise distribution chart
 * ================================================================ */

export interface DistRow {
  key: string;
  year: number;
  blockId: string;
  zone?: Exclude<Zone, "Konkan">;
  value: number;
  june: number;
  july: number;
  on: boolean;
  color: string;
}

type LabelProps = { x?: number | string; y?: number | string; width?: number | string; index?: number; value?: unknown };

export function DistributionChart({
  series,
  scope,
  isRain,
  avg,
  label,
  fmtV,
  onPick,
  ensoOf,
}: {
  series: DistRow[];
  scope: "years" | "blocks";
  isRain: boolean;
  avg: number;
  label: string;
  fmtV: (v: number) => string;
  onPick: (i: number) => void;
  ensoOf: (year: number) => { text: string; cls: string };
}) {
  const years = scope === "years";

  /** Value pill above each bar; the selected one is solid navy. */
  const renderPill = (p: LabelProps) => {
    const x = Number(p.x ?? 0);
    const y = Number(p.y ?? 0);
    const w = Number(p.width ?? 0);
    const row = series[p.index ?? 0];
    if (!row) return null;
    const text = isRain ? `${row.june + row.july} mm` : fmtV(row.value);
    const pw = text.length * 6.4 + 14;
    const cx = x + w / 2;
    return (
      <g style={{ pointerEvents: "none" }}>
        <rect
          x={cx - pw / 2}
          y={y - 26}
          width={pw}
          height={19}
          rx={9.5}
          fill={row.on ? "#0b1d33" : "#ffffff"}
          stroke={row.on ? "#0b1d33" : "#e3e6ea"}
          style={{ filter: "drop-shadow(0 1px 2px rgb(11 29 51 / 0.12))" }}
        />
        <text x={cx} y={y - 13} textAnchor="middle" fontSize={11} fontWeight={700} fill={row.on ? "#ffffff" : "#334155"}>
          {text}
        </text>
      </g>
    );
  };

  /** Year + ENSO tag, or a rotated block name. */
  const renderTick = ({ x, y, payload, index }: { x?: number | string; y?: number | string; payload?: { value: string }; index?: number }) => {
    const row = series[index ?? 0];
    const X = Number(x ?? 0);
    const Y = Number(y ?? 0);
    if (!payload) return null;
    if (years) {
      const e = ensoOf(Number(payload.value));
      return (
        <g transform={`translate(${X},${Y})`}>
          <text y={14} textAnchor="middle" fontSize={13} fontWeight={row?.on ? 800 : 600} fill={row?.on ? "#0b1d33" : "#475569"}>
            {payload.value}
          </text>
          <text y={30} textAnchor="middle" fontSize={10} fontWeight={600} fill={e.cls}>
            {e.text}
          </text>
        </g>
      );
    }
    return (
      <g transform={`translate(${X},${Y + 4})`}>
        <text transform="rotate(-45)" textAnchor="end" fontSize={10} fontWeight={row?.on ? 800 : 500} fill={row?.on ? "#0b1d33" : "#64748b"}>
          {payload.value}
        </text>
      </g>
    );
  };

  const renderAvg = ({ viewBox }: { viewBox?: { x?: number; y?: number; width?: number } }) => {
    if (!viewBox) return null;
    const text = `avg ${fmtV(avg)}`;
    const w = text.length * 5.8 + 12;
    const x = (viewBox.x ?? 0) + (viewBox.width ?? 0) - w;
    const y = viewBox.y ?? 0;
    return (
      <g>
        <rect x={x} y={y - 9} width={w} height={18} rx={9} fill="#f1f5f9" stroke="#cbd2da" />
        <text x={x + w / 2} y={y + 4} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#475569">
          {text}
        </text>
      </g>
    );
  };

  return (
    <div className={`rounded-card bg-gradient-to-b from-slate-50 to-white p-2 ring-1 ring-line ${years ? "h-80" : "h-[22rem]"}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 32, right: 8, left: -8, bottom: years ? 8 : 44 }} barCategoryGap={years ? "22%" : "18%"}>
          <defs>
            {BAR_COLORS.map((c) => (
              <linearGradient key={c} id={gradId(c)} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity={1} />
                <stop offset="100%" stopColor={c} stopOpacity={0.5} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="key" {...axisProps} interval={0} height={years ? 40 : 60} tick={renderTick} />
          <YAxis {...axisProps} />
          <Tooltip
            cursor={{ fill: "rgba(31,85,146,0.06)", radius: 8 }}
            content={
              <ChartTooltip
                valueFormatter={(v) => (isRain ? `${v} mm` : fmtV(v))}
                colorFor={(name) => (name === "June" ? CHART.navySoft : name === "July" ? CHART.navy : series.find((x) => x.on)?.color)}
                footer={(p) => {
                  if (isRain) return `Total ${p.reduce((s, i) => s + Number(i.value ?? 0), 0)} mm`;
                  const v = Number(p[0]?.value ?? 0);
                  return avg > 0 ? `${v >= avg ? "▲ +" : "▼ "}${Math.round(((v - avg) / avg) * 100)}% vs average · click to open` : null;
                }}
              />
            }
          />
          {!isRain && <ReferenceLine y={avg} stroke="#94a3b8" strokeDasharray="5 4" label={renderAvg} />}

          {isRain ? (
            <>
              <Bar
                dataKey="june"
                name="June"
                stackId="rain"
                fill={`url(#${gradId(CHART.navySoft)})`}
                background={{ fill: "#eef2f7", radius: 10 }}
                maxBarSize={years ? 60 : 20}
                cursor="pointer"
                onClick={(_, i) => onPick(i)}
                animationDuration={800}
              >
                {series.map((x) => (
                  <Cell key={x.key} fillOpacity={x.on ? 1 : 0.55} />
                ))}
              </Bar>
              <Bar
                dataKey="july"
                name="July"
                stackId="rain"
                fill={`url(#${gradId(CHART.navy)})`}
                radius={[10, 10, 0, 0]}
                maxBarSize={years ? 60 : 20}
                cursor="pointer"
                onClick={(_, i) => onPick(i)}
                animationDuration={800}
              >
                {series.map((x) => (
                  <Cell key={x.key} fillOpacity={x.on ? 1 : 0.5} />
                ))}
                {years && <LabelList content={renderPill} />}
              </Bar>
            </>
          ) : (
            <Bar
              dataKey="value"
              name={label}
              radius={[10, 10, 3, 3]}
              background={{ fill: "#eef2f7", radius: 10 }}
              maxBarSize={years ? 60 : 20}
              cursor="pointer"
              onClick={(_, i) => onPick(i)}
              activeBar={{ fillOpacity: 1 }}
              animationDuration={800}
            >
              {series.map((x) => (
                <Cell
                  key={x.key}
                  fill={`url(#${gradId(x.color)})`}
                  fillOpacity={x.on ? 1 : 0.5}
                  stroke={x.on ? x.color : "none"}
                  strokeWidth={x.on ? 2 : 0}
                  style={x.on ? { filter: `drop-shadow(0 6px 10px ${x.color}66)` } : undefined}
                />
              ))}
              {years && <LabelList content={renderPill} />}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
      {isRain && (
        <p className="-mt-1 flex justify-center gap-4 pb-1 text-[11.5px] text-body">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART.navySoft }} aria-hidden /> June
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART.navy }} aria-hidden /> July
          </span>
        </p>
      )}
    </div>
  );
}
