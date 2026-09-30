"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bookmark,
  CloudLightning,
  CloudRain,
  FlaskConical,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Thermometer,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, LabelList, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CropId, GrowthStage, Week } from "@/types";
import { WEEKS } from "@/types";
import { PageShell } from "@/components/layout/PageShell";
import { CAPTION, EYEBROW, TR } from "@/lib/ui";
import { axisProps, CHART, gridProps } from "@/lib/chartTheme";
import { Card, CardHeader, NoteChip, PageTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { RowTh, Table, TableFrame, Td, Th, THead } from "@/components/ui/Table";
import { Segmented } from "@/components/ui/Segmented";
import { CardSkeleton } from "@/components/ui/States";
import { Reveal } from "@/components/ui/Motion";
import { SkyBanner } from "@/components/ui/SkyBanner";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { MjoWheel } from "@/components/drivers/MjoWheel";
import { SafeToSowCard } from "@/components/advisory/SafeToSowCard";
import { AdvisoryCard } from "@/components/advisory/AdvisoryCard";
import { useAsync } from "@/hooks/useAsync";
import { useT } from "@/hooks/useT";
import { getAllForecasts, getDrivers } from "@/lib/forecastService";
import { applyWhatIf, COEFFS, driversWithInputs, inputsFromDrivers, phaseAtWeek, type DriverInputs } from "@/lib/whatIf";
import { getAdvisory } from "@/lib/advisoryEngine";
import { BLOCKS, BLOCK_BY_ID, HERO_BLOCK_ID, blockName } from "@/data/blocks";
import { CROPS, CROP_IDS, STAGES } from "@/data/crops";
import { MJO_INDIA_EFFECT } from "@/data/drivers";

const PRESETS: { name: string; x: Partial<DriverInputs> }[] = [
  { name: "Today (baseline)", x: {} },
  { name: "La Niña + active MJO (phase 3)", x: { enso: -1.0, iod: 0.2, mjoPhase: 3, mjoAmp: 1.8 } },
  { name: "Strong El Niño + MJO phase 7", x: { enso: 1.8, iod: -0.3, mjoPhase: 7, mjoAmp: 2.0 } },
  { name: "El Niño offset by +IOD", x: { enso: 1.0, iod: 1.0, mjoPhase: 4, mjoAmp: 1.2 } },
];

type RiskVar = "breakProb" | "onset" | "heavyRain";
const RISK_VARS: Record<RiskVar, { label: string; icon: LucideIcon; color: string; soft: string; worseWhenUp: boolean }> = {
  breakProb: { label: "Dry spell", icon: Sun, color: CHART.amber, soft: CHART.amberSoft, worseWhenUp: true },
  onset: { label: "Onset", icon: CloudRain, color: CHART.green, soft: CHART.greenSoft, worseWhenUp: false },
  heavyRain: { label: "Heavy rain", icon: CloudLightning, color: CHART.navy, soft: CHART.navySoft, worseWhenUp: true },
};

const sameInputs = (a: DriverInputs, b: DriverInputs) =>
  Math.abs(a.enso - b.enso) < 0.001 && Math.abs(a.iod - b.iod) < 0.001 && a.mjoPhase === b.mjoPhase && Math.abs(a.mjoAmp - b.mjoAmp) < 0.001;

const signed = (v: number, digits: number) => `${v > 0 ? "+" : ""}${v.toFixed(digits)}`;

function Slider({
  id,
  label,
  value,
  today,
  min,
  max,
  step,
  onChange,
  display,
  hint,
}: {
  id: string;
  label: string;
  value: number;
  today: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
  hint: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const todayPct = ((today - min) / (max - min)) * 100;
  const changed = Math.abs(value - today) > step / 2;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-semibold text-ink">
          {label}
        </label>
        <output htmlFor={id} className={`text-[15px] font-bold tabular-nums transition-colors ${changed ? "text-monsoon-700" : "text-ink"}`}>
          {display}
        </output>
      </div>
      <div className="relative mt-2.5">
        {/* Filled track + today's value marker */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" aria-hidden>
          <div className="h-full rounded-full bg-gradient-to-r from-monsoon-500 to-monsoon-800" style={{ width: `${pct}%` }} />
          <span className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-sun-500" style={{ left: `${todayPct}%` }} title="Today" />
        </div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mm-range relative h-5 w-full cursor-pointer"
          aria-valuetext={display}
        />
      </div>
      <p className={`mt-1 flex items-center justify-between gap-2 ${CAPTION}`}>
        <span>{hint}</span>
        <span className="flex shrink-0 items-center gap-1">
          <span className="h-2.5 w-0.5 rounded-full bg-sun-500" aria-hidden /> today
        </span>
      </p>
    </div>
  );
}

export default function SimulatorPage() {
  const { t, lang } = useT();
  const forecasts = useAsync(getAllForecasts, "all-forecasts");
  const driversRes = useAsync(getDrivers, "drivers");
  const [blockId, setBlockId] = useState(HERO_BLOCK_ID);
  const [crop, setCrop] = useState<CropId>("soybean");
  const [stage, setStage] = useState<GrowthStage>("not_sown");
  const [week, setWeek] = useState<Week>(1);
  const [x, setX] = useState<DriverInputs | null>(null);
  const [riskVar, setRiskVar] = useState<RiskVar>("breakProb");

  const current = useMemo(() => (driversRes.data ? inputsFromDrivers(driversRes.data) : null), [driversRes.data]);
  const inputs = x ?? current;
  const block = BLOCK_BY_ID[blockId];

  const result = useMemo(() => {
    if (!forecasts.data || !driversRes.data || !inputs || !current) return null;
    const base = forecasts.data[blockId];
    const sim = applyWhatIf(base, block, inputs, current);
    const simDrivers = driversWithInputs(driversRes.data, inputs);
    return {
      base,
      sim,
      simDrivers,
      baseAdv: getAdvisory(crop, stage, base, week, { drivers: driversRes.data, block }),
      simAdv: getAdvisory(crop, stage, sim, week, { drivers: simDrivers, block }),
    };
  }, [forecasts.data, driversRes.data, inputs, current, blockId, block, crop, stage, week]);

  const set = (patch: Partial<DriverInputs>) => inputs && setX({ ...inputs, ...patch });

  const rv = RISK_VARS[riskVar];
  const chart = result
    ? result.base.weeks.map((w, i) => ({
        week: `Week ${w.week}`,
        today: w[riskVar],
        simulated: result.sim.weeks[i][riskVar],
      }))
    : [];

  if (!inputs || !result || !current) {
    return (
      <PageShell>
        <PageTitle icon={FlaskConical} title="What-if simulator" subtitle="Move the global drivers and watch local risk and the advisory update live" action={<NoteChip>Illustrative simulation</NoteChip>} />
        <div className="grid gap-4 lg:grid-cols-2">
          <CardSkeleton lines={8} />
          <CardSkeleton lines={8} />
        </div>
      </PageShell>
    );
  }

  const decisionWord = (a: typeof result.baseAdv) => (a.decision ? t(`decision.${a.decision}`) : t(`type.${a.type}`));
  const adviceChanged = result.baseAdv.type !== result.simAdv.type || result.baseAdv.decision !== result.simAdv.decision;
  const isBaseline = sameInputs(inputs, current);
  const activePreset = PRESETS.find((p) => sameInputs({ ...current, ...p.x }, inputs))?.name;

  const driverTiles: { key: string; icon: LucideIcon; name: string; value: string; delta: string | null }[] = [
    { key: "enso", icon: Thermometer, name: "ENSO", value: `${signed(inputs.enso, 1)}°C`, delta: Math.abs(inputs.enso - current.enso) > 0.05 ? `${signed(inputs.enso - current.enso, 1)} vs today` : null },
    { key: "iod", icon: Waves, name: "IOD", value: `${signed(inputs.iod, 2)}°C`, delta: Math.abs(inputs.iod - current.iod) > 0.02 ? `${signed(inputs.iod - current.iod, 2)} vs today` : null },
    {
      key: "mjo",
      icon: Wind,
      name: "MJO",
      value: `Phase ${inputs.mjoPhase} · ${inputs.mjoAmp.toFixed(1)}`,
      delta: inputs.mjoPhase !== current.mjoPhase || Math.abs(inputs.mjoAmp - current.mjoAmp) > 0.05 ? `today: phase ${current.mjoPhase}` : null,
    },
  ];

  return (
    <PageShell>
      <PageTitle
        icon={FlaskConical}
        title="What-if simulator"
        subtitle="Move the global drivers and watch local risk and the advisory update live"
        action={<NoteChip>Illustrative simulation</NoteChip>}
      />

      <div className="space-y-6">
        {/* Scenario banner */}
        <SkyBanner>
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-monsoon-200">
                <FlaskConical className="h-3.5 w-3.5" aria-hidden />
                {isBaseline ? "Scenario · today's drivers" : `Scenario · ${activePreset ?? "custom drivers"}`}
              </p>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={`${result.baseAdv.id}|${result.simAdv.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[1.3rem] font-bold leading-snug text-white! sm:text-[1.5rem]"
                >
                  {adviceChanged ? (
                    <>
                      <span className="text-monsoon-200">{decisionWord(result.baseAdv)}</span>
                      <ArrowRight className="h-5 w-5 shrink-0 text-sun-300" aria-label="becomes" />
                      <span>{decisionWord(result.simAdv)}</span>
                    </>
                  ) : (
                    <span>Advice stays: {decisionWord(result.simAdv)}</span>
                  )}
                </motion.h2>
              </AnimatePresence>
              <p className="mt-2 text-[13px] leading-relaxed text-monsoon-100">
                {t(`crop.${crop}`)} · {t(`stage.${stage}`)} · week {week} in {blockName(block, lang)}. Move the sliders or pick a preset; the forecast shifts by the change in drivers only.
              </p>
            </div>
            <ul className="grid grid-cols-3 gap-2.5">
              {driverTiles.map((s, i) => (
                <motion.li
                  key={s.key}
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 220, damping: 20 }}
                  className={`rounded-control p-3 text-center ring-1 backdrop-blur-sm transition-colors ${s.delta ? "bg-white/16 ring-sun-300/60" : "bg-white/10 ring-white/15"}`}
                >
                  <s.icon className="mx-auto h-5 w-5 text-white/90" aria-hidden />
                  <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-monsoon-200">{s.name}</p>
                  <p className="mt-0.5 text-[13px] font-bold leading-tight text-white tabular-nums">{s.value}</p>
                  <p className={`mt-1 text-[10.5px] font-semibold ${s.delta ? "text-sun-200" : "text-monsoon-200/80"}`}>{s.delta ?? "as today"}</p>
                </motion.li>
              ))}
            </ul>
          </div>
        </SkyBanner>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Controls */}
          <div className="space-y-4">
            <Reveal>
              <div className="relative space-y-5 overflow-hidden rounded-card border border-line bg-white p-4 shadow-soft sm:p-5">
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-monsoon-500 to-monsoon-300" aria-hidden />
                <CardHeader
                  icon={SlidersHorizontal}
                  title="Global drivers"
                  as="h2"
                  action={
                    <Button variant="ghost" size="sm" onClick={() => setX(null)} icon={RotateCcw} disabled={isBaseline}>
                      Reset
                    </Button>
                  }
                />
                <Slider
                  id="enso"
                  label="ENSO index (Niño-3.4)"
                  value={inputs.enso}
                  today={current.enso}
                  min={-2.5}
                  max={2.5}
                  step={0.1}
                  onChange={(v) => set({ enso: v })}
                  display={`${signed(inputs.enso, 1)}°C`}
                  hint="← La Niña (wetter) · El Niño (drier) →"
                />
                <Slider
                  id="iod"
                  label="Indian Ocean Dipole"
                  value={inputs.iod}
                  today={current.iod}
                  min={-1.5}
                  max={1.5}
                  step={0.05}
                  onChange={(v) => set({ iod: v })}
                  display={`${signed(inputs.iod, 2)}°C`}
                  hint="← negative (drier) · positive (wetter) →"
                />
                <div>
                  <p className="mb-2 text-[13px] font-semibold text-ink">MJO phase today</p>
                  <div className="grid grid-cols-8 gap-1" role="radiogroup" aria-label="MJO phase">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
                      const e = MJO_INDIA_EFFECT[p];
                      const on = inputs.mjoPhase === p;
                      return (
                        <motion.button
                          key={p}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => set({ mjoPhase: p })}
                          whileTap={{ scale: 0.92 }}
                          className={`relative min-h-11 rounded-control text-[13px] font-bold transition ${
                            on ? "bg-monsoon-800 text-white shadow-raise" : e >= 0.3 ? "bg-green-50 text-green-800 hover:bg-green-100" : e <= -0.3 ? "bg-orange-50 text-orange-800 hover:bg-orange-100" : "bg-yellow-50 text-yellow-800 hover:bg-yellow-100"
                          }`}
                        >
                          {p}
                          <span
                            className={`absolute inset-x-2 bottom-1 h-0.5 rounded-full ${e >= 0.3 ? "bg-green-500" : e <= -0.3 ? "bg-orange-500" : "bg-yellow-400"}`}
                            aria-hidden
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className={`mt-1.5 ${CAPTION}`}>Green = active phases for India, orange = break tendency. Phase advances ~1 per week.</p>
                </div>
                <Slider
                  id="amp"
                  label="MJO amplitude"
                  value={inputs.mjoAmp}
                  today={current.mjoAmp}
                  min={0}
                  max={3}
                  step={0.1}
                  onChange={(v) => set({ mjoAmp: v })}
                  display={inputs.mjoAmp.toFixed(1)}
                  hint="< 1 = weak MJO (little effect)"
                />
                <div className="rounded-card bg-slate-50/80 p-3 ring-1 ring-line">
                  <MjoWheel phase={inputs.mjoPhase} amplitude={inputs.mjoAmp} size={210} onPhaseSelect={(p) => set({ mjoPhase: p })} />
                  <ul className="mt-2 flex justify-center gap-1.5">
                    {WEEKS.map((w) => (
                      <li key={w} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-body ring-1 ring-line">
                        W{w} → {phaseAtWeek(inputs.mjoPhase, w)}
                      </li>
                    ))}
                  </ul>
                  <p className={`mt-1.5 text-center ${CAPTION}`}>Click a sector to set the phase. Expected phase by week.</p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <Card pad>
                <CardHeader icon={Bookmark} title="Presets" as="h2" />
                <div className="mt-3 grid gap-2">
                  {PRESETS.map((p) => {
                    const on = activePreset === p.name;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setX({ ...current, ...p.x })}
                        aria-pressed={on}
                        className={`flex min-h-11 items-center justify-between gap-2 rounded-control border px-3 text-left text-[13px] font-semibold transition ${
                          on ? "border-monsoon-700 bg-monsoon-50 text-monsoon-900 ring-1 ring-monsoon-700" : "border-line text-body hover:border-monsoon-300 hover:bg-monsoon-50/50"
                        }`}
                      >
                        {p.name}
                        {on && <span className="h-2 w-2 shrink-0 rounded-full bg-monsoon-700" aria-hidden />}
                      </button>
                    );
                  })}
                </div>
              </Card>
            </Reveal>
          </div>

          {/* Output */}
          <div className="space-y-4">
            <Card pad>
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Block" htmlFor="sim-block">
                  <Select id="sim-block" value={blockId} onChange={(e) => setBlockId(e.target.value)}>
                    {BLOCKS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.zone})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Crop" htmlFor="sim-crop">
                  <Select id="sim-crop" value={crop} onChange={(e) => setCrop(e.target.value as CropId)}>
                    {CROP_IDS.map((c) => (
                      <option key={c} value={c}>
                        {CROPS[c].emoji} {t(`crop.${c}`)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Stage" htmlFor="sim-stage">
                  <Select id="sim-stage" value={stage} onChange={(e) => setStage(e.target.value as GrowthStage)}>
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {t(`stage.${s}`)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Advice for week">
                  <Segmented<Week> label="Advice week" value={week} onChange={setWeek} options={WEEKS.map((w) => ({ value: w, label: `W${w}` }))} />
                </Field>
              </div>
            </Card>

            <Reveal>
              <div className="relative overflow-hidden rounded-card border border-line bg-white p-4 shadow-soft sm:p-5">
                <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sun-400 via-leaf-400 to-monsoon-500" aria-hidden />
                <CardHeader
                  icon={BarChart3}
                  title={`Local risk: ${blockName(block, lang)}`}
                  subtitle="Bars: simulated drivers · dashed line: today's forecast"
                  as="h2"
                  action={
                    <Segmented<RiskVar>
                      size="sm"
                      label="Risk shown"
                      value={riskVar}
                      onChange={setRiskVar}
                      options={(Object.keys(RISK_VARS) as RiskVar[]).map((k) => {
                        const Icon = RISK_VARS[k].icon;
                        return { value: k, label: <><Icon className="h-3.5 w-3.5" aria-hidden /> {RISK_VARS[k].label}</> };
                      })}
                    />
                  }
                />

                {/* Per-week change chips */}
                <ul className="mt-4 grid grid-cols-4 gap-2">
                  {chart.map((c) => {
                    const dlt = c.simulated - c.today;
                    const worse = rv.worseWhenUp ? dlt > 0 : dlt < 0;
                    const Arrow = dlt > 0 ? ArrowUpRight : dlt < 0 ? ArrowDownRight : ArrowRight;
                    return (
                      <li key={c.week} className="rounded-control border border-line bg-slate-50/70 px-2.5 py-2">
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted">{c.week}</p>
                        <p className="mt-0.5 flex items-baseline gap-1.5">
                          <span className="text-[1.05rem] font-bold tabular-nums text-ink">{c.simulated}%</span>
                          <span
                            className={`inline-flex items-center gap-0.5 rounded-full px-1.5 text-[10.5px] font-bold tabular-nums ${
                              dlt === 0 ? "bg-slate-100 text-slate-500" : worse ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"
                            }`}
                          >
                            <Arrow className="h-3 w-3" aria-hidden />
                            {dlt > 0 ? "+" : ""}
                            {dlt}
                          </span>
                        </p>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart key={riskVar} data={chart} margin={{ top: 22, left: -18, right: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`sim-bar-${riskVar}`} x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor={rv.color} stopOpacity={0.95} />
                          <stop offset="100%" stopColor={rv.soft} stopOpacity={0.55} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="week" {...axisProps} />
                      <YAxis domain={[0, 100]} unit="%" {...axisProps} />
                      <Tooltip
                        cursor={{ fill: "rgba(11,29,51,0.04)" }}
                        content={
                          <ChartTooltip
                            unit="%"
                            footer={(p) => {
                              const s = Number(p.find((i) => i.dataKey === "simulated")?.value ?? 0);
                              const b = Number(p.find((i) => i.dataKey === "today")?.value ?? 0);
                              return s === b ? "No change from today" : `${s > b ? "+" : ""}${s - b} points vs today`;
                            }}
                          />
                        }
                      />
                      <Bar dataKey="simulated" name={`${rv.label} (simulated)`} fill={`url(#sim-bar-${riskVar})`} radius={[8, 8, 2, 2]} maxBarSize={72} animationDuration={700}>
                        <LabelList dataKey="simulated" position="top" formatter={(v) => `${v}%`} style={{ fontSize: 11.5, fontWeight: 700, fill: "#0b1d33" }} />
                      </Bar>
                      <Line
                        dataKey="today"
                        name={`${rv.label} (today)`}
                        type="linear"
                        stroke="#475569"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={{ r: 4.5, fill: "#ffffff", stroke: "#475569", strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        animationDuration={900}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-1 flex flex-wrap justify-center gap-4 text-[11.5px] text-body">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm" style={{ background: `linear-gradient(${rv.color}, ${rv.soft})` }} aria-hidden /> Simulated
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 border-t-2 border-dashed border-slate-500" aria-hidden /> Today
                  </span>
                </div>

                <div className="mt-4">
                  <TableFrame>
                    <Table caption="Probability changes by week">
                      <THead>
                        <tr>
                          <Th>Week</Th>
                          <Th numeric>Onset</Th>
                          <Th numeric>Dry spell</Th>
                          <Th numeric>Heavy rain</Th>
                        </tr>
                      </THead>
                      <tbody>
                        {result.sim.weeks.map((w, i) => {
                          const b = result.base.weeks[i];
                          const cell = (now: number, was: number, worseWhenUp: boolean) => {
                            const dd = now - was;
                            const worse = worseWhenUp ? dd > 0 : dd < 0;
                            return (
                              <Td numeric>
                                {now}%{" "}
                                <span
                                  className={`ml-0.5 rounded-full px-1.5 py-px text-[11px] font-semibold ${
                                    dd === 0 ? "text-slate-400" : worse ? "bg-orange-50 text-orange-700" : "bg-green-50 text-green-700"
                                  }`}
                                >
                                  {dd > 0 ? "+" : ""}
                                  {dd}
                                </span>
                              </Td>
                            );
                          };
                          return (
                            <tr key={w.week} className={`${TR} transition-colors hover:bg-slate-50/80`}>
                              <RowTh>W{w.week}</RowTh>
                              {cell(w.onset, b.onset, false)}
                              {cell(w.breakProb, b.breakProb, true)}
                              {cell(w.heavyRain, b.heavyRain, true)}
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </TableFrame>
                </div>
              </div>
            </Reveal>

            <div className="grid gap-4 xl:grid-cols-2">
              <div>
                <p className={`mb-2 ${EYEBROW}`}>Today&apos;s advice</p>
                <SafeToSowCard compact advisory={result.baseAdv} recentRainMm={result.base.recentRainMm} falseOnset={result.base.falseOnsetRisk} />
              </div>
              <div>
                <p className={`mb-2 ${EYEBROW}`}>With simulated drivers</p>
                <SafeToSowCard compact advisory={result.simAdv} recentRainMm={result.sim.recentRainMm} falseOnset={result.sim.falseOnsetRisk} />
              </div>
            </div>
            <AdvisoryCard key={result.simAdv.id} advisory={result.simAdv} showFeedback={false} defaultOpen />

            <details className="rounded-card border border-line bg-white p-4 text-[13px] text-body shadow-soft sm:p-5">
              <summary className="cursor-pointer text-[13px] font-bold text-ink">The formula (transparent and simple)</summary>
              <pre className="mt-3 overflow-x-auto rounded-control bg-monsoon-950 p-3.5 text-[11.5px] leading-relaxed text-monsoon-100">
{`v' = clamp( v_today + S_zone × [ f(new drivers, w) − f(today's drivers, w) ] )

f(w) = ENSO × c_enso + IOD × c_iod + E(phase_w) × A × L_w × c_mjo

c_enso  = onset ${COEFFS.enso.onset}, dry spell +${COEFFS.enso.breakProb}, heavy ${COEFFS.enso.heavyRain}  (per °C)
c_iod   = onset +${COEFFS.iod.onset}, dry spell ${COEFFS.iod.breakProb}, heavy +${COEFFS.iod.heavyRain}  (per °C)
c_mjo   = onset +${COEFFS.mjo.onset}, dry spell ${COEFFS.mjo.breakProb}, heavy +${COEFFS.mjo.heavyRain}
phase_w = MJO phase advanced 1 per week;  E = India effect of phase (−1..+1)
A       = min(amplitude, 2.5) / 1.5;      L_w = ${COEFFS.leadDecay.join(", ")}
S_zone  = ${Object.entries(COEFFS.zoneSensitivity).map(([k, v]) => `${k} ${v}`).join(", ")}`}
              </pre>
              <p className={`mt-2.5 ${CAPTION}`}>
                This is a teaching tool, not the forecast model. See lib/whatIf.ts. The real system would re-run the calibrated hybrid model.
              </p>
            </details>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
