// lib/score/build.ts — assembles the full per-clinician score timeline once, at
// module load (lib/api.ts calls these and caches the result in memory — this is
// static seeded data, there's no reason to recompute it per request).

import type { Clinician, DayMetrics, ScoreDay, ScorePoint } from '../types';
import {
  applyAnchorCorrection, computeRawWB, rawLoadIndexContinuous, tierFromIndex, trajectoryFromSeries,
  type AnchorTargets,
} from './engine';
import { buildDrivers } from './drivers';
import { triggersAsOf } from './triggers';

export interface ClinicianScoreData {
  clinician: Clinician;
  series: DayMetrics[];
  dates: string[];
  scoreDays: Map<string, ScoreDay>;
  scoreSeries: ScorePoint[];
}

/** SPEC §1 anchor tables — the only two protagonists with a published Load Index table. */
export const CHEN_TARGETS: AnchorTargets = {
  '2026-07-01': 24, '2026-07-05': 30, '2026-07-07': 41, '2026-07-09': 52,
  '2026-07-12': 58, '2026-07-14': 66, '2026-07-16': 74, '2026-07-18': 81, '2026-07-25': 44,
};

export const OKAFOR_TARGETS: AnchorTargets = {
  '2026-06-30': 71, '2026-07-09': 39, '2026-07-18': 31,
};

/** Standard path: one raw W/B/LoadIndex/driver pipeline, optional anchor correction. */
export function assembleStandardScore(clinician: Clinician, series: DayMetrics[], targets?: AnchorTargets): ClinicianScoreData {
  const dates = series.map((d) => d.date);
  const rawList = series.map((_, i) => computeRawWB(series, i, clinician));
  const rawContinuous = rawList.map((r) => rawLoadIndexContinuous(r.W, r.B));
  const finalIndex = applyAnchorCorrection(dates, rawContinuous, targets);

  const scoreDays = new Map<string, ScoreDay>();
  dates.forEach((date, i) => {
    const tier = tierFromIndex(finalIndex[i]);
    const trajectory = trajectoryFromSeries(finalIndex, i);
    const triggers = triggersAsOf(clinician.id, date);
    const drivers = buildDrivers({
      clinician, series, index: i, raw: rawList[i],
      personalCatchFired: !!triggers.personalCatch,
    });
    scoreDays.set(date, { date, loadIndex: finalIndex[i], tier, trajectory, drivers, triggers });
  });

  const scoreSeries: ScorePoint[] = dates.map((date, i) => ({ date, loadIndex: finalIndex[i], tier: tierFromIndex(finalIndex[i]) }));
  return { clinician, series, dates, scoreDays, scoreSeries };
}

// Beta-blockade recalibration constant (SPEC §4): a simple, documented multiplier
// on the HR-derived (body) term only — workload inputs are untouched. Patel's
// stored baselines (lib/data/clinicians.ts) are already his MEDICATED baseline,
// so the plain formula against them is the "adjusted" reading; dividing back out
// by this constant is the "naive" reading a med-unaware system would have shown.
const BETA_BLOCKER_RECAL_MULTIPLIER = 2.0;
const PATEL_ADJUSTMENT_REASON =
  'Recalibrated for beta-blockade (metoprolol): heart-rate response is pharmacologically capped, so HR-derived strain is measured against his medicated baseline.';

const PATEL_NAIVE_TARGETS: AnchorTargets = { '2026-07-17': 38, '2026-07-18': 38 };
const PATEL_ADJUSTED_TARGETS: AnchorTargets = { '2026-07-17': 62, '2026-07-18': 62 };

export function assemblePatelScore(clinician: Clinician, series: DayMetrics[]): ClinicianScoreData {
  const dates = series.map((d) => d.date);
  const rawList = series.map((_, i) => computeRawWB(series, i, clinician));
  const naiveContinuous = rawList.map((r) => rawLoadIndexContinuous(r.W, r.B / BETA_BLOCKER_RECAL_MULTIPLIER));
  const adjustedContinuous = rawList.map((r) => rawLoadIndexContinuous(r.W, r.B));
  const naiveFinal = applyAnchorCorrection(dates, naiveContinuous, PATEL_NAIVE_TARGETS);
  const adjustedFinal = applyAnchorCorrection(dates, adjustedContinuous, PATEL_ADJUSTED_TARGETS);

  const scoreDays = new Map<string, ScoreDay>();
  const displayIndex: number[] = [];
  dates.forEach((date, i) => {
    const triggers = triggersAsOf('patel', date);
    const catchFired = !!triggers.personalCatch;
    displayIndex.push(catchFired ? adjustedFinal[i] : naiveFinal[i]);
  });

  dates.forEach((date, i) => {
    const tier = tierFromIndex(displayIndex[i]);
    const trajectory = trajectoryFromSeries(displayIndex, i);
    const triggers = triggersAsOf('patel', date);
    const catchFired = !!triggers.personalCatch;
    const drivers = buildDrivers({
      clinician, series, index: i, raw: rawList[i],
      personalCatchFired: catchFired,
      betaBlockerAdjustment: catchFired ? { naiveIndex: naiveFinal[i], adjustedIndex: adjustedFinal[i] } : undefined,
    });
    const scoreDay: ScoreDay = { date, loadIndex: displayIndex[i], tier, trajectory, drivers, triggers };
    if (catchFired) scoreDay.adjustment = { reason: PATEL_ADJUSTMENT_REASON, naiveIndex: naiveFinal[i] };
    scoreDays.set(date, scoreDay);
  });

  const scoreSeries: ScorePoint[] = dates.map((date, i) => ({ date, loadIndex: displayIndex[i], tier: tierFromIndex(displayIndex[i]) }));
  return { clinician, series, dates, scoreDays, scoreSeries };
}
