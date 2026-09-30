"use client";

import { ArrowDown, ArrowRight, BookOpen, Cpu, Database, Gauge, Map as MapIcon, Megaphone, Scale, SlidersHorizontal, TriangleAlert, Workflow } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { CAPTION, INSET, TR } from "@/lib/ui";
import { Card, CardHeader, PageTitle } from "@/components/ui/Card";
import { RowTh, Table, TableFrame, Td, Th, THead } from "@/components/ui/Table";
import { ReliabilityChart, SkillByLeadChart } from "@/components/methodology/SkillCharts";

const PIPELINE = [
  {
    icon: Database,
    title: "1. Data sources",
    items: ["IMD 0.25° gridded rainfall (1901–present)", "ERA5 reanalysis (winds, moisture, OLR proxies)", "CHIRPS satellite rainfall (block downscaling)", "NOAA ENSO (ONI / Niño-3.4) & IOD (DMI)", "BoM / NOAA MJO RMM index", "ECMWF / IMD ERF sub-seasonal reforecasts"],
  },
  {
    icon: SlidersHorizontal,
    title: "2. Feature engineering",
    items: ["Onset & dry-spell labels per block (IMD criteria + 7-day dry spell)", "MJO phase / amplitude, BSISO indices", "ENSO, IOD state and tendency", "Low-level jet, monsoon trough, soil moisture", "Block climatology, terrain & distance from coast"],
  },
  {
    icon: Cpu,
    title: "3. Hybrid model",
    items: ["Physics prior: MJO/BSISO phase composites of block rainfall anomalies", "ML downscaling: gradient boosting (LightGBM) + sequence model (LSTM/Temporal CNN)", "Inputs: prior + dynamical reforecast + local predictors", "Outputs: weekly P(onset), P(dry spell), P(heavy rain), weeks 1–4"],
  },
  {
    icon: Scale,
    title: "4. Probability calibration",
    items: ["Isotonic regression / Platt scaling per lead week", "Reliability checked on 2000–2020 hindcasts", "Confidence = f(lead time, ensemble spread, historical skill)"],
  },
  {
    icon: MapIcon,
    title: "5. Risk maps",
    items: ["Block / panchayat polygons coloured by risk", "Weeks 1–4 with explicit confidence", "Priority scoring for officers"],
  },
  {
    icon: Workflow,
    title: "6. Advisory engine",
    items: ["Crop × growth stage × probability thresholds", "Explainable rules with 'Why this advice?'", "Agronomist-tunable thresholds (ICAR / district contingency plans)"],
  },
  {
    icon: Megaphone,
    title: "7. Delivery",
    items: ["Mobile-first PWA (works offline)", "SMS & WhatsApp in Marathi / Hindi / English", "Voice (text-to-speech)", "Officer campaigns & feedback loop"],
  },
];

const STATUS: { part: string; today: string; later: string }[] = [
  { part: "Block forecasts (onset / dry spell / heavy rain)", today: "Deterministic seeded generator with spatial coherence (data/forecasts.ts)", later: "Hybrid model API (lib/forecastService.ts → REST)" },
  { part: "Climate drivers (ENSO, IOD, MJO)", today: "Static mock values & synthetic MJO trajectory", later: "Daily ingest from NOAA CPC, BoM RMM, JAMSTEC" },
  { part: "Block boundaries", today: "Approximate hexagonal cells around taluka centroids", later: "Official block / panchayat GeoJSON (LGD, Bhuvan)" },
  { part: "Advisory rules engine", today: "Working pure TypeScript engine (lib/advisoryEngine.ts)", later: "Same engine, thresholds tuned with KVK agronomists" },
  { part: "What-if simulator", today: "Transparent linear sensitivity model (lib/whatIf.ts)", later: "Re-run of the calibrated model with perturbed drivers" },
  { part: "Historical replay", today: "Synthetic rainfall shaped after 2009 & 2014", later: "IMD observations + archived reforecast hindcasts" },
  { part: "Auth", today: "Client-side demo accounts (localStorage)", later: "OTP login / Agristack farmer ID, server-side sessions" },
  { part: "SMS / WhatsApp", today: "Simulated gateway & delivery statuses", later: "DLT-registered SMS gateway, WhatsApp Business API" },
  { part: "Voice", today: "Browser speechSynthesis", later: "IVR / pre-recorded dialect audio" },
  { part: "Feedback & analytics", today: "Stored in browser + seeded mock data", later: "Backend DB feeding model & rule re-tuning" },
];

export default function MethodologyPage() {
  return (
    <PageShell>
      <PageTitle icon={BookOpen} title="Model & methodology" subtitle="How the hybrid framework works, how we will validate it, and what is simulated in this prototype" />

      <div className="space-y-6">
        {/* Architecture */}
        <Card pad>
          <CardHeader title="Hybrid framework architecture" subtitle="Global signals → block-level probabilities → crop advice → farmers" as="h2" icon={Workflow} />
          <ol className="mt-5 grid gap-2 lg:grid-cols-7">
            {PIPELINE.map((s, i) => (
              <li key={s.title} className="relative flex flex-col">
                <div className={`h-full rounded-card border p-3 ${i === 2 ? "border-monsoon-200 bg-monsoon-50" : "border-line bg-white"}`}>
                  <s.icon className={`h-5 w-5 ${i === 2 ? "text-monsoon-700" : "text-leaf-600"}`} aria-hidden />
                  <p className="mt-2 text-[12.5px] font-bold leading-snug text-ink">{s.title}</p>
                  <ul className="mt-1.5 space-y-1 text-[11.5px] leading-relaxed text-body">
                    {s.items.map((it) => (
                      <li key={it} className="flex gap-1">
                        <span aria-hidden>·</span>
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < PIPELINE.length - 1 && (
                  <span aria-hidden className="flex justify-center py-1 text-slate-300 lg:absolute lg:-right-2 lg:top-1/2 lg:z-10 lg:-translate-y-1/2 lg:py-0">
                    <ArrowDown className="h-4 w-4 lg:hidden" />
                    <ArrowRight className="hidden h-4 w-4 rounded-full bg-canvas lg:block" />
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className={`mt-4 p-3.5 text-[13px] leading-relaxed text-body ${INSET}`}>
            <strong className="text-ink">Why hybrid?</strong> Dynamical models capture the large-scale MJO/BSISO evolution but are too coarse for blocks. Pure ML overfits
            short records. Using physically based MJO-phase composites as a prior, and ML only to downscale and correct it, keeps forecasts physically consistent and
            explainable.
          </p>
        </Card>

        {/* Validation */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card pad>
            <CardHeader title="Reliability diagram" subtitle="When we say 70%, it should happen ~70% of the time" as="h2" icon={Gauge} />
            <div className="mt-2">
              <ReliabilityChart />
            </div>
            <p className={`mt-1 ${CAPTION}`}>
              <strong className="text-sun-600">Illustrative:</strong> target shape, not a result. Slight over-confidence at high probabilities is typical before calibration.
            </p>
          </Card>
          <Card pad>
            <CardHeader title="Skill by lead time" subtitle="Brier skill score vs. climatology (0 = no better than climatology)" as="h2" icon={Gauge} />
            <div className="mt-2">
              <SkillByLeadChart />
            </div>
            <p className={`mt-1 ${CAPTION}`}>
              <strong className="text-sun-600">Illustrative:</strong> expected decline of skill with lead time; weeks 3–4 approach climatology.
            </p>
          </Card>
        </div>

        <Card pad>
          <CardHeader title="Validation plan" as="h2" icon={Scale} />
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["Backtest 2000–2020", "leave-one-year-out hindcasts for every block and lead week, with special focus on false-onset years (2009, 2012, 2014, 2015, 2019)."],
              ["Metrics", "Brier skill score and RPSS vs. climatology, reliability diagrams, ROC-AUC for dry-spell events, onset date error (days)."],
              ["Benchmarks", "climatology, persistence, and raw IMD extended-range forecast interpolated to blocks."],
              ["Decision value", "cost-loss analysis of \u201Cdelay sowing\u201D advice, and farmer-reported outcomes from the feedback loop and KVK field trials."],
            ].map(([term, detail]) => (
              <li key={term} className={`p-3.5 text-[13px] leading-relaxed text-body ${INSET}`}>
                <strong className="text-ink">{term}:</strong> {detail}
              </li>
            ))}
          </ul>
        </Card>

        {/* Limitations */}
        <Card pad className="border-sun-200 bg-sun-50/40">
          <CardHeader title="Honest limitations" as="h2" icon={TriangleAlert} />
          <ul className="mt-4 space-y-2.5 text-[13px] leading-relaxed text-body">
            {[
              ["Skill declines at weeks 3–4.", "Beyond ~2 weeks, forecasts are only modestly better than climatology. The UI shows lower confidence and hatched cards for these weeks."],
              ["Resolution constraints.", "Input data are 0.25°–1° (roughly 25–100 km). Block-level values are statistically downscaled; convective rain within a block can still differ from field to field."],
              ["MJO dependence.", "When the MJO is weak (amplitude < 1), sub-seasonal predictability drops and advice relies more on climatology."],
              ["Short records & non-stationarity.", "Climate change is shifting onset and break statistics; models must be retrained and recalibrated regularly."],
              ["Advice is decision support.", "Local knowledge, soil moisture and seed availability matter; officers can override or add context."],
            ].map(([term, detail]) => (
              <li key={term} className="flex gap-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-sun-400" aria-hidden />
                <span>
                  <strong className="text-ink">{term}</strong> {detail}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Prototype status */}
        <Card pad>
          <CardHeader title="Prototype status" subtitle="What is simulated today vs. what plugs in later" as="h2" icon={Cpu} />
          <div className="mt-4">
            <TableFrame>
              <Table caption="Prototype status of each component" minWidth="720px">
                <THead>
                  <tr>
                    <Th>Component</Th>
                    <Th>Today (prototype)</Th>
                    <Th>Plugs in later</Th>
                  </tr>
                </THead>
                <tbody>
                  {STATUS.map((s) => {
                    const real = s.today.startsWith("Working");
                    return (
                      <tr key={s.part} className={`${TR} align-top`}>
                        <RowTh className="align-top">{s.part}</RowTh>
                        <Td className="align-top">
                          <span
                            className={`mr-1.5 inline-block rounded-full border px-2 py-0.5 text-[9.5px] font-bold tracking-wide ${
                              real ? "border-green-200 bg-green-50 text-green-800" : "border-sun-200 bg-sun-50 text-sun-600"
                            }`}
                          >
                            {real ? "REAL LOGIC" : "SIMULATED"}
                          </span>
                          {s.today}
                        </Td>
                        <Td className="align-top text-muted">{s.later}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableFrame>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
