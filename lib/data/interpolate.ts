// lib/data/interpolate.ts — piecewise-linear interpolation between named checkpoint
// dates, exact at the checkpoints, with small bounded per-day noise between them.
// This is how the three protagonist arcs hit their SPEC §1 anchor values exactly
// while still reading as a real, textured daily series.

import { daysBetween, toEpochDay } from './dates';

export interface Checkpoint {
  date: string;
  value: number;
}

/**
 * Returns one number per date in `dates` (which must be sorted ascending).
 * Exact at checkpoint dates. Linear between them. Small symmetric noise added
 * on non-checkpoint days only, so anchors are never perturbed.
 */
export function interpolateSeries(
  dates: string[],
  checkpoints: Checkpoint[],
  rand: () => number,
  noiseAmplitude: number,
): number[] {
  const sorted = [...checkpoints].sort((a, b) => toEpochDay(a.date) - toEpochDay(b.date));
  if (sorted.length === 0) throw new Error('interpolateSeries requires at least one checkpoint');

  return dates.map((date) => {
    const isAnchor = sorted.some((c) => c.date === date);

    // Find the bracketing checkpoints for this date.
    let before = sorted[0];
    let after = sorted[sorted.length - 1];
    for (const cp of sorted) {
      if (daysBetween(cp.date, date) >= 0) before = cp;
    }
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (daysBetween(date, sorted[i].date) >= 0) after = sorted[i];
    }

    let value: number;
    if (before.date === after.date) {
      value = before.value;
    } else {
      const span = daysBetween(before.date, after.date);
      const pos = daysBetween(before.date, date);
      const t = span === 0 ? 0 : pos / span;
      value = before.value + (after.value - before.value) * t;
    }

    if (isAnchor) return value;
    return value + noiseIn(rand, noiseAmplitude);
  });
}

function noiseIn(rand: () => number, amplitude: number): number {
  return (rand() * 2 - 1) * amplitude;
}
