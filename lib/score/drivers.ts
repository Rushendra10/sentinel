// lib/score/drivers.ts — turns raw deviations into human-phrased Driver[] (SPEC §7
// landing cards + §insights driver groups). Two separate concerns, both by design:
//   - `severity` is magnitude-driven (how far off baseline, for card color/intensity).
//   - sort order is a curated per-metric priority table, because the demo narrative
//     requires a SPECIFIC top-3 (after-hours, then HRV, then the personal catch) even
//     though raw deviation math alone would rank backlog/acuity above HRV on Chen's
//     Jul 18. Tier-3 drivers never move the score, but they must be able to outrank
//     Tier-1 drivers in the display — that's the whole point of "the catch."

import type { Clinician, DayMetrics, Driver, TierKey } from '../types';
import { pctDelta } from './deviation';
import type { RawLoad } from './engine';
import { daysBetween, addDays } from '../data/dates';

const PRIORITY: Record<string, number> = {
  'after-hours': 100,
  hrv: 95,
  'levo-gap': 90,
  'beta-blocker-recal': 90,
  backlog: 80,
  acuity: 75,
  sleep: 70,
  rhr: 65,
  'pcp-overdue': 60,
  'consecutive-days': 55,
  volume: 40,
};

const MIN_DEV = 0.12; // below this, a metric is "within noise" and stays off the card list

function sevFromRatio(ratio: number, lo: number, hi: number): 1 | 2 | 3 {
  if (ratio > hi) return 3;
  if (ratio > lo) return 2;
  return 1;
}

function pctLabel(pct: number): string {
  const rounded = Math.round(pct * 100);
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}

function last14(values: number[], index: number): number[] {
  return values.slice(Math.max(0, index - 13), index + 1);
}

function driver(id: string, tier: TierKey, label: string, detail: string, value: string, deltaVsBaseline: string, severity: 1 | 2 | 3, spark?: number[]): Driver {
  return { id, tier, label, detail, value, deltaVsBaseline, severity, spark };
}

export interface DriverContext {
  clinician: Clinician;
  series: DayMetrics[];
  index: number;
  raw: RawLoad;
  /** Chen/Patel: only show the bespoke personal-tier catch once its trigger has fired. */
  personalCatchFired: boolean;
  /** Patel only — recalibrated Load Index shown alongside the naive one. */
  betaBlockerAdjustment?: { naiveIndex: number; adjustedIndex: number };
}

export function buildDrivers(ctx: DriverContext): Driver[] {
  const { clinician, series, index, raw } = ctx;
  const day = series[index];
  const b = clinician.baselines;
  const out: Driver[] = [];

  if (raw.afterHoursDev > MIN_DEV) {
    const val = day.workload.afterHoursMin;
    const pct = pctDelta(val, b.afterHoursMin);
    out.push(driver(
      'after-hours', 'workload',
      `After-hours charting: ${val} min`,
      pct > 1
        ? 'Documentation is spilling far past your shift end times.'
        : 'Documentation is creeping past your scheduled hours.',
      `${val} min`,
      `${pctLabel(pct)} vs your baseline`,
      sevFromRatio(raw.afterHoursDev, 0.5, 1.2),
      last14(series.map((d) => d.workload.afterHoursMin), index),
    ));
  }

  if (raw.backlogDev > MIN_DEV) {
    const val = day.workload.noteBacklog;
    const pct = pctDelta(val, b.backlog);
    out.push(driver(
      'backlog', 'workload',
      `Note backlog: ${val} note${val === 1 ? '' : 's'}`,
      'Unsigned notes are piling up behind the shifts.',
      `${val} notes`,
      `${pctLabel(pct)} vs your baseline`,
      sevFromRatio(raw.backlogDev, 0.5, 1.2),
      last14(series.map((d) => d.workload.noteBacklog), index),
    ));
  }

  if (raw.volumeDev > MIN_DEV) {
    const val = day.workload.encounters;
    const pct = pctDelta(val, b.encounters);
    out.push(driver(
      'volume', 'workload',
      `Patient volume: ${val}/day`,
      'Case volume is running above your usual pace.',
      `${val}/day`,
      `${pctLabel(pct)} vs your baseline`,
      sevFromRatio(raw.volumeDev, 0.5, 1.2),
      last14(series.map((d) => d.workload.encounters), index),
    ));
  }

  if (raw.acuityLoad > 0.15) {
    const recentEvents = series.slice(Math.max(0, index - 9), index + 1).flatMap((d) => d.workload.acuityEvents);
    const deaths = recentEvents.filter((e) => e.kind === 'death').length;
    const nearMisses = recentEvents.filter((e) => e.kind === 'near_miss').length;
    const parts: string[] = [];
    if (deaths > 0) parts.push(`${deaths} patient death${deaths === 1 ? '' : 's'}`);
    if (nearMisses > 0) parts.push(`${nearMisses} safety near-miss${nearMisses === 1 ? '' : 'es'}`);
    if (parts.length > 0) {
      out.push(driver(
        'acuity', 'workload',
        `Recent critical events: ${parts.join(', ')}`,
        'High-acuity events like these carry weight well past the day they happen.',
        parts.join(', '),
        'Weighted into your load with a 7-day decay',
        3,
        undefined,
      ));
    }
  }

  if (day.workload.consecutiveDays >= 7) {
    out.push(driver(
      'consecutive-days', 'workload',
      `Consecutive days worked: ${day.workload.consecutiveDays}`,
      'No recovery day in over a week compounds every other signal.',
      `${day.workload.consecutiveDays} days`,
      'No trailing low-load day in the last 7',
      sevFromRatio(day.workload.consecutiveDays / 7, 1.0, 1.7),
      last14(series.map((d) => d.workload.consecutiveDays), index),
    ));
  }

  // Patel's clinical phrasing rule (SPEC §1 Case 2) is stricter than the generic
  // body-tier drivers below: never make a raw HRV-direction claim under
  // beta-blockade. His body-tier finding is entirely represented by the
  // beta-blocker-recalibration driver, not a standalone HRV/sleep card — that's
  // also why admin sees exactly "1 private factor," not three.
  const isPatel = clinician.id === 'patel';

  if (day.body && !isPatel) {
    const hrvFrac = Math.max(0, 1 - day.body.hrvRmssd / b.hrvRmssd);
    if (hrvFrac > 0.20) {
      out.push(driver(
        'hrv', 'body',
        `HRV ${Math.round(hrvFrac * 100)}% below your baseline`,
        'Your recovery signal has been suppressed for days — that’s your body, not your record.',
        `${day.body.hrvRmssd} ms`,
        `${pctLabel(-hrvFrac)} vs your baseline`,
        sevFromRatio(hrvFrac, 0.15, 0.30),
        last14(series.map((d) => d.body?.hrvRmssd ?? b.hrvRmssd), index),
      ));
    }

    const rhrDev = pctDelta(day.body.restingHr, b.restingHr);
    if (rhrDev > MIN_DEV) {
      out.push(driver(
        'rhr', 'body',
        `Resting heart rate up to ${day.body.restingHr} bpm`,
        'Your resting heart rate is running above where it normally sits.',
        `${day.body.restingHr} bpm`,
        `${pctLabel(rhrDev)} vs your baseline`,
        sevFromRatio(rhrDev, 0.15, 0.35),
        last14(series.map((d) => d.body?.restingHr ?? b.restingHr), index),
      ));
    }

    const sleepDev = pctDelta(day.body.sleepH, b.sleepH);
    if (sleepDev < -MIN_DEV) {
      out.push(driver(
        'sleep', 'body',
        `Sleep down to ${day.body.sleepH}h`,
        'You’re getting meaningfully less sleep than your own normal.',
        `${day.body.sleepH} h`,
        `${pctLabel(sleepDev)} vs your baseline`,
        sevFromRatio(-sleepDev, 0.15, 0.35),
        last14(series.map((d) => d.body?.sleepH ?? b.sleepH), index),
      ));
    }
  }

  if (clinician.id === 'chen' && ctx.personalCatchFired && day.personal) {
    const med = day.personal.medications.find((m) => m.name === 'Levothyroxine');
    if (med) {
      const exhausted = addDays(med.lastFill, med.daysSupply);
      const gapDays = Math.max(0, daysBetween(exhausted, day.date));
      if (gapDays > 0) {
        out.push(driver(
          'levo-gap', 'personal',
          `Levothyroxine gap: ${gapDays} days`,
          'Your thyroid prescription lapsed exactly as the workload spike began — the record shows it, even if no one else could.',
          `${gapDays} days`,
          'Adherent for 18 months before this gap',
          3,
        ));
      }
    }
    const months = Math.round(daysBetween(day.personal.lastPcpVisit, day.date) / 30.44);
    if (months >= 24) {
      out.push(driver(
        'pcp-overdue', 'personal',
        `No PCP visit in ${months} months`,
        'The renewal that would have caught this was blocked on an annual visit that kept getting bumped for shift coverage.',
        `${months} months`,
        'Guideline: annual visit',
        2,
      ));
    }
  }

  if (clinician.id === 'patel' && ctx.personalCatchFired && ctx.betaBlockerAdjustment) {
    const { naiveIndex, adjustedIndex } = ctx.betaBlockerAdjustment;
    out.push(driver(
      'beta-blocker-recal', 'personal',
      'Beta-blocker recalibration',
      'Recalibrated for beta-blockade (metoprolol): heart-rate response is pharmacologically capped, so HR-derived strain is measured against his medicated baseline.',
      `${adjustedIndex} adjusted`,
      `+${adjustedIndex - naiveIndex} pts vs naive reading (${naiveIndex})`,
      3,
    ));
  }

  return out.sort((a, b) => (PRIORITY[b.id] ?? 0) - (PRIORITY[a.id] ?? 0));
}
