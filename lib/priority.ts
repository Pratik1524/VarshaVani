/**
 * Officer-side prioritisation and risk flags (pure functions).
 *
 * Priority score (0-100), documented so officers can trust the ranking:
 *   0.55 * breakNear          (dry-spell chance this week or next)
 * + 0.20 * heavy              (heavy-rain chance this week)
 * + 0.15 * (100 - irrigated%) (rain-fed blocks are more exposed)
 * + 12 if false-onset storyline is detected
 */
import type { Block, BlockForecast, CropId, Week } from "@/types";
import { getAdvisory } from "./advisoryEngine";
import { clamp } from "./seededRandom";

export const PRIORITY_THRESHOLD = 60;

export function breakNear(f: BlockForecast, week: Week): number {
  const w = f.weeks[week - 1];
  const next = f.weeks[week];
  return Math.max(w.breakProb, next?.breakProb ?? 0);
}

export function priorityScore(block: Block, f: BlockForecast, week: Week): number {
  const w = f.weeks[week - 1];
  const s = 0.55 * breakNear(f, week) + 0.2 * w.heavyRain + 0.15 * (100 - block.irrigatedPct) + (f.falseOnsetRisk ? 12 : 0);
  return Math.round(clamp(s, 0, 100));
}

export type FlagKind = "insurance_dry" | "insurance_flood" | "irrigation";

export interface RiskFlag {
  blockId: string;
  kind: FlagKind;
  label: string;
  detail: string;
  weeks: Week[];
}

/**
 * Flags inspired by PMFBY "mid-season adversity" / "localised calamity"
 * triggers. Illustrative thresholds, not official scheme rules.
 */
export function riskFlags(block: Block, f: BlockForecast): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const dryWeeks = f.weeks.filter((w) => w.breakProb >= 60).map((w) => w.week);
  const consecutive = dryWeeks.some((w) => dryWeeks.includes((w + 1) as Week));
  if (consecutive) {
    flags.push({
      blockId: block.id,
      kind: "insurance_dry",
      label: "Crop insurance: prolonged dry spell watch",
      detail: `Dry-spell chance ≥ 60% in consecutive weeks ${dryWeeks.join(", ")}. Prepare mid-season adversity assessment.`,
      weeks: dryWeeks,
    });
  }
  const floodWeeks = f.weeks.filter((w) => w.heavyRain >= 70).map((w) => w.week);
  if (floodWeeks.length) {
    flags.push({
      blockId: block.id,
      kind: "insurance_flood",
      label: "Crop insurance: inundation / localised calamity watch",
      detail: `Heavy-rain chance ≥ 70% in week ${floodWeeks.join(", ")}. Alert farmers to report losses within 72 h.`,
      weeks: floodWeeks,
    });
  }
  const irrigationWeeks = f.weeks.filter((w) => w.breakProb >= 60).map((w) => w.week);
  if (irrigationWeeks.length && block.irrigatedPct < 25) {
    flags.push({
      blockId: block.id,
      kind: "irrigation",
      label: "Protective irrigation planning",
      detail: `Only ${block.irrigatedPct}% irrigated. Plan farm-pond / tanker support for weeks ${irrigationWeeks.join(", ")}.`,
      weeks: irrigationWeeks,
    });
  }
  return flags;
}

/** Sowing decision for a block's lead crop (or a chosen crop) at a week. */
export function blockDecision(block: Block, f: BlockForecast, week: Week, crop?: CropId) {
  return getAdvisory(crop ?? block.majorCrops[0], "not_sown", f, week, { block });
}
