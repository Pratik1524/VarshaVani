/**
 * Contingency Planner logic (pure functions, no UI, no I/O).
 *
 * Input: the existing block forecasts + planning assumptions (data/contingency.ts).
 * Output: situation counts, resource estimates, an action checklist, a
 * readiness score, a ranked block list, and simulated verification / impact.
 *
 * Every function is deterministic and side-effect free, so the mock
 * forecasts can later be swapped for a real model API without touching
 * the UI. Text is returned as translation keys, never as sentences.
 */
import type { Block, BlockForecast, CropId, RiskLevel, Week } from "@/types";
import { BLOCKS } from "@/data/blocks";
import { ASSUMPTIONS, CROP_SHARE_BY_RANK, LEAD_TIME_HIT_RATE, OTHER_CROP_SHARE, SEED_RATE_KG_HA } from "@/data/contingency";
import { sowingWindows } from "./advisoryEngine";
import { riskFromProb } from "./riskColors";
import { clamp, rng } from "./seededRandom";

/* ---------------- Types ---------------- */

/** Forecast horizon: weeks 1-2, 1-3 or 1-4. */
export type Horizon = 2 | 3 | 4;
export const HORIZONS: Horizon[] = [2, 3, 4];

export const ALL_DISTRICTS = "all";

export interface PlannerFilters {
  district: string; // district name or ALL_DISTRICTS
  crop: CropId;
  horizon: Horizon;
}

export type MainRisk = "dry" | "heavy" | "none";
export type ActionKey = "delay_irrigate" | "delay_seed" | "drain" | "sow_window" | "monitor";

export interface BlockAssessment {
  block: Block;
  /** Hectares under the chosen crop (illustrative share of Kharif area). */
  cropAreaHa: number;
  /** Highest dry-spell chance within the horizon, and the first week it crosses the threshold. */
  maxBreak: number;
  breakWeek?: Week;
  /** Highest heavy-rain chance within the horizon, and the first week it crosses the threshold. */
  maxHeavy: number;
  heavyWeek?: Week;
  /** Dry-spell chance above the threshold in two consecutive weeks. */
  consecutiveDry: boolean;
  /** Mean forecast confidence over the horizon (0-100). */
  avgConfidence: number;
  /** A week inside the horizon where the advisory engine says "sow". */
  safeWindow: boolean;
  bestWeek?: Week;
  mainRisk: MainRisk;
  mainProb: number;
  level: RiskLevel;
  /** Rank score = risk × confidence × crop area ("risk-weighted hectares"). */
  rankScore: number;
  needsSeed: boolean;
  needsIrrigation: boolean;
  needsDrainage: boolean;
  needsInsurance: boolean;
  action: ActionKey;
}

/* ---------------- Per-block assessment ---------------- */

export function filterBlocks(district: string, blocks: Block[] = BLOCKS): Block[] {
  return district === ALL_DISTRICTS ? blocks : blocks.filter((b) => b.district === district);
}

/** Share of the block's Kharif area under this crop (illustrative). */
export function cropShare(block: Block, crop: CropId): number {
  const rank = block.majorCrops.indexOf(crop);
  return rank >= 0 ? (CROP_SHARE_BY_RANK[rank] ?? OTHER_CROP_SHARE) : OTHER_CROP_SHARE;
}

export function assessBlock(block: Block, f: BlockForecast, crop: CropId, horizon: Horizon): BlockAssessment {
  const weeks = f.weeks.slice(0, horizon);
  const A = ASSUMPTIONS;

  const maxBreak = Math.max(...weeks.map((w) => w.breakProb));
  const maxHeavy = Math.max(...weeks.map((w) => w.heavyRain));
  const breakWeek = weeks.find((w) => w.breakProb >= A.dryThreshold)?.week;
  const heavyWeek = weeks.find((w) => w.heavyRain >= A.heavyThreshold)?.week;
  const consecutiveDry = weeks.some((w, i) => w.breakProb >= A.dryThreshold && (weeks[i + 1]?.breakProb ?? 0) >= A.dryThreshold);
  const avgConfidence = Math.round(weeks.reduce((s, w) => s + w.confidence, 0) / weeks.length);

  const windows = sowingWindows(crop, f, { block }).filter((w) => w.week <= horizon && w.decision === "sow");
  const best = [...windows].sort((a, b) => b.score - a.score)[0];

  const dry = maxBreak >= A.dryThreshold;
  const heavy = maxHeavy >= A.heavyThreshold;
  // When both risks apply, the one further above its threshold leads.
  const mainRisk: MainRisk = dry && heavy ? (maxBreak - A.dryThreshold >= maxHeavy - A.heavyThreshold ? "dry" : "heavy") : dry ? "dry" : heavy ? "heavy" : "none";
  const mainProb = mainRisk === "heavy" ? maxHeavy : mainRisk === "dry" ? maxBreak : Math.max(maxBreak, maxHeavy);

  const cropAreaHa = Math.round(block.kharifAreaHa * cropShare(block, crop));
  const rankScore = Math.round((mainProb / 100) * (avgConfidence / 100) * cropAreaHa);

  const needsSeed = dry;
  const needsIrrigation = dry && block.irrigatedPct < A.rainfedIrrigatedPct;
  const needsDrainage = heavy;
  const needsInsurance = consecutiveDry || maxHeavy >= A.floodInsuranceThreshold;

  const action: ActionKey = dry ? (needsIrrigation ? "delay_irrigate" : "delay_seed") : heavy ? "drain" : best ? "sow_window" : "monitor";

  return {
    block,
    cropAreaHa,
    maxBreak,
    breakWeek,
    maxHeavy,
    heavyWeek,
    consecutiveDry,
    avgConfidence,
    safeWindow: !!best,
    bestWeek: best?.week,
    mainRisk,
    mainProb,
    level: riskFromProb(mainProb),
    rankScore,
    needsSeed,
    needsIrrigation,
    needsDrainage,
    needsInsurance,
    action,
  };
}

export function assessDistrict(forecasts: Record<string, BlockForecast>, filters: PlannerFilters, blocks: Block[] = BLOCKS): BlockAssessment[] {
  return filterBlocks(filters.district, blocks)
    .filter((b) => forecasts[b.id])
    .map((b) => assessBlock(b, forecasts[b.id], filters.crop, filters.horizon));
}

/* ---------------- Situation ---------------- */

export interface Situation {
  total: number;
  dry: number;
  safe: number;
  heavy: number;
  avgConfidence: number;
}

export function situation(list: BlockAssessment[]): Situation {
  return {
    total: list.length,
    dry: list.filter((a) => a.maxBreak >= ASSUMPTIONS.dryThreshold).length,
    safe: list.filter((a) => a.safeWindow).length,
    heavy: list.filter((a) => a.maxHeavy >= ASSUMPTIONS.heavyThreshold).length,
    avgConfidence: list.length ? Math.round(list.reduce((s, a) => s + a.avgConfidence, 0) / list.length) : 0,
  };
}

/* ---------------- What we will need ---------------- */

export interface Needs {
  seedQuintals: number;
  /** Inputs shown in the "How is this estimated?" formula. */
  seed: { blocks: number; areaHa: number; resowShare: number; seedRateKgHa: number };
  irrigationBlocks: number;
  drainageBlocks: number;
  insuranceBlocks: number;
}

export function needs(list: BlockAssessment[], crop: CropId): Needs {
  const seedBlocks = list.filter((a) => a.needsSeed);
  const areaHa = seedBlocks.reduce((s, a) => s + a.cropAreaHa, 0);
  const seedRateKgHa = SEED_RATE_KG_HA[crop];
  return {
    seedQuintals: Math.round((areaHa * ASSUMPTIONS.resowShare * seedRateKgHa) / 100),
    seed: { blocks: seedBlocks.length, areaHa, resowShare: ASSUMPTIONS.resowShare, seedRateKgHa },
    irrigationBlocks: list.filter((a) => a.needsIrrigation).length,
    drainageBlocks: list.filter((a) => a.needsDrainage).length,
    insuranceBlocks: list.filter((a) => a.needsInsurance).length,
  };
}

/* ---------------- Checklist & readiness ---------------- */

export type Priority = "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "done";
export type TaskKind = "campaign" | "stock_seed" | "irrigation" | "insurance" | "meetings" | "drainage" | "promote_sowing" | "review";

export interface PlanTask {
  id: TaskKind;
  priority: Priority;
  /** ISO date the task should be done by. */
  deadline: string;
  /** Forecast week the deadline is tied to (null = issue date based). */
  week: Week | null;
  /** Number of blocks the task concerns (for the description). */
  blocks: number;
}

export const PRIORITY_WEIGHT: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
const STATUS_VALUE: Record<TaskStatus, number> = { pending: 0, in_progress: 0.5, done: 1 };
const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Deadline for a task tied to a forecast week: `leadDays` before that week
 * starts, but never earlier than the day after the forecast was issued.
 */
export function deadlineFor(f: BlockForecast, week: Week | null, fallbackDays = 1): string {
  const earliest = addDays(f.issuedOn, 1);
  if (!week) return addDays(f.issuedOn, fallbackDays);
  const d = addDays(f.weeks[week - 1].startDate, -ASSUMPTIONS.leadDays);
  return d < earliest ? earliest : d;
}

const minWeek = (weeks: (Week | undefined)[]): Week | null => {
  const w = weeks.filter((x): x is Week => !!x);
  return w.length ? (Math.min(...w) as Week) : null;
};

/** Build the checklist from the situation. Any forecast supplies the calendar. */
export function buildChecklist(list: BlockAssessment[], calendar: BlockForecast | undefined): PlanTask[] {
  if (!calendar) return [];
  const dry = list.filter((a) => a.needsSeed);
  const irr = list.filter((a) => a.needsIrrigation);
  const ins = list.filter((a) => a.needsInsurance);
  const heavy = list.filter((a) => a.needsDrainage);
  const safe = list.filter((a) => a.safeWindow);
  const dryWeek = minWeek(dry.map((a) => a.breakWeek));
  const heavyWeek = minWeek(heavy.map((a) => a.heavyWeek));

  const tasks: PlanTask[] = [{ id: "campaign", priority: "high", deadline: deadlineFor(calendar, null, 1), week: null, blocks: list.length }];
  if (dry.length) {
    tasks.push({ id: "stock_seed", priority: "high", deadline: deadlineFor(calendar, dryWeek), week: dryWeek, blocks: dry.length });
    tasks.push({ id: "meetings", priority: "medium", deadline: deadlineFor(calendar, dryWeek), week: dryWeek, blocks: dry.length });
  }
  if (irr.length) tasks.push({ id: "irrigation", priority: "high", deadline: deadlineFor(calendar, minWeek(irr.map((a) => a.breakWeek))), week: minWeek(irr.map((a) => a.breakWeek)), blocks: irr.length });
  if (ins.length) {
    const w = minWeek(ins.map((a) => a.breakWeek ?? a.heavyWeek));
    tasks.push({ id: "insurance", priority: "medium", deadline: deadlineFor(calendar, w), week: w, blocks: ins.length });
  }
  if (heavy.length) {
    const severe = heavy.some((a) => a.maxHeavy >= ASSUMPTIONS.floodInsuranceThreshold);
    tasks.push({ id: "drainage", priority: severe ? "high" : "medium", deadline: deadlineFor(calendar, heavyWeek), week: heavyWeek, blocks: heavy.length });
  }
  if (safe.length) {
    const w = minWeek(safe.map((a) => a.bestWeek));
    tasks.push({ id: "promote_sowing", priority: "medium", deadline: deadlineFor(calendar, w), week: w, blocks: safe.length });
  }
  tasks.push({ id: "review", priority: "low", deadline: deadlineFor(calendar, null, 7), week: null, blocks: list.length });

  return tasks.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.deadline.localeCompare(b.deadline));
}

export type ReadinessLevel = "not_ready" | "partial" | "ready";

/**
 * Readiness (0-100) = weighted share of work done.
 *   weight: high 3, medium 2, low 1 · progress: pending 0, in progress 0.5, done 1
 *   score = 100 × Σ(weight × progress) / Σ(weight)
 */
export function readiness(tasks: PlanTask[], status: (id: TaskKind) => TaskStatus): { score: number; level: ReadinessLevel } {
  const total = tasks.reduce((s, t) => s + PRIORITY_WEIGHT[t.priority], 0);
  const done = tasks.reduce((s, t) => s + PRIORITY_WEIGHT[t.priority] * STATUS_VALUE[status(t.id)], 0);
  const score = total ? Math.round((100 * done) / total) : 100;
  return { score, level: score >= 80 ? "ready" : score >= 40 ? "partial" : "not_ready" };
}

/** Most important unfinished task: highest priority, then earliest deadline, in-progress first. */
export function nextBestAction(tasks: PlanTask[], status: (id: TaskKind) => TaskStatus): PlanTask | undefined {
  return tasks
    .filter((t) => status(t.id) !== "done")
    .sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        a.deadline.localeCompare(b.deadline) ||
        (status(b.id) === "in_progress" ? 1 : 0) - (status(a.id) === "in_progress" ? 1 : 0),
    )[0];
}

/** Storage key for checklist progress, one per filter combination. */
export const planKey = (f: PlannerFilters) => `${f.district}|${f.crop}|${f.horizon}`;

/* ---------------- Priority ranking ---------------- */

export interface RankedBlock extends BlockAssessment {
  rank: number;
  /** Rank score scaled to 0-100 against the top block. */
  relScore: number;
}

/** Blocks with a dry-spell or heavy-rain risk, ranked by risk × confidence × crop area. */
export function rankBlocks(list: BlockAssessment[]): RankedBlock[] {
  const risky = list.filter((a) => a.mainRisk !== "none").sort((a, b) => b.rankScore - a.rankScore);
  const top = risky[0]?.rankScore || 1;
  return risky.map((a, i) => ({ ...a, rank: i + 1, relScore: Math.round((100 * a.rankScore) / top) }));
}

/* ---------------- Report card (simulated verification) ---------------- */

export interface VerificationWeek {
  weekStart: string;
  forecasts: number;
  hits: number;
  hitRate: number;
}

/**
 * SIMULATED "predicted vs actual" for the 4 weeks before the forecast issue
 * date (1-week lead). Replace with real verification: GET /verification.
 */
export function verification(filters: PlannerFilters, issuedOn: string, blockCount: number): VerificationWeek[] {
  const r = rng(`verify:${filters.district}:${filters.crop}`);
  return [4, 3, 2, 1].map((back) => {
    const forecasts = Math.max(3, blockCount * 3); // onset, dry spell, heavy rain per block
    const hitRate = Math.round(clamp(LEAD_TIME_HIT_RATE[0] + (r() - 0.5) * 16, 60, 94));
    return { weekStart: addDays(issuedOn, -7 * back), forecasts, hits: Math.round((forecasts * hitRate) / 100), hitRate };
  });
}

export const leadTimeAccuracy = () => LEAD_TIME_HIT_RATE.map((hitRate, i) => ({ lead: (i + 1) as Week, hitRate }));

/* ---------------- Impact (simulated) ---------------- */

export interface Impact {
  farmersReached: number;
  decisionsChanged: number;
  hectaresProtected: number;
  lossAvoidedInr: number;
}

export function impact(list: BlockAssessment[]): Impact {
  const A = ASSUMPTIONS;
  const farmers = list.reduce((s, a) => s + a.block.farmers, 0);
  const atRiskFarmers = list.filter((a) => a.mainRisk !== "none").reduce((s, a) => s + a.block.farmers, 0);
  const dryArea = list.filter((a) => a.needsSeed).reduce((s, a) => s + a.cropAreaHa, 0);
  const hectaresProtected = Math.round(dryArea * A.resowShare * A.adoption);
  return {
    farmersReached: Math.round(farmers * A.reachShare),
    decisionsChanged: Math.round(atRiskFarmers * A.reachShare * A.changeShare),
    hectaresProtected,
    lossAvoidedInr: hectaresProtected * A.resowingCostPerHa,
  };
}
