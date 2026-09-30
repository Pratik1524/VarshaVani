/**
 * Deterministic pseudo-random utilities so the demo is repeatable.
 * Never use Math.random() in the mock data layer.
 */

/** Hash a string into a 32-bit unsigned integer (FNV-1a). */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG. Returns a function producing floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Create a PRNG from a string key, e.g. `rng("latur:w2:break")`. */
export function rng(key: string): () => number {
  return mulberry32(hashString(key));
}

/** Uniform float in [min, max) for a given key. */
export function seededRange(key: string, min: number, max: number): number {
  return min + rng(key)() * (max - min);
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
