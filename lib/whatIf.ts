/**
 * What-If simulator: a TRANSPARENT, ILLUSTRATIVE linear sensitivity model.
 * It is not the forecast model. It answers "how would local risk shift if the
 * global drivers were different?" so users can build intuition.
 *
 * For block b, week w and variable v (onset, break, heavy):
 *
 *   v' = clamp( v_baseline + S_zone * [ f_v(new drivers, w) - f_v(current drivers, w) ] )
 *
 * where the driver response f_v is a sum of three terms:
 *
 *   ENSO  :  enso * cEnso_v                     (El Niño => fewer onsets, more breaks)
 *   IOD   :  iod  * cIod_v                      (positive IOD => more rain)
 *   MJO   :  E(phase_w) * A * L_w * cMjo_v      (active/suppressed tendency)
 *
 *   phase_w = MJO phase advanced ~1 phase per week (typical 30-60 day cycle)
 *   E(p)    = India rainfall tendency of phase p in [-1, 1] (MJO_INDIA_EFFECT)
 *   A       = min(amplitude, 2.5) / 1.5          (a weak MJO has little effect)
 *   L_w     = lead-time decay [1, 0.8, 0.55, 0.35]
 *   S_zone  = zonal sensitivity (Marathwada most sensitive to intraseasonal swings)
 *
 * Because the baseline forecast already contains the current drivers, the
 * simulator only adds the DIFFERENCE, so at today's values the output equals
 * the baseline forecast exactly.
 */
import type { Block, BlockForecast, ClimateDrivers, Zone } from "@/types";
import { MJO_INDIA_EFFECT } from "@/data/drivers";
import { clamp } from "./seededRandom";

export interface DriverInputs {
  enso: number; // -2.5 .. 2.5
  iod: number; // -1.5 .. 1.5
  mjoPhase: number; // 1 .. 8
  mjoAmp: number; // 0 .. 3
}

export const COEFFS = {
  enso: { onset: -8, breakProb: 10, heavyRain: -4 },
  iod: { onset: 6, breakProb: -7, heavyRain: 4 },
  mjo: { onset: 15, breakProb: -18, heavyRain: 10 },
  leadDecay: [1, 0.8, 0.55, 0.35],
  zoneSensitivity: { Konkan: 0.6, "Western Maharashtra": 0.9, Marathwada: 1.2, Vidarbha: 1.0 } as Record<Zone, number>,
};

export function inputsFromDrivers(d: ClimateDrivers): DriverInputs {
  return { enso: d.enso.index, iod: d.iod.index, mjoPhase: d.mjo.phase, mjoAmp: d.mjo.amplitude };
}

/** MJO phase expected in a given forecast week (advances ~1 phase/week). */
export function phaseAtWeek(phase: number, week: number): number {
  return ((phase - 1 + (week - 1)) % 8) + 1;
}

type Var = "onset" | "breakProb" | "heavyRain";

function response(v: Var, x: DriverInputs, week: number): number {
  const lead = COEFFS.leadDecay[week - 1] ?? 0.3;
  const amp = Math.min(x.mjoAmp, 2.5) / 1.5;
  const e = MJO_INDIA_EFFECT[phaseAtWeek(x.mjoPhase, week)] ?? 0;
  return x.enso * COEFFS.enso[v] + x.iod * COEFFS.iod[v] + e * amp * lead * COEFFS.mjo[v];
}

/** Return a new forecast with probabilities shifted by the driver change. */
export function applyWhatIf(
  base: BlockForecast,
  block: Block,
  inputs: DriverInputs,
  current: DriverInputs,
): BlockForecast {
  const s = COEFFS.zoneSensitivity[block.zone];
  const weeks = base.weeks.map((w) => {
    const delta = (v: Var) => s * (response(v, inputs, w.week) - response(v, current, w.week));
    const onset = Math.round(clamp(w.onset + delta("onset"), 2, 98));
    const breakProb = Math.round(clamp(w.breakProb + delta("breakProb"), 2, 98));
    const heavyRain = Math.round(clamp(w.heavyRain + delta("heavyRain"), 2, 98));
    // Same rain-total relation used by the mock generator, applied to the change only.
    const rainDelta = (heavyRain - w.heavyRain) * 1.1 + (onset - w.onset) * 0.6 - (breakProb - w.breakProb) * 0.45;
    const expectedRainMm = Math.round(Math.max(2, w.expectedRainMm + rainDelta));
    return { ...w, onset, breakProb, heavyRain, expectedRainMm };
  });
  const falseOnsetRisk = weeks[0].onset >= 60 && Math.max(weeks[1].breakProb, weeks[2].breakProb) >= 60;
  return { ...base, weeks, falseOnsetRisk };
}

/** Driver set with simulated values, used so "Why this advice?" reflects the sliders. */
export function driversWithInputs(d: ClimateDrivers, x: DriverInputs): ClimateDrivers {
  const ensoLabel =
    x.enso >= 1.5 ? "Strong El Niño" : x.enso >= 1 ? "Moderate El Niño" : x.enso >= 0.5 ? "Weak El Niño" : x.enso <= -0.5 ? "La Niña" : "Neutral";
  const iodLabel = x.iod >= 0.4 ? "Positive" : x.iod <= -0.4 ? "Negative" : "Neutral";
  return {
    ...d,
    enso: { ...d.enso, index: x.enso, label: ensoLabel },
    iod: { ...d.iod, index: x.iod, label: iodLabel },
    mjo: { ...d.mjo, phase: x.mjoPhase, amplitude: x.mjoAmp },
  };
}
