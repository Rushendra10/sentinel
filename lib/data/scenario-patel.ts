// lib/data/scenario-patel.ts — Dr. Anand Patel, Case 2 (SPEC §1). Medication-masked
// vitals: beta-blockade caps his heart-rate response, so his wearable reads
// "excellent" resting HR all month while his HRV (vs his own medicated baseline)
// and workload quietly deteriorate. No anchor table in SPEC §1 for Patel beyond
// the narrative ramps and the naive-38/adjusted-62 split (handled in lib/score).

import type { DayMetrics } from '../types';
import { dateRange } from './dates';
import { createRng, noiseIn } from './prng';
import { interpolateSeries, type Checkpoint } from './interpolate';

export const PATEL_START = '2026-06-28';
export const PATEL_END = '2026-07-18';

const rand = createRng('patel-metrics');

const AFTER_HOURS: Checkpoint[] = [
  { date: '2026-06-28', value: 35 },
  { date: '2026-07-07', value: 55 },
  { date: '2026-07-14', value: 75 },
  { date: '2026-07-18', value: 85 },
];

const CENSUS: Checkpoint[] = [
  { date: '2026-06-28', value: 14 },
  { date: '2026-07-07', value: 17 },
  { date: '2026-07-14', value: 20 },
  { date: '2026-07-18', value: 22 },
];

const BACKLOG: Checkpoint[] = [
  { date: '2026-06-28', value: 3 },
  { date: '2026-07-07', value: 4 },
  { date: '2026-07-14', value: 6 },
  { date: '2026-07-18', value: 7 },
];

// HRV measured against his own medicated baseline (38ms) — not raw, unmedicated physiology.
const HRV: Checkpoint[] = [
  { date: '2026-06-28', value: 37 },
  { date: '2026-07-07', value: 35 },
  { date: '2026-07-14', value: 31 },
  { date: '2026-07-18', value: 29 },
];

// Beta-blockade caps heart-rate response — this stays flat/"excellent" all month,
// which is exactly why the naive reading looks fine.
const RHR: Checkpoint[] = [
  { date: '2026-06-28', value: 59 },
  { date: '2026-07-18', value: 61 },
];

const SLEEP: Checkpoint[] = [
  { date: '2026-06-28', value: 6.9 },
  { date: '2026-07-07', value: 6.6 },
  { date: '2026-07-14', value: 6.2 },
  { date: '2026-07-18', value: 6.0 },
];

export function buildPatelSeries(): DayMetrics[] {
  const dates = dateRange(PATEL_START, PATEL_END);
  const afterHours = interpolateSeries(dates, AFTER_HOURS, rand, 2.0);
  const census = interpolateSeries(dates, CENSUS, rand, 0.8);
  const backlog = interpolateSeries(dates, BACKLOG, rand, 0.3);
  const hrv = interpolateSeries(dates, HRV, rand, 0.35);
  const rhr = interpolateSeries(dates, RHR, rand, 0.6);
  const sleep = interpolateSeries(dates, SLEEP, rand, 0.1);

  let streak = 0;
  const consecutiveDays = dates.map((_, i) => {
    const dayOff = i === 6 || i === 13; // two rest days a week apart; none in the final push
    streak = dayOff ? 0 : streak + 1;
    return streak;
  });

  return dates.map((date, i) => {
    const afterHoursMin = Math.max(0, Math.round(afterHours[i]));
    const noteBacklog = Math.max(0, Math.round(backlog[i]));
    const encounters = Math.max(0, Math.round(census[i]));
    const hrvRmssd = Math.round(hrv[i] * 10) / 10;
    const restingHr = Math.round(rhr[i]);
    const sleepH = Math.round(sleep[i] * 10) / 10;
    const loadIntensity = Math.max(0, (afterHoursMin - 35) / (85 - 35));

    const sleepEff = Math.round(clampInt(90 - loadIntensity * 18 + noiseIn(rand, 2), 60, 95));
    const steps = Math.round(clampInt(7800 - loadIntensity * 2600 + noiseIn(rand, 250), 3200, 8600));

    return {
      date,
      workload: {
        afterHoursMin,
        noteBacklog,
        inboxOpen: Math.round(clampInt(noteBacklog * 1.4 + 2 + noiseIn(rand, 1), 1, 30)),
        inboxLatencyH: Math.round((3 + loadIntensity * 3 + noiseIn(rand, 0.4)) * 10) / 10,
        encounters,
        ordersPlaced: Math.round(clampInt(encounters * 1.2 + noiseIn(rand, 1.2), 8, 40)),
        consecutiveDays: consecutiveDays[i],
        scheduledH: Math.round((10.5 + noiseIn(rand, 0.5)) * 10) / 10,
        ptoDay: false,
        acuityEvents: [],
      },
      body: { hrvRmssd, restingHr, sleepH, sleepEff, steps },
      personal: {
        medications: [
          { name: 'Metoprolol', dose: '50 mg', lastFill: '2026-07-05', daysSupply: 30, refillsRemaining: 3, drugClass: 'beta_blocker' },
        ],
        conditions: ['Hypertension (diagnosed 2019)'],
        lastPcpVisit: '2025-11-03',
        labs: [{ name: 'Blood pressure', value: '128/82 mmHg', date: '2025-11-03' }],
      },
    };
  });
}

function clampInt(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
