// lib/score/engine.ts — the Load Index formula, SPEC §4. Deterministic code,
// zero LLM. Every metric is normalized against the clinician's OWN baseline.
//
// The raw W/B formula has a much wider dynamic range across a crisis arc than
// a single global `k` can compress into the §1 anchor table (a "flat" day and
// Chen's Jul 18 crisis day differ by ~24x in W+B, but the target Load Index
// only spans 24 -> 81). Per SPEC §8/§4's explicit allowance ("a small per-day
// bias/nudge map on generated metrics is acceptable and pragmatic — hitting
// the anchors matters more than formula purity"), protagonists get a
// residual-correction curve: exact 0 correction at each anchor date, linearly
// interpolated between anchors, flat outside the anchor range. The underlying
// W/B/driver math stays fully "real" — only the final composite gets nudged,
// and only for the three protagonists who have published anchor tables.

import type { AcuityEvent, Clinician, DayMetrics, RiskTier } from '../types';
import { clamp, devAbove, devBelow } from './deviation';
import { daysBetween } from '../data/dates';
import { interpolateSeries } from '../data/interpolate';

/** Calibrated against the roster's plausible (non-crisis) W+B range — see lib/data/roster.ts. */
export const LOAD_INDEX_K = 0.14;

const ACUITY_WEIGHT: Record<AcuityEvent['kind'], number> = {
  death: 1.0,
  code: 0.6,
  icu_transfer: 0.6,
  near_miss: 0.4,
};
const ACUITY_DECAY_DAYS = 7; // exponential e-folding time
const ACUITY_CAP = 3;

export interface RawLoad {
  W: number;
  B: number;
  afterHoursDev: number;
  backlogDev: number;
  volumeDev: number;
  acuityLoad: number;
  recoveryDeficit: number;
  hrvSuppression: number;
  rhrElevation: number;
  sleepDeficit: number;
}

export function computeAcuityLoad(series: DayMetrics[], index: number): number {
  const today = series[index];
  let load = 0;
  for (let i = 0; i <= index; i++) {
    const day = series[i];
    if (day.workload.acuityEvents.length === 0) continue;
    const dt = daysBetween(day.date, today.date);
    if (dt < 0) continue;
    const decay = Math.exp(-dt / ACUITY_DECAY_DAYS);
    for (const ev of day.workload.acuityEvents) {
      load += ACUITY_WEIGHT[ev.kind] * decay;
    }
  }
  return clamp(load, 0, ACUITY_CAP);
}

/** consecutiveDays/7, +1 if no low-load day (at-or-below baseline, no acuity event) in trailing 7d. */
export function computeRecoveryDeficit(series: DayMetrics[], index: number, clinician: Clinician): number {
  const today = series[index];
  const consecTerm = today.workload.consecutiveDays / 7;
  const start = Math.max(0, index - 6);
  let hasLowDay = false;
  for (let i = start; i <= index; i++) {
    const day = series[i];
    const isLow = day.workload.afterHoursMin <= clinician.baselines.afterHoursMin && day.workload.acuityEvents.length === 0;
    if (isLow) {
      hasLowDay = true;
      break;
    }
  }
  return consecTerm + (hasLowDay ? 0 : 1);
}

export interface BodyBaselineOverride {
  hrvRmssd?: number;
  restingHr?: number;
}

/** Raw W/B for one day. `bodyBaselines` lets Patel's recalibration recompute HR-derived inputs. */
export function computeRawWB(
  series: DayMetrics[],
  index: number,
  clinician: Clinician,
  bodyBaselines?: BodyBaselineOverride,
): RawLoad {
  const day = series[index];
  const b = clinician.baselines;

  const afterHoursDev = devAbove(day.workload.afterHoursMin, b.afterHoursMin);
  const backlogDev = devAbove(day.workload.noteBacklog, b.backlog);
  const volumeDev = devAbove(day.workload.encounters, b.encounters);
  const acuityLoad = computeAcuityLoad(series, index);
  const recoveryDeficit = computeRecoveryDeficit(series, index, clinician);

  const W = 1.5 * afterHoursDev + 1.2 * backlogDev + 1.0 * volumeDev + 2.0 * acuityLoad + 1.0 * recoveryDeficit;

  let hrvSuppression = 0;
  let rhrElevation = 0;
  let sleepDeficit = 0;
  if (day.body) {
    const hrvBaseline = bodyBaselines?.hrvRmssd ?? b.hrvRmssd;
    const rhrBaseline = bodyBaselines?.restingHr ?? b.restingHr;
    hrvSuppression = clamp(Math.max(0, 1 - day.body.hrvRmssd / hrvBaseline) * 3, 0, 3);
    rhrElevation = devAbove(day.body.restingHr, rhrBaseline);
    sleepDeficit = devBelow(day.body.sleepH, b.sleepH);
  }
  const B = 2.0 * hrvSuppression + 1.2 * rhrElevation + 1.2 * sleepDeficit;

  return { W, B, afterHoursDev, backlogDev, volumeDev, acuityLoad, recoveryDeficit, hrvSuppression, rhrElevation, sleepDeficit };
}

export function rawLoadIndexContinuous(W: number, B: number): number {
  return 100 * (1 - Math.exp(-LOAD_INDEX_K * (W + B)));
}

export function tierFromIndex(loadIndex: number): RiskTier {
  if (loadIndex >= 70) return 'critical';
  if (loadIndex >= 55) return 'high';
  if (loadIndex >= 35) return 'elevated';
  return 'stable';
}

export function trajectoryFromSeries(series: number[], index: number): 'rising' | 'flat' | 'falling' {
  if (index < 3) return 'flat';
  const diff = series[index] - series[index - 3];
  if (diff > 2) return 'rising';
  if (diff < -2) return 'falling';
  return 'flat';
}

/** date -> target Load Index, used to build a correction curve. */
export type AnchorTargets = Record<string, number>;

/**
 * Builds the final, anchor-corrected Load Index series for one clinician.
 * `raw[i]` is the uncorrected continuous formula output; `targets` (if any)
 * pin exact values at specific dates, linearly bridged between them.
 */
export function applyAnchorCorrection(dates: string[], raw: number[], targets?: AnchorTargets): number[] {
  if (!targets || Object.keys(targets).length === 0) {
    return raw.map((v) => Math.round(clamp(v, 0, 100)));
  }
  const flatRand = () => 0.5; // interpolateSeries noise is (rand()*2-1)*amp; 0.5 => zero noise
  const checkpoints = Object.entries(targets).map(([date, target]) => {
    const idx = dates.indexOf(date);
    const rawAtAnchor = idx >= 0 ? raw[idx] : target;
    return { date, value: target - rawAtAnchor };
  });
  const correction = interpolateSeries(dates, checkpoints, flatRand, 0);
  return dates.map((_, i) => Math.round(clamp(raw[i] + correction[i], 0, 100)));
}
