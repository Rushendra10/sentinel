// lib/data/prng.ts — deterministic PRNG. NEVER use Math.random() or Date.now() for
// demo data; every run of the app must produce byte-identical numbers.

/** Fixed seed, checked in. Changing this reshuffles every generated series. */
export const SEED = 20260718;

/** mulberry32 — small, fast, good-enough-for-demo-noise PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic string -> 32-bit hash, used to derive independent per-clinician streams. */
function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/** One independent, deterministic RNG stream per (clinician, purpose) pair. */
export function createRng(name: string): () => number {
  return mulberry32((SEED ^ hashSeed(name)) >>> 0);
}

/** Bounded symmetric noise in [-amplitude, +amplitude]. */
export function noiseIn(rand: () => number, amplitude: number): number {
  return (rand() * 2 - 1) * amplitude;
}
