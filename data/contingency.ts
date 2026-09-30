/**
 * ILLUSTRATIVE planning assumptions for the officer Contingency Planner.
 * These are round, typical figures chosen to make the formulas readable.
 * They are NOT official norms; replace them with district agriculture
 * department figures (or a real planning API) before any real use.
 */
import type { CropId } from "@/types";

/** Seed rate for a short-duration re-sowing / switch variety (kg per hectare). */
export const SEED_RATE_KG_HA: Record<CropId, number> = {
  soybean: 75,
  cotton: 3,
  tur: 15,
  rice: 40,
  bajra: 4,
  maize: 20,
};

/**
 * Share of a block's Kharif area under the chosen crop, by the crop's rank
 * in the block's major-crop list (1st, 2nd, 3rd, 4th). Crops not listed as
 * major get `OTHER_CROP_SHARE`.
 */
export const CROP_SHARE_BY_RANK = [0.35, 0.2, 0.15, 0.1];
export const OTHER_CROP_SHARE = 0.03;

export const ASSUMPTIONS = {
  /** Dry-spell (break) probability that counts as "high risk". */
  dryThreshold: 60,
  /** Heavy-rain probability that counts as "heavy-rain risk". */
  heavyThreshold: 50,
  /** Heavy-rain probability that triggers an inundation insurance alert. */
  floodInsuranceThreshold: 70,
  /** Blocks below this irrigated share need protective irrigation planning. */
  rainfedIrrigatedPct: 40,
  /** Share of the crop area in a dry-risk block that may need short-duration re-sowing seed. */
  resowShare: 0.25,
  /** Share of registered farmers the advisory campaign reaches (SMS + WhatsApp). */
  reachShare: 0.62,
  /** Share of reached farmers in at-risk blocks who change their sowing plan. */
  changeShare: 0.18,
  /** Share of farmers who act on a warning (protects that share of at-risk area). */
  adoption: 0.5,
  /** Re-sowing cost avoided per hectare, INR (seed + labour). */
  resowingCostPerHa: 9500,
  /** Days before the risk week that a task should be finished. */
  leadDays: 2,
} as const;

/** Lead-time accuracy of the (simulated) forecast, hit rate % by lead week. */
export const LEAD_TIME_HIT_RATE = [82, 74, 64, 56];
