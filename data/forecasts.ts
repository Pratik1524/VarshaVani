import type { Block, BlockForecast, ConfidenceLevel, Week, WeekForecast } from "@/types";
import { WEEKS } from "@/types";
import { BLOCKS } from "./blocks";
import { clamp, rng } from "@/lib/seededRandom";

/**
 * Deterministic, spatially coherent mock forecast generator.
 *
 * How it works (so the numbers look physically plausible, not random):
 *  1. Eight "anchor" profiles describe typical week-by-week behaviour for
 *     sub-regions (coastal Konkan, ghats, rain-shadow, Marathwada, Vidarbha...).
 *  2. Each block's value is an inverse-distance-weighted blend of the anchors,
 *     so neighbouring blocks get similar values and zone borders are smooth.
 *  3. A smooth seeded "weather noise" field (sum of Gaussian bumps) adds
 *     realistic spatial texture, plus a tiny per-block jitter.
 *  4. Confidence declines with lead time (weeks 3-4 have low skill).
 *
 * Storyline: south Marathwada (Latur cluster) shows a FALSE ONSET — high
 * onset chance in week 1 followed by a high dry-spell chance in weeks 2-3.
 */

export const SCENARIO_ISSUED_ON = "2026-06-12";

type Profile = {
  onset: [number, number, number, number];
  breakProb: [number, number, number, number];
  heavy: [number, number, number, number];
  recentRain: number;
};

interface Anchor extends Profile {
  name: string;
  lat: number;
  lng: number;
}

const KONKAN: Profile = {
  onset: [88, 86, 80, 82],
  breakProb: [8, 14, 24, 18],
  heavy: [72, 64, 46, 52],
  recentRain: 118,
};

const ANCHORS: Anchor[] = [
  { name: "Konkan north", lat: 19.4, lng: 72.9, ...KONKAN },
  { name: "Konkan south", lat: 16.8, lng: 73.4, ...KONKAN, recentRain: 132 },
  {
    name: "Sahyadri ghats",
    lat: 18.3,
    lng: 73.9,
    onset: [70, 58, 52, 66],
    breakProb: [18, 36, 42, 28],
    heavy: [40, 28, 20, 30],
    recentRain: 62,
  },
  {
    name: "Rain-shadow plateau",
    lat: 17.8,
    lng: 75.1,
    onset: [60, 34, 30, 52],
    breakProb: [28, 58, 64, 40],
    heavy: [12, 8, 6, 14],
    recentRain: 34,
  },
  {
    name: "South Marathwada (false-onset cluster)",
    lat: 18.4,
    lng: 76.5,
    onset: [78, 26, 20, 56],
    breakProb: [18, 76, 82, 44],
    heavy: [14, 6, 5, 18],
    recentRain: 41,
  },
  {
    name: "North Marathwada",
    lat: 19.7,
    lng: 75.8,
    onset: [64, 34, 30, 58],
    breakProb: [26, 60, 66, 40],
    heavy: [14, 8, 8, 18],
    recentRain: 29,
  },
  {
    name: "West Vidarbha",
    lat: 20.5,
    lng: 77.0,
    onset: [44, 52, 42, 62],
    breakProb: [30, 46, 52, 32],
    heavy: [18, 26, 22, 32],
    recentRain: 24,
  },
  {
    name: "East Vidarbha",
    lat: 20.6,
    lng: 78.8,
    onset: [34, 58, 50, 66],
    breakProb: [32, 40, 44, 28],
    heavy: [24, 34, 30, 40],
    recentRain: 17,
  },
];

const BASE_CONFIDENCE = [82, 68, 52, 40];

/** Inverse-distance weighted blend of an anchor field. */
function idw(lat: number, lng: number, pick: (a: Anchor) => number, power = 2.5): number {
  let num = 0;
  let den = 0;
  for (const a of ANCHORS) {
    const d = Math.hypot(lat - a.lat, (lng - a.lng) * Math.cos((lat * Math.PI) / 180));
    const w = 1 / Math.pow(d + 0.05, power);
    num += w * pick(a);
    den += w;
  }
  return num / den;
}

/** Smooth seeded noise field: sum of Gaussian bumps inside Maharashtra's bbox. */
function smoothNoise(key: string, lat: number, lng: number, amp: number, bumps = 5, sigma = 0.9): number {
  const r = rng(`field:${key}`);
  let v = 0;
  for (let i = 0; i < bumps; i++) {
    const cLat = 15.8 + r() * 5.6;
    const cLng = 72.6 + r() * 6.9;
    const a = (r() * 2 - 1) * amp;
    const d2 = (lat - cLat) ** 2 + (lng - cLng) ** 2;
    v += a * Math.exp(-d2 / (2 * sigma * sigma));
  }
  return v;
}

const jitter = (key: string, amp: number) => (rng(`jit:${key}`)() * 2 - 1) * amp;

export function confidenceLevel(c: number): ConfidenceLevel {
  if (c >= 70) return "high";
  if (c >= 50) return "medium";
  return "low";
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function generateBlockForecast(block: Block): BlockForecast {
  const { lat, lng, id } = block;
  const weeks: WeekForecast[] = WEEKS.map((week: Week) => {
    const i = week - 1;
    const onset = clamp(
      idw(lat, lng, (a) => a.onset[i]) + smoothNoise(`onset:${week}`, lat, lng, 7) + jitter(`${id}:o:${week}`, 2.5),
      3,
      97,
    );
    const breakProb = clamp(
      idw(lat, lng, (a) => a.breakProb[i]) + smoothNoise(`break:${week}`, lat, lng, 7) + jitter(`${id}:b:${week}`, 2.5),
      3,
      97,
    );
    const heavyRain = clamp(
      idw(lat, lng, (a) => a.heavy[i]) + smoothNoise(`heavy:${week}`, lat, lng, 6) + jitter(`${id}:h:${week}`, 2),
      2,
      97,
    );
    const confidence = clamp(BASE_CONFIDENCE[i] + smoothNoise(`conf:${week}`, lat, lng, 4) + jitter(`${id}:c:${week}`, 2), 25, 92);
    const expectedRainMm = Math.max(2, heavyRain * 1.1 + onset * 0.6 - breakProb * 0.45 + 10);
    return {
      week,
      startDate: addDays(SCENARIO_ISSUED_ON, i * 7),
      endDate: addDays(SCENARIO_ISSUED_ON, i * 7 + 6),
      onset: Math.round(onset),
      breakProb: Math.round(breakProb),
      heavyRain: Math.round(heavyRain),
      expectedRainMm: Math.round(expectedRainMm),
      confidence: Math.round(confidence),
      confidenceLevel: confidenceLevel(confidence),
    };
  });

  const recentRainMm = Math.round(Math.max(4, idw(lat, lng, (a) => a.recentRain) + jitter(`${id}:rr`, 6)));
  const falseOnsetRisk = weeks[0].onset >= 60 && Math.max(weeks[1].breakProb, weeks[2].breakProb) >= 60;

  return { blockId: id, issuedOn: SCENARIO_ISSUED_ON, recentRainMm, falseOnsetRisk, weeks };
}

/** Pre-computed forecasts for all blocks (deterministic). */
export const FORECASTS: Record<string, BlockForecast> = Object.fromEntries(
  BLOCKS.map((b) => [b.id, generateBlockForecast(b)]),
);
