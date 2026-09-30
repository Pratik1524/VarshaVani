import type { Crop, CropId, GrowthStage } from "@/types";

/**
 * Crop parameters used by the advisory engine.
 * Values are simplified from typical agronomic guidance (illustrative).
 * `alternatives` are i18n keys resolved in lib/i18n.
 */
export const CROPS: Record<CropId, Crop> = {
  soybean: {
    id: "soybean",
    durationDays: [90, 105],
    droughtTolerance: 0.35,
    breakThreshold: 60,
    sowingRainMm: 100,
    emoji: "🫘",
    alternatives: ["alt.soybean_short", "alt.tur_intercrop", "alt.bbf"],
  },
  cotton: {
    id: "cotton",
    durationDays: [150, 180],
    droughtTolerance: 0.5,
    breakThreshold: 60,
    sowingRainMm: 75,
    emoji: "🌿",
    alternatives: ["alt.cotton_delay", "alt.tur_intercrop", "alt.ridge_furrow"],
  },
  tur: {
    id: "tur",
    durationDays: [150, 180],
    droughtTolerance: 0.7,
    breakThreshold: 65,
    sowingRainMm: 75,
    emoji: "🌱",
    alternatives: ["alt.tur_short", "alt.bbf"],
  },
  rice: {
    id: "rice",
    durationDays: [110, 135],
    droughtTolerance: 0.2,
    breakThreshold: 55,
    sowingRainMm: 120,
    emoji: "🌾",
    alternatives: ["alt.rice_dsr", "alt.rice_short"],
  },
  bajra: {
    id: "bajra",
    durationDays: [75, 90],
    droughtTolerance: 0.85,
    breakThreshold: 70,
    sowingRainMm: 50,
    emoji: "🌾",
    alternatives: ["alt.bajra_hybrid", "alt.tur_intercrop"],
  },
  maize: {
    id: "maize",
    durationDays: [95, 110],
    droughtTolerance: 0.4,
    breakThreshold: 60,
    sowingRainMm: 75,
    emoji: "🌽",
    alternatives: ["alt.maize_short", "alt.bajra_switch"],
  },
};

export const CROP_IDS: CropId[] = ["soybean", "cotton", "tur", "rice", "bajra", "maize"];

export const STAGES: GrowthStage[] = [
  "not_sown",
  "sowing",
  "germination",
  "vegetative",
  "flowering",
  "grain_filling",
];

/** Stages where a sowing decision (sow / caution / wait) applies. */
export const PRE_SOWING_STAGES: GrowthStage[] = ["not_sown", "sowing"];
