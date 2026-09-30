"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CloudRain,
  FlaskConical,
  Globe,
  MapPin,
  Sun,
  Thermometer,
  Waves,
  Wind,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { CAPTION, TR } from "@/lib/ui";
import { CHART } from "@/lib/chartTheme";
import { Card, CardHeader, PageTitle } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Table, TableFrame, Td, Th, THead } from "@/components/ui/Table";
import { CardSkeleton, ErrorState } from "@/components/ui/States";
import { CountUp, InfluenceMeter, Reveal } from "@/components/ui/Motion";
import { SkyBanner } from "@/components/ui/SkyBanner";
import { MjoWheel } from "@/components/drivers/MjoWheel";
import { IndexChart } from "@/components/drivers/IndexChart";
import { useAsync } from "@/hooks/useAsync";
import { useT } from "@/hooks/useT";
import { getDrivers, getForecast } from "@/lib/forecastService";
import { explainDrivers } from "@/lib/advisoryEngine";
import { BLOCK_BY_ID, HERO_BLOCK_ID } from "@/data/blocks";
import { MJO_INDIA_EFFECT, MJO_PHASE_REGION } from "@/data/drivers";
import { fmtDate } from "@/lib/i18n";

const PHASE_ROWS = [1, 2, 3, 4, 5, 6, 7, 8];

type Effect = "active" | "break" | "neutral";
const effectOf = (e: number): Effect => (e >= 0.3 ? "active" : e <= -0.3 ? "break" : "neutral");
const EFFECT_META: Record<Effect, { label: string; icon: LucideIcon; cls: string }> = {
  active: { label: "Active spell likely", icon: CloudRain, cls: "border-green-200 bg-green-50 text-green-800" },
  break: { label: "Break / dry-spell tendency", icon: Sun, cls: "border-red-200 bg-red-50 text-red-800" },
  neutral: { label: "Transition", icon: Waves, cls: "border-yellow-200 bg-yellow-50 text-yellow-900" },
};

const influenceLabel = (v: number) => (v <= -0.25 ? "Less rain" : v >= 0.25 ? "More rain" : "Little effect");
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

const FLOW = [
  {
    icon: Globe,
    title: "Global signals",
    body: "ENSO warms or cools the Pacific; IOD tilts the Indian Ocean; the MJO pulse travels east every 30-60 days.",
    tone: "border-monsoon-100 bg-monsoon-50",
    ring: "ring-monsoon-300",
    iconTone: "bg-monsoon-600",
  },
  {
    icon: Wind,
    title: "Regional atmosphere",
    body: "Monsoon trough position, low-level jet strength and moisture flow over the Arabian Sea and Bay of Bengal change.",
    tone: "border-sun-200 bg-sun-50",
    ring: "ring-sun-300",
    iconTone: "bg-sun-500",
  },
  {
    icon: CloudRain,
    title: "Local rainfall",
    body: "Blocks get active spells or breaks. The hybrid model downscales these odds to each block and week.",
    tone: "border-leaf-100 bg-leaf-50",
    ring: "ring-leaf-300",
    iconTone: "bg-leaf-600",
  },
];

export default function DriversPage() {
  const { tm, lang } = useT();
  const drivers = useAsync(getDrivers, "drivers");
  const hero = useAsync(() => getForecast(HERO_BLOCK_ID), "hero-forecast");
  const d = drivers.data;
  // Reuse the advisory engine's plain-language explanations (translated).
  const why = d && hero.data ? explainDrivers(d, hero.data, 1, BLOCK_BY_ID[HERO_BLOCK_ID]) : [];

  const [hoverPhase, setHoverPhase] = useState<number | null>(null);
  const [pinnedPhase, setPinnedPhase] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [stepPinned, setStepPinned] = useState(false);

  // Walk through the signal chain until the user picks a step.
  useEffect(() => {
    if (stepPinned) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % FLOW.length), 3200);
    return () => window.clearInterval(id);
  }, [stepPinned]);

  if (!d) {
    return (
      <PageShell>
        <PageTitle icon={Globe} title="Why is this happening?" subtitle="Global climate signals that shape monsoon onset and breaks over Maharashtra" />
        {drivers.error ? (
          <ErrorState onRetry={drivers.reload} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <CardSkeleton lines={6} />
            <CardSkeleton lines={6} />
            <CardSkeleton lines={6} />
          </div>
        )}
      </PageShell>
    );
  }

  const influence = {
    enso: clamp(-d.enso.index / 1.2),
    iod: clamp(d.iod.index / 1.2),
    mjo: clamp(MJO_INDIA_EFFECT[d.mjo.phase] * Math.min(d.mjo.amplitude, 2) * 0.6),
  };
  const net = influence.enso * 0.35 + influence.iod * 0.2 + influence.mjo * 0.45;
  const headline =
    net <= -0.2
      ? "Signals point to weaker rain and a likely dry spell in the next 2-3 weeks"
      : net >= 0.2
        ? "Signals favour active monsoon rain over the next 2-3 weeks"
        : "Signals are mixed: local weather will decide rainfall";

  const focusPhase = hoverPhase ?? pinnedPhase ?? d.mjo.phase;
  const focusEffect = effectOf(MJO_INDIA_EFFECT[focusPhase]);
  const FocusIcon = EFFECT_META[focusEffect].icon;

  const signals: { key: string; icon: LucideIcon; name: string; value: string; v: number }[] = [
    { key: "enso", icon: Thermometer, name: "ENSO", value: d.enso.label, v: influence.enso },
    { key: "iod", icon: Waves, name: "IOD", value: d.iod.label, v: influence.iod },
    { key: "mjo", icon: Wind, name: "MJO", value: `Phase ${d.mjo.phase}`, v: influence.mjo },
  ];

  const driverCards = [
    {
      key: "enso",
      icon: Thermometer,
      title: "ENSO (El Niño / La Niña)",
      subtitle: "Pacific sea-surface temperature, Niño-3.4 index",
      value: <CountUp value={d.enso.index} decimals={1} signed suffix="°C" />,
      badge: { text: d.enso.label, cls: "border-orange-200 bg-orange-50 text-orange-800" },
      timescale: "Seasonal · months",
      chart: <IndexChart data={d.enso.series} threshold={0.5} color={CHART.amber} />,
      note: why[1],
      noteCls: "border-orange-100 bg-orange-50 text-orange-900",
      accent: "from-orange-400 to-amber-300",
      caption: "Seasonal signal (months). Shifts the odds for the whole season, not individual weeks.",
      v: influence.enso,
    },
    {
      key: "iod",
      icon: Waves,
      title: "Indian Ocean Dipole (IOD)",
      subtitle: "West minus east Indian Ocean SST (DMI)",
      value: <CountUp value={d.iod.index} decimals={2} signed suffix="°C" />,
      badge: { text: d.iod.label, cls: "border-monsoon-200 bg-monsoon-50 text-monsoon-800" },
      timescale: "Seasonal · months",
      chart: <IndexChart data={d.iod.series} threshold={0.4} color={CHART.navy} goodSide="positive" />,
      note: why[2],
      noteCls: "border-monsoon-100 bg-monsoon-50 text-monsoon-900",
      accent: "from-monsoon-500 to-monsoon-300",
      caption: "A positive IOD can partly offset El Niño. It is neutral today, so it is not helping.",
      v: influence.iod,
    },
    {
      key: "mjo",
      icon: Wind,
      title: "Madden-Julian Oscillation (MJO)",
      subtitle: "Eastward-moving rain pulse, 30-60 day cycle (RMM index)",
      value: (
        <>
          Phase <CountUp value={d.mjo.phase} duration={0.8} />
        </>
      ),
      badge: { text: `Amplitude ${d.mjo.amplitude.toFixed(1)}`, cls: "border-red-200 bg-red-50 text-red-800" },
      timescale: "Sub-seasonal · weeks",
      chart: (
        <div className="mt-3 grid h-32 place-items-center rounded-control bg-slate-50/80 ring-1 ring-line">
          <div className="text-center">
            <p className="text-[12px] text-muted">Rain pulse is over the</p>
            <p className="mt-0.5 text-[15px] font-bold text-ink">{MJO_PHASE_REGION[d.mjo.phase]}</p>
            <div className="mx-auto mt-2 flex w-40 items-center gap-1" aria-hidden>
              {PHASE_ROWS.map((p) => (
                <motion.span
                  key={p}
                  className={`h-1.5 flex-1 rounded-full ${p === d.mjo.phase ? "bg-red-500" : "bg-slate-200"}`}
                  animate={p === d.mjo.phase ? { opacity: [0.5, 1, 0.5] } : undefined}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[10.5px] text-muted">phase 1 → 8, moving east</p>
          </div>
        </div>
      ),
      note: why[0],
      noteCls: "border-red-100 bg-red-50 text-red-900",
      accent: "from-red-500 to-rose-300",
      caption: "Sub-seasonal signal (weeks). This is the main source of skill for weeks 2-4 break forecasts.",
      v: influence.mjo,
    },
  ];

  return (
    <PageShell>
      <PageTitle icon={Globe} title="Why is this happening?" subtitle="Global climate signals that shape monsoon onset and breaks over Maharashtra" />
      <div className="space-y-6">
        {/* Signal check banner */}
        <SkyBanner>
          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-monsoon-200">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                Signal check · {fmtDate("en", d.asOf, { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <h2 className="mt-2 text-[1.35rem] font-bold leading-snug text-white! sm:text-[1.55rem]">{headline}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-monsoon-100">
                Three ocean-atmosphere signals set the odds. Hover or tap the cards below to see how each one pushes rain up or down. Simulated values for the demo scenario.
              </p>
            </div>
            <ul className="grid grid-cols-3 gap-2.5">
              {signals.map((s, i) => {
                const tone = s.v <= -0.25 ? "text-red-200" : s.v >= 0.25 ? "text-green-200" : "text-yellow-100";
                return (
                  <motion.li
                    key={s.key}
                    initial={{ opacity: 0, scale: 0.9, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.12, type: "spring", stiffness: 220, damping: 20 }}
                    className="rounded-control bg-white/10 p-3 text-center ring-1 ring-white/15 backdrop-blur-sm"
                  >
                    <s.icon className="mx-auto h-5 w-5 text-white/90" aria-hidden />
                    <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-monsoon-200">{s.name}</p>
                    <p className="mt-0.5 text-[13px] font-bold leading-tight text-white">{s.value}</p>
                    <p className={`mt-1 text-[11px] font-semibold ${tone}`}>{influenceLabel(s.v)}</p>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </SkyBanner>

        {/* Driver cards */}
        <div className="grid gap-4 lg:grid-cols-3">
          {driverCards.map((c, i) => (
            <Reveal key={c.key} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="group relative h-full overflow-hidden rounded-card border border-line bg-white p-4 shadow-soft transition-shadow hover:shadow-lift sm:p-5"
              >
                <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.accent}`} aria-hidden />
                <div className="flex items-start justify-between gap-2">
                  <CardHeader icon={c.icon} title={c.title} subtitle={c.subtitle} as="h2" />
                </div>
                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                  <span className="text-[2rem] font-bold leading-none tracking-[-0.02em] text-ink">{c.value}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[12px] font-semibold ${c.badge.cls}`}>{c.badge.text}</span>
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-muted">{c.timescale}</span>
                </div>
                {c.chart}
                <div className="mt-3">
                  <InfluenceMeter value={c.v} label={influenceLabel(c.v)} />
                </div>
                <p className={`mt-3 rounded-control border p-3 text-[13px] leading-relaxed ${c.noteCls}`}>{c.note ? tm(c.note) : null}</p>
                <p className={`mt-2 ${CAPTION}`}>{c.caption}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>

        {/* MJO wheel: linked wheel + table */}
        <Reveal>
          <Card pad>
            <CardHeader
              icon={Wind}
              title="MJO phase wheel"
              subtitle="Hover a sector or a row to compare phases; click to pin it"
              as="h2"
            />
            <div className="mt-5 grid items-start gap-6 lg:grid-cols-[340px_1fr]">
              <div>
                <MjoWheel
                  phase={d.mjo.phase}
                  amplitude={d.mjo.amplitude}
                  trajectory={d.mjo.trajectory}
                  highlight={hoverPhase ?? pinnedPhase}
                  onPhaseHover={setHoverPhase}
                  onPhaseSelect={(p) => setPinnedPhase((cur) => (cur === p ? null : p))}
                  animated
                />
                <p className={`mt-2 text-center ${CAPTION}`}>Solid line: last 30 days · dashed: 10-day outlook · orange dot: today</p>
              </div>
              <div className="space-y-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={focusPhase}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-3 rounded-card border p-3.5 ${EFFECT_META[focusEffect].cls}`}
                    aria-live="polite"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-white/70">
                      <FocusIcon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[14px] font-bold">
                        Phase {focusPhase} · {MJO_PHASE_REGION[focusPhase]}
                        {focusPhase === d.mjo.phase && <span className="ml-2 rounded bg-sun-400 px-1.5 py-0.5 text-[9.5px] font-bold text-sun-950 align-middle">NOW</span>}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-relaxed">
                        {EFFECT_META[focusEffect].label}.{" "}
                        {focusEffect === "active"
                          ? "Convection near India strengthens the monsoon trough and moisture inflow."
                          : focusEffect === "break"
                            ? "Convection has moved away from India, so rain over Maharashtra tends to weaken."
                            : "The pulse is between regions; its effect on India is small or mixed."}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
                <TableFrame>
                  <Table caption="MJO phase effects on India" minWidth="420px">
                    <THead>
                      <tr>
                        <Th className="w-20">Phase</Th>
                        <Th>Convection over</Th>
                        <Th>Typical effect on Indian monsoon</Th>
                      </tr>
                    </THead>
                    <tbody onMouseLeave={() => setHoverPhase(null)}>
                      {PHASE_ROWS.map((p) => {
                        const kind = effectOf(MJO_INDIA_EFFECT[p]);
                        const now = p === d.mjo.phase;
                        const lit = (hoverPhase ?? pinnedPhase) === p;
                        const Badge = EFFECT_META[kind].icon;
                        return (
                          <tr
                            key={p}
                            tabIndex={0}
                            onMouseEnter={() => setHoverPhase(p)}
                            onFocus={() => setHoverPhase(p)}
                            onBlur={() => setHoverPhase(null)}
                            onClick={() => setPinnedPhase((cur) => (cur === p ? null : p))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setPinnedPhase((cur) => (cur === p ? null : p));
                              }
                            }}
                            aria-selected={pinnedPhase === p}
                            className={`${TR} cursor-pointer transition-colors ${lit ? "bg-monsoon-50" : now ? "bg-sun-50" : "hover:bg-slate-50"}`}
                          >
                            <Td className={now || lit ? "font-semibold text-ink" : ""}>
                              {p}
                              {now && <span className="ml-1.5 rounded bg-sun-400 px-1.5 py-0.5 text-[9.5px] font-bold text-sun-950">NOW</span>}
                            </Td>
                            <Td>{MJO_PHASE_REGION[p]}</Td>
                            <Td>
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-semibold ${EFFECT_META[kind].cls}`}>
                                <Badge className="h-3.5 w-3.5" aria-hidden />
                                {EFFECT_META[kind].label}
                              </span>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </TableFrame>
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Flow */}
        <Reveal>
          <Card pad>
            <CardHeader icon={Workflow} title="From global signals to your field" subtitle="Click a step to pause the walkthrough" as="h2" />
            <ol className="mt-5 grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
              {FLOW.flatMap((s, i, arr) => {
                const active = step === i;
                const item = (
                  <li key={s.title}>
                    <motion.button
                      type="button"
                      onClick={() => {
                        setStep(i);
                        setStepPinned(true);
                      }}
                      aria-pressed={active && stepPinned}
                      animate={{ scale: active ? 1.02 : 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      className={`h-full w-full rounded-card border p-4 text-left transition-shadow ${s.tone} ${active ? `shadow-raise ring-2 ${s.ring}` : "opacity-80 hover:opacity-100"}`}
                    >
                      <span className={`grid h-9 w-9 place-items-center rounded-control text-white ${s.iconTone}`}>
                        <s.icon className="h-4.5 w-4.5" aria-hidden />
                      </span>
                      <p className="mt-3 flex items-center gap-2 text-[15px] font-bold text-ink">
                        <span className="text-[11px] font-semibold text-muted">{String(i + 1).padStart(2, "0")}</span>
                        {s.title}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-body">{s.body}</p>
                    </motion.button>
                  </li>
                );
                return i < arr.length - 1
                  ? [
                      item,
                      <li key={`a${i}`} aria-hidden className="relative grid place-items-center text-slate-300">
                        <ArrowRight className={`hidden h-6 w-6 transition-colors md:block ${step > i ? "text-leaf-500" : ""}`} />
                        <ArrowDown className={`h-6 w-6 transition-colors md:hidden ${step > i ? "text-leaf-500" : ""}`} />
                        {step === i && (
                          <motion.span
                            className="absolute hidden h-1.5 w-1.5 rounded-full bg-leaf-500 md:block"
                            initial={{ x: -14, opacity: 0 }}
                            animate={{ x: 14, opacity: [0, 1, 0] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          />
                        )}
                      </li>,
                    ]
                  : [item];
              })}
            </ol>
            <div className="mt-4 rounded-card border border-leaf-100 bg-gradient-to-br from-leaf-50 to-white p-4">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                <MapPin className="h-4 w-4 text-leaf-600" aria-hidden />
                Putting it together for {lang === "en" ? "Latur" : "लातूर"}:
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-body">
                {why.map((m, i) => (
                  <motion.li
                    key={i}
                    className="flex gap-2"
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-500" aria-hidden />
                    {tm(m)}
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href="/simulator" icon={FlaskConical}>
                Try the what-if simulator
              </ButtonLink>
              <ButtonLink href="/methodology" variant="secondary" icon={BookOpen}>
                How the model uses these signals
              </ButtonLink>
            </div>
          </Card>
        </Reveal>
      </div>
    </PageShell>
  );
}
