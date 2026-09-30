import type { BlockForecast, HistoryDay, HistoryEvent, HistoryReplay, Week, Zone } from "@/types";
import { BLOCK_BY_ID } from "./blocks";
import { confidenceLevel } from "./forecasts";
import { rng } from "@/lib/seededRandom";

/**
 * SIMULATED historical replay ("hindcast") scenarios.
 * Patterns are inspired by the weak/delayed onsets of 2009 and 2014, when
 * early showers were followed by long June-July dry spells in Maharashtra.
 * Daily values are synthetic and ILLUSTRATIVE, not observed IMD data.
 */

interface YearTemplate {
  year: number;
  title: string;
  summary: string;
  earlyRainStart: string; // first day of early showers
  earlyRainDays: number;
  earlyRainTotal: number;
  sowingStart: string;
  sowingDays: number;
  warningIssued: string;
  drySpellStart: string;
  drySpellDays: Record<Exclude<Zone, "Konkan">, number>;
  /** Break probability issued on `warningIssued` for the 5 following weeks. */
  predictedBreak: number[];
  /** Approximate driver state on the warning date (reconstructed, illustrative). */
  drivers: { enso: number; iod: number; mjoPhase: number; mjoAmp: number };
  /** Relative share of farmers who sowed on the early rain (1 = zone default). */
  sownAreaScale?: number;
}

export const REPLAY_YEARS: YearTemplate[] = [
  {
    year: 2014,
    title: "2014: early showers, then a 3-4 week dry spell",
    summary:
      "Pre-monsoon showers in the second week of June triggered widespread soybean and cotton sowing. The monsoon then stalled for most of late June and early July, forcing many farmers to re-sow.",
    earlyRainStart: "2014-06-08",
    earlyRainDays: 4,
    earlyRainTotal: 58,
    sowingStart: "2014-06-12",
    sowingDays: 5,
    warningIssued: "2014-06-03",
    drySpellStart: "2014-06-17",
    drySpellDays: { Marathwada: 26, "Western Maharashtra": 20, Vidarbha: 18 },
    predictedBreak: [22, 38, 74, 81, 66],
    drivers: { enso: 0.4, iod: -0.1, mjoPhase: 7, mjoAmp: 1.5 },
  },
  {
    year: 2009,
    title: "2009: El Niño year, delayed onset and long break",
    summary:
      "A developing El Niño weakened the monsoon. Scattered showers around 20 June looked like onset, but a long break followed until late July, one of the driest Junes on record.",
    earlyRainStart: "2009-06-20",
    earlyRainDays: 3,
    earlyRainTotal: 44,
    sowingStart: "2009-06-23",
    sowingDays: 4,
    warningIssued: "2009-06-14",
    drySpellStart: "2009-06-27",
    drySpellDays: { Marathwada: 23, "Western Maharashtra": 18, Vidarbha: 21 },
    predictedBreak: [30, 58, 77, 79, 61],
    drivers: { enso: 0.8, iod: 0.2, mjoPhase: 6, mjoAmp: 1.6 },
  },
  {
    year: 2012,
    title: "2012: weak June, then a long stall over Marathwada",
    summary:
      "Light showers around 10 June encouraged some early sowing, but the monsoon made little progress for the rest of June. Marathwada went into one of its worst drought years of the decade.",
    earlyRainStart: "2012-06-10",
    earlyRainDays: 3,
    earlyRainTotal: 40,
    sowingStart: "2012-06-14",
    sowingDays: 4,
    warningIssued: "2012-06-05",
    drySpellStart: "2012-06-18",
    drySpellDays: { Marathwada: 28, "Western Maharashtra": 22, Vidarbha: 17 },
    predictedBreak: [26, 45, 76, 83, 70],
    drivers: { enso: 0.3, iod: 0.4, mjoPhase: 7, mjoAmp: 1.3 },
    sownAreaScale: 0.85,
  },
  {
    year: 2015,
    title: "2015: strong El Niño, good start then a long break",
    summary:
      "Good rain in mid-June led to heavy sowing. As a strong El Niño built up, the monsoon broke in late June and stayed weak through most of July, stressing young soybean and cotton.",
    earlyRainStart: "2015-06-12",
    earlyRainDays: 5,
    earlyRainTotal: 72,
    sowingStart: "2015-06-16",
    sowingDays: 5,
    warningIssued: "2015-06-08",
    drySpellStart: "2015-06-24",
    drySpellDays: { Marathwada: 30, "Western Maharashtra": 24, Vidarbha: 19 },
    predictedBreak: [18, 41, 72, 84, 78],
    drivers: { enso: 1.2, iod: 0.3, mjoPhase: 6, mjoAmp: 1.8 },
    sownAreaScale: 1.25,
  },
  {
    year: 2019,
    title: "2019: delayed onset after a hot pre-monsoon",
    summary:
      "The monsoon arrived late. Isolated storms in the third week of June prompted some sowing, but a dry spell followed before steady rain set in during July.",
    earlyRainStart: "2019-06-22",
    earlyRainDays: 3,
    earlyRainTotal: 38,
    sowingStart: "2019-06-25",
    sowingDays: 4,
    warningIssued: "2019-06-17",
    drySpellStart: "2019-06-29",
    drySpellDays: { Marathwada: 19, "Western Maharashtra": 14, Vidarbha: 16 },
    predictedBreak: [34, 55, 70, 64, 42],
    drivers: { enso: 0.5, iod: 0.3, mjoPhase: 8, mjoAmp: 1.2 },
    sownAreaScale: 0.7,
  },
];

const RESOWING_COST_PER_HA = 9500; // INR, seed + labour (illustrative)
const GERMINATION_FAILURE = 0.6; // share of early-sown area needing re-sowing
const ADOPTION = 0.5; // share of farmers assumed to act on the warning

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000);
}

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

/** Blocks eligible for replay (Konkan rarely sees this failure mode). */
export function isReplayEligible(blockId: string): boolean {
  const b = BLOCK_BY_ID[blockId];
  return !!b && b.zone !== "Konkan";
}

export function buildReplay(year: number, blockId: string): HistoryReplay | null {
  const t = REPLAY_YEARS.find((y) => y.year === year);
  const block = BLOCK_BY_ID[blockId];
  if (!t || !block || block.zone === "Konkan") return null;
  const zone = block.zone as Exclude<Zone, "Konkan">;

  const r = rng(`replay:${year}:${blockId}`);
  const start = `${year}-06-01`;
  const dryDays = t.drySpellDays[zone] + Math.round((r() - 0.5) * 4);
  const earlyOffset = dayDiff(start, t.earlyRainStart);
  const dryOffset = dayDiff(start, t.drySpellStart);
  const revivalOffset = dryOffset + dryDays;

  const daily: HistoryDay[] = [];
  for (let d = 0; d < 61; d++) {
    let rain = 0;
    if (d < earlyOffset) rain = r() < 0.2 ? r() * 4 : 0;
    else if (d < earlyOffset + t.earlyRainDays) rain = (t.earlyRainTotal / t.earlyRainDays) * (0.6 + r() * 0.8);
    else if (d < dryOffset) rain = r() < 0.3 ? r() * 3 : 0;
    else if (d < revivalOffset) rain = r() < 0.1 ? r() * 1.5 : 0;
    else rain = r() < 0.7 ? 4 + r() * 32 : r() * 3;
    daily.push({ date: addDays(start, d), rainMm: +rain.toFixed(1) });
  }

  const revival = addDays(start, revivalOffset);
  const sownAreaPct = Math.round((zone === "Marathwada" ? 38 : zone === "Vidarbha" ? 30 : 26) * (t.sownAreaScale ?? 1));
  const warningLeadDays = dayDiff(t.warningIssued, t.drySpellStart);
  const lossAvoidedCrore =
    (block.kharifAreaHa * (sownAreaPct / 100) * GERMINATION_FAILURE * RESOWING_COST_PER_HA * ADOPTION) / 1e7;

  const predictedBreak = t.predictedBreak.map((p, i) => ({
    weekStart: addDays(t.warningIssued, i * 7),
    prob: Math.max(5, Math.min(95, p + Math.round((r() - 0.5) * 6))),
    issuedOn: t.warningIssued,
  }));
  const dryWeek = predictedBreak.find((p) => t.drySpellStart >= p.weekStart && t.drySpellStart <= addDays(p.weekStart, 6)) ?? predictedBreak[2];

  const events: HistoryEvent[] = [
    {
      date: t.warningIssued,
      kind: "warning",
      label: `VarshaVani (hindcast) warns: ${dryWeek.prob}% dry-spell chance from ${fmt(t.drySpellStart)}. Advice: delay sowing.`,
    },
    { date: t.earlyRainStart, kind: "early_rain", label: `Early showers: ~${t.earlyRainTotal} mm in ${t.earlyRainDays} days` },
    { date: t.sowingStart, kind: "sowing", label: `About ${sownAreaPct}% of farmers sow soybean/cotton` },
    { date: t.drySpellStart, kind: "dry_spell", label: `Dry spell begins (${dryDays} days)` },
    { date: revival, kind: "revival", label: "Monsoon revives" },
    { date: addDays(revival, 3), kind: "resowing", label: "Re-sowing needed on failed fields" },
  ];

  return {
    year,
    blockId,
    title: t.title,
    summary: t.summary,
    daily,
    predictedBreak,
    events,
    warningLeadDays,
    dryDays,
    sownAreaPct,
    resowingCostPerHa: RESOWING_COST_PER_HA,
    lossAvoidedCrore: +lossAvoidedCrore.toFixed(1),
  };
}

/**
 * Turn a hindcast into a BlockForecast so the SAME advisory engine can show
 * what advice would have been issued on the warning date.
 */
export function hindcastForecast(r: HistoryReplay): BlockForecast {
  const early = r.events.find((e) => e.kind === "early_rain")?.date ?? r.predictedBreak[0].weekStart;
  const conf = [80, 68, 52, 40];
  const weeks = r.predictedBreak.slice(0, 4).map((p, i) => {
    const start = p.weekStart;
    const end = addDays(start, 6);
    const hasEarlyRain = early >= start && early <= end;
    return {
      week: (i + 1) as Week,
      startDate: start,
      endDate: end,
      onset: hasEarlyRain ? 72 : i === 0 ? 38 : 24,
      breakProb: p.prob,
      heavyRain: 8,
      expectedRainMm: hasEarlyRain ? 48 : 6,
      confidence: conf[i],
      confidenceLevel: confidenceLevel(conf[i]),
    };
  });
  return {
    blockId: r.blockId,
    issuedOn: r.predictedBreak[0].issuedOn,
    recentRainMm: 6,
    falseOnsetRisk: weeks.some((w, i) => w.onset >= 60 && (weeks[i + 1]?.breakProb ?? 0) >= 60),
    weeks,
  };
}

/** Index (1-based week) of the hindcast week in which farmers sowed. */
export function sowingWeek(r: HistoryReplay): Week {
  const sow = r.events.find((e) => e.kind === "sowing")?.date ?? "";
  const idx = r.predictedBreak.findIndex((p) => sow >= p.weekStart && sow <= addDays(p.weekStart, 6));
  return (Math.min(4, Math.max(1, idx + 1)) as Week);
}

/** Compact per-replay figures for the year-wise distribution dashboard. */
export interface ReplaySummary {
  year: number;
  blockId: string;
  dryDays: number;
  warningLeadDays: number;
  sownAreaPct: number;
  lossAvoidedCrore: number;
  earlyRainMm: number;
  juneRainMm: number;
  julyRainMm: number;
  peakBreakProb: number;
}

export function summarizeReplay(r: HistoryReplay): ReplaySummary {
  const sum = (month: string) => +r.daily.filter((d) => d.date.slice(5, 7) === month).reduce((s, d) => s + d.rainMm, 0).toFixed(0);
  const early = REPLAY_YEARS.find((y) => y.year === r.year)?.earlyRainTotal ?? 0;
  return {
    year: r.year,
    blockId: r.blockId,
    dryDays: r.dryDays,
    warningLeadDays: r.warningLeadDays,
    sownAreaPct: r.sownAreaPct,
    lossAvoidedCrore: r.lossAvoidedCrore,
    earlyRainMm: early,
    juneRainMm: sum("06"),
    julyRainMm: sum("07"),
    peakBreakProb: Math.max(...r.predictedBreak.map((p) => p.prob)),
  };
}

/** Summaries for every replay year × eligible block. */
export function buildReplayDistribution(): ReplaySummary[] {
  return REPLAY_YEARS.flatMap((y) =>
    Object.keys(BLOCK_BY_ID)
      .filter(isReplayEligible)
      .map((id) => buildReplay(y.year, id))
      .filter((r): r is HistoryReplay => !!r)
      .map(summarizeReplay),
  );
}

export const REPLAY_ASSUMPTIONS = {
  resowingCostPerHa: RESOWING_COST_PER_HA,
  germinationFailure: GERMINATION_FAILURE,
  adoption: ADOPTION,
};
