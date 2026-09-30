import type { ClimateDrivers, MjoPoint } from "@/types";
import { rng } from "@/lib/seededRandom";

/**
 * Mock global climate drivers for the demo scenario (12 Jun 2026).
 * Real sources to plug in later: NOAA CPC ONI / Niño-3.4, BoM or JAMSTEC DMI,
 * BoM / NOAA RMM MJO index.
 */

/** Convert an RMM angle (degrees from +RMM1 axis) to Wheeler-Hendon phase 1-8. */
export function phaseFromAngle(angleDeg: number): number {
  const a = (((angleDeg - 180) % 360) + 360) % 360;
  return Math.floor(a / 45) + 1;
}

/** Centre angle (degrees) of an MJO phase in the RMM diagram. */
export function phaseCenterAngle(phase: number): number {
  return (180 + 45 * (phase - 1) + 22.5) % 360;
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildMjoTrajectory(): MjoPoint[] {
  const start = "2026-05-13";
  const r = rng("mjo-trajectory");
  const pts: MjoPoint[] = [];
  const startAngle = phaseCenterAngle(2); // began over the Indian Ocean
  for (let d = 0; d <= 40; d++) {
    const angle = startAngle + d * 6; // ~6 deg/day => ~7.5 days per phase
    // amplitude grows through phases 3-4 then decays in the forecast window
    const amp =
      d <= 30
        ? 1.1 + 0.7 * Math.sin((Math.PI * d) / 34) + (r() - 0.5) * 0.08
        : 1.4 - (d - 30) * 0.04 + (r() - 0.5) * 0.05;
    const rad = (angle * Math.PI) / 180;
    pts.push({
      date: addDays(start, d),
      rmm1: +(amp * Math.cos(rad)).toFixed(2),
      rmm2: +(amp * Math.sin(rad)).toFixed(2),
      phase: phaseFromAngle(angle),
      amplitude: +amp.toFixed(2),
      forecast: d > 30,
    });
  }
  return pts;
}

const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const ONI = [-0.4, -0.5, -0.5, -0.6, -0.5, -0.4, -0.2, 0.0, 0.2, 0.4, 0.6, 0.7];
const DMI = [-0.1, -0.2, -0.3, -0.2, 0.0, 0.1, 0.0, -0.1, 0.0, 0.1, 0.2, 0.25];

const trajectory = buildMjoTrajectory();
const today = trajectory[30];

export const DRIVERS: ClimateDrivers = {
  asOf: "2026-06-12",
  enso: {
    index: 0.7,
    label: "Weak El Niño",
    series: MONTHS.map((m, i) => ({ month: m, value: ONI[i] })),
  },
  iod: {
    index: 0.25,
    label: "Neutral",
    series: MONTHS.map((m, i) => ({ month: m, value: DMI[i] })),
  },
  mjo: {
    phase: today.phase,
    amplitude: today.amplitude,
    trajectory,
  },
};

/**
 * Tendency of each MJO phase for Indian monsoon rainfall.
 * +1 = strongly enhanced (active spell), -1 = strongly suppressed (break).
 * Simplified from published MJO/BSISO composites.
 */
export const MJO_INDIA_EFFECT: Record<number, number> = {
  1: -0.2,
  2: 0.5,
  3: 0.9,
  4: 0.8,
  5: 0.2,
  6: -0.6,
  7: -0.9,
  8: -0.6,
};

export const MJO_PHASE_REGION: Record<number, string> = {
  1: "Western Hemisphere & Africa",
  2: "Indian Ocean",
  3: "Indian Ocean",
  4: "Maritime Continent",
  5: "Maritime Continent",
  6: "Western Pacific",
  7: "Western Pacific",
  8: "Western Hemisphere & Africa",
};
