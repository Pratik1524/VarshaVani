/**
 * Shared domain types for VarshaVani.
 * These types describe the contract between the UI and the data/service layer.
 * A real backend should return data in these same shapes.
 */

export type Lang = "en" | "hi" | "mr";

export type Zone = "Konkan" | "Western Maharashtra" | "Marathwada" | "Vidarbha";

export type Week = 1 | 2 | 3 | 4;
export const WEEKS: Week[] = [1, 2, 3, 4];

/** Forecast variable shown on maps and charts. */
export type Layer = "onset" | "break" | "heavy";

/** Unified 4-step risk scale used everywhere in the UI. */
export type RiskLevel = "low" | "watch" | "elevated" | "high";

export type ConfidenceLevel = "high" | "medium" | "low";

export type CropId = "soybean" | "cotton" | "tur" | "rice" | "bajra" | "maize";

export type GrowthStage =
  | "not_sown"
  | "sowing"
  | "germination"
  | "vegetative"
  | "flowering"
  | "grain_filling";

/** Simplified GeoJSON polygon ring: [lng, lat][] (approximate, not official boundary). */
export type Ring = [number, number][];

export interface Block {
  id: string;
  name: string;
  district: string;
  zone: Zone;
  lat: number;
  lng: number;
  /** Approximate hexagonal cell around the block centroid. */
  geometry: Ring;
  villages: string[];
  /** Share of cropped area with assured irrigation (0-100). */
  irrigatedPct: number;
  /** Registered farmers (illustrative). */
  farmers: number;
  /** Kharif cropped area in hectares (illustrative). */
  kharifAreaHa: number;
  majorCrops: CropId[];
}

export interface WeekForecast {
  week: Week;
  startDate: string; // ISO date
  endDate: string; // ISO date
  /** Probability (0-100) of onset-quality rain during the week. */
  onset: number;
  /** Probability (0-100) of a dry spell (>= 7 dry days) during the week. */
  breakProb: number;
  /** Probability (0-100) of a heavy-rain day (>= 64.5 mm) during the week. */
  heavyRain: number;
  /** Most likely weekly rainfall total in mm. */
  expectedRainMm: number;
  /** Forecast confidence 0-100. Declines with lead time. */
  confidence: number;
  confidenceLevel: ConfidenceLevel;
}

export interface BlockForecast {
  blockId: string;
  issuedOn: string;
  /** Rainfall observed in the last 7 days (mm). */
  recentRainMm: number;
  /** True when early rain is likely to be followed by a dry spell. */
  falseOnsetRisk: boolean;
  weeks: WeekForecast[];
}

export interface EnsoState {
  /** Niño-3.4 / ONI style index (degC anomaly). */
  index: number;
  label: "La Niña" | "Neutral" | "Weak El Niño" | "Moderate El Niño" | "Strong El Niño";
  series: { month: string; value: number }[];
}

export interface IodState {
  /** Dipole Mode Index (degC). */
  index: number;
  label: "Negative" | "Neutral" | "Positive";
  series: { month: string; value: number }[];
}

export interface MjoPoint {
  date: string;
  rmm1: number;
  rmm2: number;
  phase: number;
  amplitude: number;
  forecast?: boolean;
}

export interface MjoState {
  phase: number; // 1-8
  amplitude: number;
  trajectory: MjoPoint[];
}

export interface ClimateDrivers {
  asOf: string;
  enso: EnsoState;
  iod: IodState;
  mjo: MjoState;
}

export interface Crop {
  id: CropId;
  durationDays: [number, number];
  /** 0 (very sensitive) .. 1 (very tolerant) to dry spells. */
  droughtTolerance: number;
  /** Break probability above which sowing should be delayed. */
  breakThreshold: number;
  /** Cumulative rain (mm) recommended before sowing. */
  sowingRainMm: number;
  emoji: string;
  alternatives: string[]; // i18n keys
}

export interface FarmerCrop {
  id: string;
  crop: CropId;
  stage: GrowthStage;
  sowingDate?: string;
  areaAcres: number;
}

export interface FarmerProfile {
  id: string;
  name: string;
  village: string;
  blockId: string;
  phone: string;
  lang: Lang;
  crops: FarmerCrop[];
}

export type Channel = "sms" | "whatsapp";
export type DeliveryStatus = "queued" | "sent" | "delivered" | "read" | "failed";

export interface MessageLog {
  id: string;
  timestamp: string;
  channel: Channel;
  lang: Lang;
  blockIds: string[];
  crop: CropId;
  recipients: number;
  status: DeliveryStatus;
  preview: string;
  advisoryType: AdvisoryType;
}

export interface FeedbackEntry {
  id: string;
  timestamp: string;
  blockId: string;
  crop: CropId;
  advisoryType: AdvisoryType;
  useful: boolean;
  comment?: string;
  lang: Lang;
}

export type AlertKind = "digest" | "heavy" | "break" | "onset";

export interface AlertItem {
  id: string;
  kind: AlertKind;
  timestamp: string;
  titleKey: string;
  bodyKey: string;
  params: Record<string, string | number>;
  severity: RiskLevel;
}

/* ---------------- Advisory engine ---------------- */

/** Translatable message: dictionary key plus interpolation params. */
export interface Msg {
  key: string;
  params?: Record<string, string | number>;
}

export type SowDecision = "sow" | "caution" | "wait";

export type AdvisoryType =
  | "delay_sowing"
  | "safe_to_sow"
  | "sow_caution"
  | "conserve_moisture"
  | "protective_irrigation"
  | "heavy_rain"
  | "heavy_watch"
  | "routine";

export interface Advisory {
  id: string;
  type: AdvisoryType;
  ruleId: string;
  crop: CropId;
  stage: GrowthStage;
  week: Week;
  blockId: string;
  action: Msg;
  severity: RiskLevel;
  /** Only for not-sown / sowing stages. */
  decision?: SowDecision;
  reasons: Msg[];
  /** Plain-language climate driver explanations ("Why this advice?"). */
  drivers: Msg[];
  alternatives: Msg[];
  irrigationTip: Msg;
  /** Extra actions from lower-priority rules that also matched. */
  alsoDo: Msg[];
  confidence: number;
}

export interface HistoryDay {
  date: string;
  rainMm: number;
}

export interface HistoryEvent {
  date: string;
  kind: "early_rain" | "sowing" | "dry_spell" | "warning" | "revival" | "resowing";
  label: string;
}

export interface HistoryReplay {
  year: number;
  blockId: string;
  title: string;
  summary: string;
  daily: HistoryDay[];
  /** Weekly break probability the system would have issued (hindcast). */
  predictedBreak: { weekStart: string; prob: number; issuedOn: string }[];
  events: HistoryEvent[];
  warningLeadDays: number;
  dryDays: number;
  sownAreaPct: number;
  resowingCostPerHa: number;
  lossAvoidedCrore: number;
}
