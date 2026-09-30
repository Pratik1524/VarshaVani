import type { Layer, RiskLevel } from "@/types";

/**
 * Single source of truth for the risk colour system.
 * Green = safe/low, Yellow = watch, Orange = elevated, Red = high.
 * Colour is always paired with an icon and a text label in the UI.
 */

export const RISK_ORDER: RiskLevel[] = ["low", "watch", "elevated", "high"];

export const RISK_RANK: Record<RiskLevel, number> = { low: 0, watch: 1, elevated: 2, high: 3 };

export const RISK_HEX: Record<RiskLevel, string> = {
  low: "#16a34a",
  watch: "#eab308",
  elevated: "#f97316",
  high: "#dc2626",
};

/** Tailwind classes for chips/badges (contrast-checked text on tinted background). */
export const RISK_CLASSES: Record<RiskLevel, { bg: string; text: string; border: string; solid: string }> = {
  low: { bg: "bg-green-50", text: "text-green-800", border: "border-green-200", solid: "bg-green-600 text-white" },
  watch: { bg: "bg-yellow-50", text: "text-yellow-900", border: "border-yellow-200", solid: "bg-yellow-400 text-yellow-950" },
  elevated: { bg: "bg-orange-50", text: "text-orange-900", border: "border-orange-200", solid: "bg-orange-500 text-white" },
  high: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", solid: "bg-red-600 text-white" },
};

/** Map a "bad outcome" probability (0-100) to a risk level. */
export function riskFromProb(p: number): RiskLevel {
  if (p >= 65) return "high";
  if (p >= 50) return "elevated";
  if (p >= 30) return "watch";
  return "low";
}

/**
 * Risk level for a map layer. For the onset layer a HIGH onset chance is
 * favourable, so the scale is inverted (low onset chance = delayed-onset risk).
 */
export function riskForLayer(layer: Layer, p: number): RiskLevel {
  if (layer === "onset") return riskFromProb(100 - p);
  return riskFromProb(p);
}

/** Plain-word bucket for farmers who may not read percentages. */
export type ProbWord = "low" | "medium" | "high";
export function probWord(p: number): ProbWord {
  if (p >= 65) return "high";
  if (p >= 35) return "medium";
  return "low";
}
