/**
 * VarshaVani advisory expert system.
 *
 * Pure, deterministic functions: (crop, stage, forecast, week) -> Advisory.
 * No UI or network code here, so the engine is easy to unit test and can be
 * moved server-side unchanged.
 *
 * The engine returns translatable messages ({ key, params }) instead of text.
 * Param values starting with "@" are themselves i18n keys (e.g. "@crop.soybean").
 *
 * Rule evaluation
 *  1. Every rule whose condition matches contributes a candidate.
 *  2. The candidate with the highest severity becomes the primary action
 *     (ties -> lower `priority` number wins).
 *  3. Other matched candidates are surfaced as "Also do" actions.
 *  4. The sowing decision (sow / caution / wait) always comes from the sowing
 *     rules, and is downgraded to "caution" if heavy rain is imminent.
 */

import type {
  Advisory,
  AdvisoryType,
  Block,
  BlockForecast,
  ClimateDrivers,
  CropId,
  GrowthStage,
  Msg,
  RiskLevel,
  SowDecision,
  Week,
  WeekForecast,
} from "@/types";
import { CROPS, PRE_SOWING_STAGES } from "@/data/crops";
import { BLOCK_BY_ID } from "@/data/blocks";
import { DRIVERS, MJO_INDIA_EFFECT } from "@/data/drivers";
import { RISK_RANK } from "./riskColors";

/* ------------------------------------------------------------------ */
/* Thresholds (documented so agronomists can tune them)                */
/* ------------------------------------------------------------------ */
export const THRESHOLDS = {
  /** Onset probability considered "likely". */
  onsetLikely: 70,
  /** Break probability considered "low" for safe sowing. */
  breakLow: 30,
  /** Break probability that raises sowing caution to "elevated". */
  breakCaution: 45,
  /** Break probability at flowering / grain filling that needs irrigation. */
  breakCritical: 50,
  /** Heavy-rain probability that triggers drainage / spray advisories. */
  heavy: 60,
  heavySevere: 75,
  heavyWatch: 40,
} as const;

export interface EngineOptions {
  drivers?: ClimateDrivers;
  block?: Block;
}

interface Signals {
  crop: CropId;
  stage: GrowthStage;
  week: Week;
  w: WeekForecast;
  next?: WeekForecast;
  /** Max break probability across this week and the next (~10-14 day window). */
  breakNear: number;
  breakNearWeek: Week;
  breakThreshold: number;
  forecast: BlockForecast;
  block?: Block;
  drivers: ClimateDrivers;
}

interface Candidate {
  ruleId: string;
  priority: number;
  type: AdvisoryType;
  severity: RiskLevel;
  action: Msg;
  reasons: Msg[];
  alternatives: Msg[];
  irrigationTip: Msg;
  decision?: SowDecision;
  confidence: number;
}

const m = (key: string, params?: Msg["params"]): Msg => ({ key, params });
const cropParam = (c: CropId) => `@crop.${c}`;
const maxSeverity = (a: RiskLevel, b: RiskLevel): RiskLevel => (RISK_RANK[a] >= RISK_RANK[b] ? a : b);

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

type Rule = { id: string; priority: number; when: (s: Signals) => boolean; build: (s: Signals) => Candidate };

const isPreSowing = (s: Signals) => PRE_SOWING_STAGES.includes(s.stage);

function sowingAlternatives(s: Signals, strong: boolean): Msg[] {
  const crop = CROPS[s.crop];
  const alts = crop.alternatives.map((k) => m(k));
  // Drought-sensitive crops in break-prone Marathwada (or a very high break
  // risk anywhere) -> also suggest switching to a hardier crop.
  const breakProne = s.block?.zone === "Marathwada" || s.breakNear >= 70;
  if (strong && crop.droughtTolerance < 0.5 && breakProne) {
    alts.push(m("alt.bajra_switch"));
    alts.push(m("alt.contingency_plan"));
  }
  return strong ? alts : alts.slice(0, 1);
}

const RULES: Rule[] = [
  {
    id: "SOW-01-DELAY",
    priority: 1,
    when: (s) => isPreSowing(s) && s.breakNear > s.breakThreshold,
    build: (s) => {
      const severe = s.breakNear >= s.breakThreshold + 10 || s.forecast.falseOnsetRisk;
      const reasons: Msg[] = [m("reason.break_high", { p: s.breakNear, week: s.breakNearWeek })];
      if (s.forecast.falseOnsetRisk && s.forecast.recentRainMm >= 20) {
        reasons.unshift(m("reason.false_onset", { mm: s.forecast.recentRainMm }));
      }
      if (s.w.onset >= 60) reasons.push(m("reason.onset_but_break", { p: s.w.onset }));
      return {
        ruleId: "SOW-01-DELAY",
        priority: 1,
        type: "delay_sowing",
        severity: severe ? "high" : "elevated",
        decision: "wait",
        action:
          s.stage === "sowing"
            ? m("adv.pause_sowing", { crop: cropParam(s.crop) })
            : m("adv.delay_sowing", { crop: cropParam(s.crop), days: s.breakNear >= 75 ? "10-14" : "7-10" }),
        reasons,
        alternatives: sowingAlternatives(s, true),
        irrigationTip: m("irr.hold_sowing"),
        confidence: avgConfidence(s),
      };
    },
  },
  {
    id: "SOW-02-SAFE",
    priority: 2,
    when: (s) => isPreSowing(s) && s.w.onset > THRESHOLDS.onsetLikely && s.breakNear < THRESHOLDS.breakLow,
    build: (s) => ({
      ruleId: "SOW-02-SAFE",
      priority: 2,
      type: "safe_to_sow",
      severity: "low",
      decision: "sow",
      action: m(s.crop === "rice" ? "adv.safe_rice" : "adv.safe_to_sow", { crop: cropParam(s.crop) }),
      reasons: [m("reason.onset_high", { p: s.w.onset }), m("reason.break_low", { p: s.breakNear })],
      alternatives: [m("alt.seed_treatment")],
      irrigationTip: m("irr.sow_after_rain", { mm: CROPS[s.crop].sowingRainMm }),
      confidence: avgConfidence(s),
    }),
  },
  {
    id: "SOW-03-CAUTION",
    priority: 3,
    when: (s) =>
      isPreSowing(s) &&
      !(s.breakNear > s.breakThreshold) &&
      !(s.w.onset > THRESHOLDS.onsetLikely && s.breakNear < THRESHOLDS.breakLow),
    build: (s) => {
      const reasons: Msg[] = [];
      if (s.w.onset <= THRESHOLDS.onsetLikely) reasons.push(m("reason.onset_uncertain", { p: s.w.onset }));
      if (s.breakNear >= THRESHOLDS.breakLow) reasons.push(m("reason.break_moderate", { p: s.breakNear, week: s.breakNearWeek }));
      return {
        ruleId: "SOW-03-CAUTION",
        priority: 3,
        type: "sow_caution",
        severity: s.breakNear >= THRESHOLDS.breakCaution ? "elevated" : "watch",
        decision: "caution",
        action: m("adv.sow_caution", { crop: cropParam(s.crop), mm: CROPS[s.crop].sowingRainMm }),
        reasons,
        alternatives: [m("alt.staggered"), ...sowingAlternatives(s, false)],
        irrigationTip: m("irr.sow_after_rain", { mm: CROPS[s.crop].sowingRainMm }),
        confidence: avgConfidence(s),
      };
    },
  },
  {
    id: "GRO-01-DRY",
    priority: 2,
    when: (s) => (s.stage === "germination" || s.stage === "vegetative") && s.breakNear > s.breakThreshold,
    build: (s) => ({
      ruleId: "GRO-01-DRY",
      priority: 2,
      type: "conserve_moisture",
      severity: s.stage === "germination" && s.breakNear >= 75 ? "high" : "elevated",
      action: m("adv.conserve_moisture", { crop: cropParam(s.crop) }),
      reasons: [m("reason.break_high", { p: s.breakNear, week: s.breakNearWeek }), m(`reason.stage_${s.stage}`)],
      alternatives: [m("alt.gap_filling"), m("alt.mulch")],
      irrigationTip: m("irr.lifesaving"),
      confidence: avgConfidence(s),
    }),
  },
  {
    id: "CRT-01-IRRIGATE",
    priority: 1,
    when: (s) => (s.stage === "flowering" || s.stage === "grain_filling") && s.breakNear > THRESHOLDS.breakCritical,
    build: (s) => ({
      ruleId: "CRT-01-IRRIGATE",
      priority: 1,
      type: "protective_irrigation",
      severity: s.breakNear >= 65 ? "high" : "elevated",
      action: m("adv.protective_irrigation", { crop: cropParam(s.crop) }),
      reasons: [m("reason.critical_stage", { crop: cropParam(s.crop) }), m("reason.break_high", { p: s.breakNear, week: s.breakNearWeek })],
      alternatives: [m("alt.foliar_spray"), m("alt.mulch")],
      irrigationTip: m("irr.critical"),
      confidence: avgConfidence(s),
    }),
  },
  {
    id: "HVY-01-HEAVY",
    priority: 2,
    when: (s) => s.w.heavyRain > THRESHOLDS.heavy,
    build: (s) => {
      let key = "adv.heavy_growing";
      if (s.crop === "rice") key = "adv.heavy_rice";
      else if (isPreSowing(s)) key = "adv.heavy_sowing";
      else if (s.stage === "grain_filling") key = "adv.heavy_harvest";
      return {
        ruleId: "HVY-01-HEAVY",
        priority: 2,
        type: "heavy_rain",
        severity: s.w.heavyRain >= THRESHOLDS.heavySevere ? "high" : "elevated",
        action: m(key, { crop: cropParam(s.crop) }),
        reasons: [m("reason.heavy_high", { p: s.w.heavyRain, week: s.week })],
        alternatives: [m("alt.delay_fertilizer"), m("alt.drainage")],
        irrigationTip: m("irr.drain"),
        confidence: s.w.confidence,
      };
    },
  },
  {
    id: "HVY-02-WATCH",
    priority: 4,
    when: (s) => s.w.heavyRain > THRESHOLDS.heavyWatch && s.w.heavyRain <= THRESHOLDS.heavy,
    build: (s) => ({
      ruleId: "HVY-02-WATCH",
      priority: 4,
      type: "heavy_watch",
      severity: "watch",
      action: m("adv.heavy_watch"),
      reasons: [m("reason.heavy_moderate", { p: s.w.heavyRain, week: s.week })],
      alternatives: [m("alt.drainage")],
      irrigationTip: m("irr.drain"),
      confidence: s.w.confidence,
    }),
  },
];

/** Fallback when no risk rule fires for a sown crop. */
function routine(s: Signals): Candidate {
  return {
    ruleId: "RTN-01",
    priority: 9,
    type: "routine",
    severity: "low",
    action: m(`adv.routine_${s.stage}`, { crop: cropParam(s.crop) }),
    reasons: [m("reason.no_major_risk", { p: s.breakNear })],
    alternatives: [],
    irrigationTip: m("irr.routine"),
    confidence: s.w.confidence,
  };
}

function avgConfidence(s: Signals): number {
  const vals = [s.w.confidence, ...(s.next && s.breakNearWeek !== s.week ? [s.next.confidence] : [])];
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/* ------------------------------------------------------------------ */
/* "Why this advice?" driver explanations                              */
/* ------------------------------------------------------------------ */

export function explainDrivers(drivers: ClimateDrivers, forecast: BlockForecast, week: Week, block?: Block): Msg[] {
  const out: Msg[] = [];
  const { mjo, enso, iod } = drivers;
  const effect = MJO_INDIA_EFFECT[mjo.phase] ?? 0;
  const mjoParams = { phase: mjo.phase, region: `@region.${mjo.phase}` };
  if (mjo.amplitude < 1) out.push(m("why.mjo_weak", mjoParams));
  else if (effect <= -0.3) out.push(m("why.mjo_suppressed", mjoParams));
  else if (effect >= 0.3) out.push(m("why.mjo_active", mjoParams));
  else out.push(m("why.mjo_neutral", mjoParams));

  const e = enso.index.toFixed(1);
  if (enso.index >= 0.5) out.push(m("why.enso_elnino", { value: e }));
  else if (enso.index <= -0.5) out.push(m("why.enso_lanina", { value: e }));
  else out.push(m("why.enso_neutral", { value: e }));

  const d = iod.index.toFixed(1);
  if (iod.index >= 0.4) out.push(m("why.iod_positive", { value: d }));
  else if (iod.index <= -0.4) out.push(m("why.iod_negative", { value: d }));
  else out.push(m("why.iod_neutral", { value: d }));

  if (forecast.falseOnsetRisk) {
    // "#block:<id>" is resolved to the localised block name by the i18n layer.
    out.push(m("why.local_false_onset", { mm: forecast.recentRainMm, block: `#block:${block?.id ?? forecast.blockId}` }));
  }
  if (week >= 3) out.push(m("why.low_skill", { week }));
  return out;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

function buildSignals(crop: CropId, stage: GrowthStage, forecast: BlockForecast, week: Week, opts: EngineOptions): Signals {
  const w = forecast.weeks[week - 1];
  const next = forecast.weeks[week];
  const nextBreak = next ? next.breakProb : -1;
  const breakNear = Math.max(w.breakProb, nextBreak);
  return {
    crop,
    stage,
    week,
    w,
    next,
    breakNear,
    breakNearWeek: nextBreak > w.breakProb ? ((week + 1) as Week) : week,
    breakThreshold: CROPS[crop].breakThreshold,
    forecast,
    block: opts.block ?? BLOCK_BY_ID[forecast.blockId],
    drivers: opts.drivers ?? DRIVERS,
  };
}

/**
 * Compute the advisory for one crop at one growth stage for a block/week.
 */
export function getAdvisory(
  crop: CropId,
  stage: GrowthStage,
  forecast: BlockForecast,
  week: Week,
  opts: EngineOptions = {},
): Advisory {
  const s = buildSignals(crop, stage, forecast, week, opts);
  const matched = RULES.filter((r) => r.when(s)).map((r) => r.build(s));
  if (!isPreSowing(s) && matched.every((c) => c.type === "heavy_watch")) matched.push(routine(s));

  // A "heavy rain watch" is informational: it never displaces a real action.
  const rank = (c: Candidate) => (c.type === "heavy_watch" ? -1 : RISK_RANK[c.severity]);
  matched.sort((a, b) => rank(b) - rank(a) || a.priority - b.priority);
  const primary = matched[0];
  const others = matched.slice(1);

  // Sowing decision comes from whichever sowing rule matched.
  let decision = matched.find((c) => c.decision)?.decision;
  if (decision === "sow" && s.w.heavyRain > THRESHOLDS.heavy && crop !== "rice") decision = "caution";

  const reasons = [...primary.reasons];
  for (const o of others) for (const r of o.reasons) if (!reasons.some((x) => x.key === r.key)) reasons.push(r);

  const alsoDo = others.map((o) => o.action);
  if (crop === "rice" && isPreSowing(s) && decision !== "wait") alsoDo.push(m("also.rice_nursery"));

  let severity = primary.severity;
  if (decision === "caution" && primary.type === "safe_to_sow") severity = maxSeverity(severity, "watch");

  return {
    id: `${forecast.blockId}:${crop}:${stage}:w${week}:${primary.ruleId}`,
    type: primary.type,
    ruleId: primary.ruleId,
    crop,
    stage,
    week,
    blockId: forecast.blockId,
    action: primary.action,
    severity,
    decision,
    reasons,
    drivers: explainDrivers(s.drivers, forecast, week, s.block),
    alternatives: primary.alternatives,
    irrigationTip: primary.irrigationTip,
    alsoDo,
    confidence: primary.confidence,
  };
}

/**
 * Sowing-window optimiser: evaluates the sowing decision for each of the
 * next 4 weeks and scores them (higher = better window).
 */
export function sowingWindows(crop: CropId, forecast: BlockForecast, opts: EngineOptions = {}) {
  return forecast.weeks.map((w) => {
    const adv = getAdvisory(crop, "not_sown", forecast, w.week, opts);
    const next = forecast.weeks[w.week];
    // Score favours onset now and no dry spell in the following ~2 weeks.
    const breakAfter = Math.max(w.breakProb, next?.breakProb ?? w.breakProb);
    const score = Math.round(Math.max(0, Math.min(100, w.onset * 0.55 + (100 - breakAfter) * 0.45 - (w.heavyRain > 75 ? 10 : 0))));
    return { week: w.week, startDate: w.startDate, endDate: w.endDate, decision: adv.decision ?? "caution", score, advisory: adv };
  });
}
