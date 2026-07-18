// lib/score/deviation.ts — small numeric helpers shared by the score engine.
// Every metric is normalized against the clinician's OWN baseline, never a
// population baseline, and every deviation is clamped to [0, 3] per SPEC §4.

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** (value - baseline) / baseline, clamped [0, 3]. Only elevation above baseline counts. */
export function devAbove(value: number, baseline: number): number {
  if (baseline <= 0) return 0;
  return clamp((value - baseline) / baseline, 0, 3);
}

/** (baseline - value) / baseline, clamped [0, 3]. Only deficit below baseline counts. */
export function devBelow(value: number, baseline: number): number {
  if (baseline <= 0) return 0;
  return clamp((baseline - value) / baseline, 0, 3);
}

/** Signed (value - baseline) / baseline, unclamped — used for display percentages. */
export function pctDelta(value: number, baseline: number): number {
  if (baseline <= 0) return 0;
  return (value - baseline) / baseline;
}
