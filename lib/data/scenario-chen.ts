// lib/data/scenario-chen.ts — Dr. Maya Chen, Case 1 (SPEC §1). The live demo spine:
// lapsed personal prescription caught the day the intervention fires (Jul 18).
// Every value below passes through her SPEC §1 anchor table exactly on anchor
// dates; everything else is interpolated with small bounded noise.

import type { DayMetrics } from '../types';
import { dateRange } from './dates';
import { createRng, noiseIn } from './prng';
import { interpolateSeries, type Checkpoint } from './interpolate';

export const CHEN_START = '2026-06-28';
export const CHEN_END = '2026-07-25'; // extends past "today" for the verification beat

const rand = createRng('chen-metrics');

const AFTER_HOURS: Checkpoint[] = [
  { date: '2026-06-28', value: 36 },
  { date: '2026-07-01', value: 45 },
  { date: '2026-07-05', value: 60 },
  { date: '2026-07-07', value: 85 },
  { date: '2026-07-09', value: 95 },
  { date: '2026-07-12', value: 110 },
  { date: '2026-07-14', value: 125 },
  { date: '2026-07-16', value: 135 },
  { date: '2026-07-18', value: 140 },
  { date: '2026-07-19', value: 132 },
  { date: '2026-07-20', value: 88 }, // protected recovery block
  { date: '2026-07-21', value: 118 },
  { date: '2026-07-22', value: 108 },
  { date: '2026-07-23', value: 95 },
  { date: '2026-07-24', value: 70 }, // second recovery day
  { date: '2026-07-25', value: 55 },
];

const BACKLOG: Checkpoint[] = [
  { date: '2026-06-28', value: 1 },
  { date: '2026-07-01', value: 2 },
  { date: '2026-07-05', value: 4 },
  { date: '2026-07-07', value: 6 },
  { date: '2026-07-09', value: 7 },
  { date: '2026-07-12', value: 8 },
  { date: '2026-07-14', value: 9 },
  { date: '2026-07-16', value: 10 },
  { date: '2026-07-18', value: 11 },
  { date: '2026-07-19', value: 10 },
  { date: '2026-07-20', value: 7 },
  { date: '2026-07-21', value: 9 },
  { date: '2026-07-22', value: 8 },
  { date: '2026-07-23', value: 6 },
  { date: '2026-07-24', value: 4 },
  { date: '2026-07-25', value: 3 },
];

const HRV: Checkpoint[] = [
  { date: '2026-06-28', value: 46 },
  { date: '2026-07-01', value: 44 },
  { date: '2026-07-05', value: 42 },
  { date: '2026-07-07', value: 38 },
  { date: '2026-07-09', value: 33 },
  { date: '2026-07-12', value: 31 },
  { date: '2026-07-14', value: 29 },
  { date: '2026-07-16', value: 28 },
  { date: '2026-07-18', value: 27 },
  { date: '2026-07-19', value: 27 },
  { date: '2026-07-20', value: 29 },
  { date: '2026-07-21', value: 29 },
  { date: '2026-07-22', value: 30 },
  { date: '2026-07-23', value: 31 },
  { date: '2026-07-24', value: 33 },
  { date: '2026-07-25', value: 36 },
];

const RHR: Checkpoint[] = [
  { date: '2026-06-28', value: 61 },
  { date: '2026-07-01', value: 62 },
  { date: '2026-07-05', value: 63 },
  { date: '2026-07-07', value: 64 },
  { date: '2026-07-09', value: 66 },
  { date: '2026-07-12', value: 68 },
  { date: '2026-07-14', value: 69 },
  { date: '2026-07-16', value: 70 },
  { date: '2026-07-18', value: 71 },
  { date: '2026-07-19', value: 71 },
  { date: '2026-07-20', value: 69 },
  { date: '2026-07-21', value: 70 },
  { date: '2026-07-22', value: 69 },
  { date: '2026-07-23', value: 68 },
  { date: '2026-07-24', value: 67 },
  { date: '2026-07-25', value: 66 },
];

const SLEEP: Checkpoint[] = [
  { date: '2026-06-28', value: 7.6 },
  { date: '2026-07-01', value: 7.4 },
  { date: '2026-07-05', value: 7.0 },
  { date: '2026-07-07', value: 6.4 },
  { date: '2026-07-09', value: 6.1 },
  { date: '2026-07-12', value: 5.8 },
  { date: '2026-07-14', value: 5.4 },
  { date: '2026-07-16', value: 5.2 },
  { date: '2026-07-18', value: 5.1 },
  { date: '2026-07-19', value: 5.2 },
  { date: '2026-07-20', value: 6.4 },
  { date: '2026-07-21', value: 5.6 },
  { date: '2026-07-22', value: 5.8 },
  { date: '2026-07-23', value: 6.0 },
  { date: '2026-07-24', value: 6.7 },
  { date: '2026-07-25', value: 6.9 },
];

// Streak of consecutive worked days — rule-based, not interpolated. Reset to 1 on
// Jul 5 ("coverage starts"), climbs straight through the anchors to 14 on Jul 18.
const CONSECUTIVE_DAYS: Record<string, number> = {
  '2026-06-28': 3, '2026-06-29': 4, '2026-06-30': 1,
  '2026-07-01': 2, '2026-07-02': 3, '2026-07-03': 4, '2026-07-04': 1,
  '2026-07-05': 1, '2026-07-06': 2, '2026-07-07': 3, '2026-07-08': 4,
  '2026-07-09': 5, '2026-07-10': 6, '2026-07-11': 7, '2026-07-12': 8,
  '2026-07-13': 9, '2026-07-14': 10, '2026-07-15': 11, '2026-07-16': 12,
  '2026-07-17': 13, '2026-07-18': 14, '2026-07-19': 15, '2026-07-20': 0,
  '2026-07-21': 1, '2026-07-22': 2, '2026-07-23': 3, '2026-07-24': 0, '2026-07-25': 1,
};

const RECOVERY_DAYS = new Set(['2026-07-20', '2026-07-24']);

const ACUITY_EVENTS: Record<string, { kind: 'death' | 'near_miss'; note: string }[]> = {
  '2026-07-08': [{ kind: 'death', note: 'Patient in bay 4 arrested from septic shock; resuscitation unsuccessful.' }],
  '2026-07-09': [{ kind: 'death', note: 'Second cardiac arrest overnight; prolonged resuscitation attempted, patient did not survive.' }],
  '2026-07-14': [{ kind: 'near_miss', note: 'Pharmacist caught a dosing-order error before it reached the patient — no harm done.' }],
};

export function buildChenSeries(): DayMetrics[] {
  const dates = dateRange(CHEN_START, CHEN_END);
  const afterHours = interpolateSeries(dates, AFTER_HOURS, rand, 1.5);
  const backlog = interpolateSeries(dates, BACKLOG, rand, 0.25);
  const hrv = interpolateSeries(dates, HRV, rand, 0.4);
  const rhr = interpolateSeries(dates, RHR, rand, 0.4);
  const sleep = interpolateSeries(dates, SLEEP, rand, 0.08);
  const encounters = interpolateSeries(dates, [{ date: dates[0], value: 19 }, { date: dates[dates.length - 1], value: 20 }], rand, 1.4);

  return dates.map((date, i) => {
    const afterHoursMin = Math.max(0, Math.round(afterHours[i]));
    const noteBacklog = Math.max(0, Math.round(backlog[i]));
    const hrvRmssd = Math.round(hrv[i] * 10) / 10;
    const restingHr = Math.round(rhr[i]);
    const sleepH = Math.round(sleep[i] * 10) / 10;
    const sleepDeficitFrac = Math.max(0, (7.6 - sleepH) / 7.6);
    const loadIntensity = Math.max(0, (afterHoursMin - 36) / (140 - 36));

    const sleepEff = Math.round(clampInt(94 - sleepDeficitFrac * 34 + noiseIn(rand, 2), 55, 97));
    const steps = Math.round(clampInt(7400 - loadIntensity * 3400 + noiseIn(rand, 250), 2400, 8200));

    return {
      date,
      workload: {
        afterHoursMin,
        noteBacklog,
        inboxOpen: Math.round(clampInt(noteBacklog * 1.6 + 3 + noiseIn(rand, 1.2), 1, 40)),
        inboxLatencyH: Math.round((2 + noteBacklog * 0.35 + noiseIn(rand, 0.4)) * 10) / 10,
        encounters: Math.max(0, Math.round(encounters[i])),
        ordersPlaced: Math.round(clampInt(encounters[i] * 1.3 + noiseIn(rand, 1.5), 5, 40)),
        consecutiveDays: CONSECUTIVE_DAYS[date] ?? 0,
        scheduledH: RECOVERY_DAYS.has(date) ? 0 : Math.round((10 + noiseIn(rand, 0.6)) * 10) / 10,
        ptoDay: RECOVERY_DAYS.has(date),
        acuityEvents: ACUITY_EVENTS[date] ?? [],
      },
      body: { hrvRmssd, restingHr, sleepH, sleepEff, steps },
      personal: {
        medications: [
          date < '2026-07-19'
            ? { name: 'Levothyroxine', dose: '88 mcg', lastFill: '2026-05-30', daysSupply: 30, refillsRemaining: 0, drugClass: 'thyroid_hormone' }
            : { name: 'Levothyroxine', dose: '88 mcg', lastFill: '2026-07-19', daysSupply: 30, refillsRemaining: 2, drugClass: 'thyroid_hormone' },
        ],
        conditions: ['Hypothyroidism (diagnosed 2021)'],
        lastPcpVisit: '2024-02-11',
        labs: [{ name: 'TSH', value: '2.1 mIU/L', date: '2024-02-11' }],
      },
    };
  });
}

function clampInt(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
