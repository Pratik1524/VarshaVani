"use client";

import { useMemo, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import {
  BarChart3,
  BellRing,
  Check,
  CloudRain,
  Gauge,
  History,
  IndianRupee,
  RefreshCw,
  Sprout,
  Sun,
  Thermometer,
  Timer,
  Umbrella,
  Waves,
  Wind,
  X,
  type LucideIcon,
} from "lucide-react";
import type { HistoryEvent, Zone } from "@/types";
import { PageShell } from "@/components/layout/PageShell";
import { CAPTION, MUTED } from "@/lib/ui";
import { CHART } from "@/lib/chartTheme";
import { BROWN, CORAL, DistributionChart, RainfallStoryChart, type DistRow } from "@/components/replay/ReplayCharts";
import { Card, CardHeader, NoteChip, PageTitle } from "@/components/ui/Card";
import { Field, Select } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { CardSkeleton, ErrorState, Skeleton } from "@/components/ui/States";
import { CountUp, Reveal } from "@/components/ui/Motion";
import { SkyBanner } from "@/components/ui/SkyBanner";
import { AdvisoryCard } from "@/components/advisory/AdvisoryCard";
import { useAsync } from "@/hooks/useAsync";
import { getReplay, getReplayDistribution } from "@/lib/forecastService";
import { getAdvisory } from "@/lib/advisoryEngine";
import { BLOCKS, BLOCK_BY_ID } from "@/data/blocks";
import { REPLAY_ASSUMPTIONS, REPLAY_YEARS, hindcastForecast, isReplayEligible, sowingWeek, type ReplaySummary } from "@/data/history";
import { fmtDate } from "@/lib/i18n";
import { driversWithInputs } from "@/lib/whatIf";
import { DRIVERS } from "@/data/drivers";

const EVENT_STYLE: Record<HistoryEvent["kind"], { icon: LucideIcon; cls: string }> = {
  warning: { icon: BellRing, cls: "bg-leaf-600 text-white" },
  early_rain: { icon: CloudRain, cls: "bg-monsoon-600 text-white" },
  sowing: { icon: Sprout, cls: "bg-sun-400 text-slate-900" },
  dry_spell: { icon: Sun, cls: "bg-red-600 text-white" },
  revival: { icon: Umbrella, cls: "bg-monsoon-400 text-white" },
  resowing: { icon: RefreshCw, cls: "bg-orange-500 text-white" },
};

const ZONE_COLOR: Record<Exclude<Zone, "Konkan">, string> = {
  Marathwada: CHART.amber,
  "Western Maharashtra": CHART.green,
  Vidarbha: CHART.navy,
};


type Metric = "dry" | "lead" | "loss" | "sown" | "rain";
type Scope = "years" | "blocks";

const METRICS: Record<Metric, { label: string; unit: string; get: (s: ReplaySummary) => number; decimals?: number; color: string }> = {
  dry: { label: "Dry-spell length", unit: "days", get: (s) => s.dryDays, color: CORAL },
  lead: { label: "Warning lead time", unit: "days", get: (s) => s.warningLeadDays, color: CHART.green },
  loss: { label: "Loss avoided", unit: "₹ cr", get: (s) => s.lossAvoidedCrore, decimals: 1, color: CHART.amber },
  sown: { label: "Early-sown area", unit: "%", get: (s) => s.sownAreaPct, color: BROWN },
  rain: { label: "June + July rain", unit: "mm", get: (s) => s.juneRainMm + s.julyRainMm, color: CHART.navy },
};

const YEARS = [...REPLAY_YEARS].sort((a, b) => a.year - b.year);
const ensoTag = (v: number) => (v >= 1 ? "Strong El Niño" : v >= 0.5 ? "El Niño" : v <= -0.5 ? "La Niña" : "Neutral ENSO");
/** Short ENSO tag + colour for the distribution chart's year labels. */
const ensoOfYear = (y: number) => {
  const v = REPLAY_YEARS.find((t) => t.year === y)?.drivers.enso ?? 0;
  return { text: ensoTag(v), cls: v >= 1 ? "#c2410c" : v >= 0.5 ? "#e67e0b" : v <= -0.5 ? "#1f5592" : "#64748b" };
};

const d = (iso: string) => fmtDate("en", iso);

export default function ReplayPage() {
  const [year, setYear] = useState(2014);
  const [blockId, setBlockId] = useState("latur");
  const [metric, setMetric] = useState<Metric>("dry");
  const [scope, setScope] = useState<Scope>("years");
  const { data: r, error, reload } = useAsync(() => getReplay(year, blockId), `${year}:${blockId}`);
  const dist = useAsync(getReplayDistribution, "replay-distribution");
  const eligible = BLOCKS.filter((b) => isReplayEligible(b.id));

  const current = r && r.year === year && r.blockId === blockId ? r : null;
  const tpl = YEARS.find((y) => y.year === year)!;

  const { ev, advisory, dryWeek } = useMemo(() => {
    if (!current) return { ev: {} as Record<string, string>, advisory: null, dryWeek: null };
    const ev: Record<string, string> = Object.fromEntries(current.events.map((e) => [e.kind, e.date]));
    const t = REPLAY_YEARS.find((y) => y.year === current.year)!;
    const advisory = getAdvisory("soybean", "not_sown", hindcastForecast(current), sowingWeek(current), {
      block: BLOCK_BY_ID[current.blockId],
      drivers: driversWithInputs(DRIVERS, t.drivers),
    });
    // Hindcast week that contains the start of the dry spell.
    const dryWeek = [...current.predictedBreak].reverse().find((p) => ev.dry_spell >= p.weekStart) ?? current.predictedBreak[2];
    return { ev, advisory, dryWeek };
  }, [current]);

  /* ---------- Year-wise distribution ---------- */
  const summaries = dist.data ?? [];
  const m = METRICS[metric];
  const byYear: DistRow[] = YEARS.map((y) => {
    const s = summaries.find((x) => x.year === y.year && x.blockId === blockId);
    return { key: String(y.year), year: y.year, blockId, value: s ? m.get(s) : 0, june: s?.juneRainMm ?? 0, july: s?.julyRainMm ?? 0, on: y.year === year, color: m.color };
  });
  const byBlock: DistRow[] = summaries
    .filter((x) => x.year === year)
    .map((s) => {
      const zone = BLOCK_BY_ID[s.blockId].zone as Exclude<Zone, "Konkan">;
      return { key: BLOCK_BY_ID[s.blockId].name, year, blockId: s.blockId, zone, value: m.get(s), june: s.juneRainMm, july: s.julyRainMm, on: s.blockId === blockId, color: ZONE_COLOR[zone] };
    })
    .sort((a, b) => b.value - a.value);
  const series = scope === "years" ? byYear : byBlock;
  const pick = (i: number) => (scope === "years" ? setYear(byYear[i].year) : setBlockId(byBlock[i].blockId));
  const values = series.map((x) => x.value);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const selectedValue = series.find((x) => x.on)?.value;
  const rank = [...series].sort((a, b) => b.value - a.value).findIndex((x) => x.on) + 1;
  const fmtV = (v: number) => `${m.unit === "₹ cr" ? "₹" : ""}${v.toFixed(m.decimals ?? 0)}${m.unit === "₹ cr" ? " cr" : m.unit === "%" ? "%" : ` ${m.unit}`}`;
  const dryByYear = (y: number) => summaries.find((x) => x.year === y && x.blockId === blockId)?.dryDays ?? 0;
  const maxDry = Math.max(1, ...YEARS.map((y) => dryByYear(y.year)));

  return (
    <PageShell>
      <PageTitle
        icon={History}
        title="Historical replay"
        subtitle="What would VarshaVani have warned in past false-onset years?"
        action={<NoteChip>Simulated hindcast · illustrative</NoteChip>}
      />

      {/* Year + block pickers */}
      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_15rem] lg:items-end">
        <div>
          <p className="mb-1.5 text-[13px] font-semibold text-ink">Year</p>
          <LayoutGroup>
            <div role="radiogroup" aria-label="Year" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {YEARS.map((y) => {
                const on = y.year === year;
                const dd = dryByYear(y.year);
                return (
                  <button
                    key={y.year}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setYear(y.year)}
                    className={`relative overflow-hidden rounded-card border p-3 text-left transition ${
                      on ? "border-monsoon-700 text-white shadow-raise" : "border-line bg-white text-ink shadow-soft hover:-translate-y-0.5 hover:border-monsoon-300"
                    }`}
                  >
                    {on && (
                      <motion.span
                        layoutId="year-pill"
                        className="absolute inset-0 bg-gradient-to-br from-monsoon-900 to-monsoon-700"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        aria-hidden
                      />
                    )}
                    <span className="relative block text-[1.3rem] font-bold leading-none tracking-[-0.02em] tabular-nums">{y.year}</span>
                    <span className={`relative mt-1 block text-[11px] font-semibold ${on ? "text-monsoon-100" : "text-muted"}`}>{ensoTag(y.drivers.enso)}</span>
                    <span className="relative mt-2 block" aria-hidden>
                      <span className={`block h-1.5 overflow-hidden rounded-full ${on ? "bg-white/20" : "bg-slate-100"}`}>
                        <motion.span
                          className={`block h-full rounded-full ${on ? "bg-sun-300" : "bg-red-400"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(dd / maxDry) * 100}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                      </span>
                    </span>
                    <span className={`relative mt-1 block text-[10.5px] ${on ? "text-monsoon-100" : "text-muted"}`}>{dd ? `${dd}-day dry spell` : "…"}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>
        <Field label="Block" htmlFor="rp-block">
          <Select id="rp-block" value={blockId} onChange={(e) => setBlockId(e.target.value)}>
            {eligible.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {b.zone}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error ? (
        <ErrorState onRetry={reload} />
      ) : !current ? (
        <div className="space-y-4">
          <Skeleton className="h-52 rounded-card" />
          <CardSkeleton lines={8} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Year story + KPIs */}
          <SkyBanner tone="dusk" key={`${year}:${blockId}`}>
            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sun-200">
                  {BLOCK_BY_ID[blockId].name} · {BLOCK_BY_ID[blockId].zone} · Kharif {year}
                </p>
                <h2 className="mt-2 text-[1.35rem] font-bold leading-snug text-white! sm:text-[1.55rem]">{current.title}</h2>
                <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-monsoon-100">{current.summary}</p>
                <ul className="mt-3.5 flex flex-wrap gap-2 text-[11.5px] font-semibold">
                  {[
                    { icon: Thermometer, text: `ENSO ${tpl.drivers.enso > 0 ? "+" : ""}${tpl.drivers.enso.toFixed(1)}°C · ${ensoTag(tpl.drivers.enso)}` },
                    { icon: Waves, text: `IOD ${tpl.drivers.iod > 0 ? "+" : ""}${tpl.drivers.iod.toFixed(1)}°C` },
                    { icon: Wind, text: `MJO phase ${tpl.drivers.mjoPhase} · amp ${tpl.drivers.mjoAmp.toFixed(1)}` },
                  ].map((c, i) => (
                    <motion.li
                      key={c.text}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-white ring-1 ring-white/15"
                    >
                      <c.icon className="h-3.5 w-3.5 text-sun-200" aria-hidden /> {c.text}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <ul className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: BellRing, label: "Warning lead", node: <CountUp value={current.warningLeadDays} suffix=" days" />, tone: "text-green-200" },
                  { icon: Sun, label: "Dry spell", node: <CountUp value={current.dryDays} suffix=" days" />, tone: "text-red-200" },
                  { icon: Sprout, label: "Sowed early", node: <CountUp value={current.sownAreaPct} suffix="%" />, tone: "text-sun-200" },
                  { icon: IndianRupee, label: "Loss avoided", node: <CountUp value={current.lossAvoidedCrore} decimals={1} prefix="₹" suffix=" cr" />, tone: "text-sun-200" },
                ].map((k, i) => (
                  <motion.li
                    key={k.label}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 240, damping: 22 }}
                    className="rounded-control bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur-sm"
                  >
                    <p className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${k.tone}`}>
                      <k.icon className="h-3.5 w-3.5" aria-hidden /> {k.label}
                    </p>
                    <p className="mt-1.5 text-[1.45rem] font-bold leading-none text-white">{k.node}</p>
                  </motion.li>
                ))}
              </ul>
            </div>
          </SkyBanner>

          {/* Comparison */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Reveal delay={0}>
              <div className="h-full rounded-card border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-raise">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-700">
                  <X className="h-3.5 w-3.5" aria-hidden /> What actually happened
                </p>
                <ol className="mt-3 space-y-2 text-[13px] leading-relaxed text-red-950">
                  {[
                    [CloudRain, `Early showers from ${d(ev.early_rain)}`],
                    [Sprout, `~${current.sownAreaPct}% of farmers sowed from ${d(ev.sowing)}`],
                    [Sun, `${current.dryDays}-day dry spell from ${d(ev.dry_spell)}`],
                    [RefreshCw, `Re-sowing needed after ${d(ev.revival)}`],
                  ].map(([Icon, text], i) => {
                    const I = Icon as LucideIcon;
                    return (
                      <li key={i} className="flex gap-2">
                        <I className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                        {text as string}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="h-full rounded-card border border-green-200 bg-gradient-to-br from-green-50 to-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-raise">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-green-700">
                  <Check className="h-3.5 w-3.5" aria-hidden /> What VarshaVani would have warned
                </p>
                <p className="mt-3 text-[1.75rem] font-bold leading-none tracking-[-0.02em] text-green-800">
                  <CountUp value={current.warningLeadDays} /> days early
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-green-950">
                  On {d(ev.warning)}: {dryWeek?.prob}% dry-spell chance for the week of {dryWeek ? d(dryWeek.weekStart) : ""}. Advice: delay sowing.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="h-full rounded-card border border-sun-200 bg-gradient-to-br from-sun-50 to-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-raise">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-sun-600">
                  <IndianRupee className="h-3.5 w-3.5" aria-hidden /> Crop loss avoided (illustrative)
                </p>
                <p className="mt-3 text-[1.75rem] font-bold leading-none tracking-[-0.02em] text-soil-800">
                  <CountUp value={current.lossAvoidedCrore} decimals={1} prefix="₹" /> crore
                </p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-soil-700">
                  {BLOCK_BY_ID[blockId].kharifAreaHa.toLocaleString("en-IN")} ha Kharif × {current.sownAreaPct}% early-sown ×{" "}
                  {REPLAY_ASSUMPTIONS.germinationFailure * 100}% germination failure × ₹{REPLAY_ASSUMPTIONS.resowingCostPerHa.toLocaleString("en-IN")}/ha re-sowing ×{" "}
                  {REPLAY_ASSUMPTIONS.adoption * 100}% farmers acting on the warning
                </p>
              </div>
            </Reveal>
          </div>

          {/* Timeline chart */}
          <Reveal>
            <Card pad>
              <CardHeader
                icon={BarChart3}
                title="Daily rainfall vs. hindcast dry-spell warning"
                subtitle="Bars: daily rain (mm, synthetic) · shaded curve: dry-spell probability the system would have issued"
                as="h2"
              />
              <RainfallStoryChart key={`${year}:${blockId}`} replay={current} />
            </Card>
          </Reveal>
        </div>
      )}

      {/* Year-wise distribution dashboard */}
      <Reveal className="mt-6">
        <Card pad>
          <CardHeader
            icon={Gauge}
            title="Year-wise distribution"
            subtitle={
              scope === "years"
                ? `${m.label} in ${BLOCK_BY_ID[blockId].name}, every replay year · click a bar to open that year`
                : `${m.label} across all ${byBlock.length} blocks in ${year} · click a bar to open that block`
            }
            as="h2"
            action={
              <Segmented<Scope>
                size="sm"
                label="Compare"
                value={scope}
                onChange={setScope}
                options={[
                  { value: "years", label: "Across years" },
                  { value: "blocks", label: "Across blocks" },
                ]}
              />
            }
          />
          <div className="no-scrollbar -mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1" role="group" aria-label="Metric">
            {(Object.keys(METRICS) as Metric[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setMetric(k)}
                aria-pressed={metric === k}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition ${
                  metric === k ? "border-monsoon-700 bg-monsoon-700 text-white shadow-soft" : "border-line bg-white text-body hover:border-monsoon-300"
                }`}
              >
                {METRICS[k].label}
              </button>
            ))}
          </div>

          {!dist.data ? (
            <Skeleton className="mt-4 h-72" />
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_15rem]">
              <DistributionChart
                key={`${scope}:${metric}:${scope === "years" ? blockId : year}`}
                series={series}
                scope={scope}
                isRain={metric === "rain"}
                avg={avg}
                label={m.label}
                fmtV={fmtV}
                onPick={pick}
                ensoOf={ensoOfYear}
              />

              {/* Summary rail */}
              <div className="space-y-2.5">
                <div className="rounded-card bg-gradient-to-br from-monsoon-900 to-monsoon-700 p-4 text-white shadow-raise">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-monsoon-200">
                    {scope === "years" ? `${year} in ${BLOCK_BY_ID[blockId].name}` : `${BLOCK_BY_ID[blockId].name} in ${year}`}
                  </p>
                  <p className="mt-1.5 text-[1.6rem] font-bold leading-none">
                    {selectedValue !== undefined ? (
                      <CountUp
                        key={`${metric}:${scope}:${year}:${blockId}`}
                        value={selectedValue}
                        decimals={m.decimals ?? 0}
                        prefix={m.unit === "₹ cr" ? "₹" : ""}
                        suffix={m.unit === "₹ cr" ? " cr" : m.unit === "%" ? "%" : ` ${m.unit}`}
                      />
                    ) : (
                      "–"
                    )}
                  </p>
                  <p className="mt-1.5 text-[12px] text-monsoon-100">
                    Rank {rank} of {series.length}
                    {selectedValue !== undefined && avg > 0 && (
                      <> · {selectedValue >= avg ? "+" : ""}{Math.round(((selectedValue - avg) / avg) * 100)}% vs average</>
                    )}
                  </p>
                </div>
                <dl className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { k: "Min", v: Math.min(...values) },
                    { k: "Avg", v: avg },
                    { k: "Max", v: Math.max(...values) },
                  ].map((s) => (
                    <div key={s.k} className="rounded-control border border-line bg-slate-50/70 px-1.5 py-2">
                      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted">{s.k}</dt>
                      <dd className="mt-0.5 text-[13px] font-bold tabular-nums text-ink">{values.length ? fmtV(s.v) : "–"}</dd>
                    </div>
                  ))}
                </dl>
                {scope === "blocks" && metric !== "rain" && (
                  <ul className="space-y-1 rounded-control border border-line p-2.5 text-[12px] text-body">
                    {(Object.keys(ZONE_COLOR) as Exclude<Zone, "Konkan">[]).map((z) => {
                      const zs = byBlock.filter((x) => x.zone === z);
                      const zAvg = zs.length ? zs.reduce((a, b) => a + b.value, 0) / zs.length : 0;
                      return (
                        <li key={z} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ZONE_COLOR[z] }} aria-hidden />
                            {z}
                          </span>
                          <span className="font-semibold tabular-nums text-ink">{fmtV(zAvg)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className={CAPTION}>
                  <Timer className="mr-1 inline h-3.5 w-3.5 align-[-2px]" aria-hidden />
                  {scope === "years"
                    ? "Same block, different monsoon years."
                    : `Same year, every non-Konkan block.${metric === "rain" ? " Dark: July, light: June." : " Colour = zone."}`}
                </p>
              </div>
            </div>
          )}
        </Card>
      </Reveal>

      {current && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            {/* Events */}
            <Reveal>
              <Card pad className="h-full">
                <CardHeader icon={History} title="Timeline" as="h2" />
                <ol key={`${year}:${blockId}`} className="relative mt-4 space-y-4 pl-6">
                  <motion.span
                    className="absolute bottom-1 left-0 top-1 w-px origin-top bg-line-strong"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    aria-hidden
                  />
                  {[...current.events]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((e, i) => {
                      const s = EVENT_STYLE[e.kind];
                      return (
                        <motion.li
                          key={e.kind}
                          className="relative"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.1, duration: 0.35 }}
                        >
                          <span className={`absolute -left-[37px] grid h-6 w-6 place-items-center rounded-full ring-4 ring-white ${s.cls}`}>
                            <s.icon className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                            {fmtDate("en", e.date, { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p
                            className={`mt-0.5 text-[13px] leading-relaxed ${
                              e.kind === "warning" ? "rounded-control bg-leaf-50 px-2 py-1 font-bold text-leaf-800 ring-1 ring-leaf-200" : "text-body"
                            }`}
                          >
                            {e.label}
                          </p>
                        </motion.li>
                      );
                    })}
                </ol>
              </Card>
            </Reveal>

            {/* Engine output */}
            <Reveal delay={0.08}>
              <p className={`mb-2.5 ${MUTED}`}>
                Advisory engine output for the sowing week, using the hindcast probabilities and reconstructed drivers for that year (same rules as today):
              </p>
              {advisory && <AdvisoryCard key={`${year}:${blockId}`} advisory={advisory} showFeedback={false} />}
            </Reveal>
          </div>
          <p className={CAPTION}>
            Rainfall series and hindcast probabilities are synthetic, shaped after weak or delayed monsoon onsets (2009, 2012, 2014, 2015, 2019). A real backtest would use
            IMD gridded rainfall and archived reforecasts (see Methodology).
          </p>
        </div>
      )}
    </PageShell>
  );
}
