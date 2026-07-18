// lib/data/scenario-okafor.ts — Dr. Sarah Okafor, Case 3 (SPEC §1). Pure-workload
// catch, loop already CLOSED: crisis Jun 28 – Jul 2, escalation + coverage change,
// recovery Jul 4–5, fully recovered by Jul 9, stable through "today" (Jul 18).
// consent.personal = false — she never connects Tier 3, and Sentinel still catches
// her. No `personal` field is ever produced for her days.

import type { DayMetrics } from '../types';
import { dateRange } from './dates';
import { createRng, noiseIn } from './prng';
import { interpolateSeries, type Checkpoint } from './interpolate';

export const OKAFOR_START = '2026-06-28';
export const OKAFOR_END = '2026-07-18';

const rand = createRng('okafor-metrics');

const AFTER_HOURS: Checkpoint[] = [
  { date: '2026-06-28', value: 95 },
  { date: '2026-06-30', value: 118 },
  { date: '2026-07-01', value: 122 },
  { date: '2026-07-02', value: 120 },
  { date: '2026-07-03', value: 95 },
  { date: '2026-07-04', value: 60 },
  { date: '2026-07-05', value: 55 },
  { date: '2026-07-06', value: 52 },
  { date: '2026-07-07', value: 48 },
  { date: '2026-07-08', value: 46 },
  { date: '2026-07-09', value: 45 },
  { date: '2026-07-18', value: 46 },
];

const BACKLOG: Checkpoint[] = [
  { date: '2026-06-28', value: 7 },
  { date: '2026-06-30', value: 9 },
  { date: '2026-07-01', value: 10 },
  { date: '2026-07-02', value: 10 },
  { date: '2026-07-03', value: 8 },
  { date: '2026-07-04', value: 5 },
  { date: '2026-07-05', value: 4 },
  { date: '2026-07-06', value: 4 },
  { date: '2026-07-09', value: 3 },
  { date: '2026-07-18', value: 3 },
];

// -38% vs her 42ms baseline lands right around 26ms at the crisis peak.
const HRV: Checkpoint[] = [
  { date: '2026-06-28', value: 29 },
  { date: '2026-06-30', value: 26 },
  { date: '2026-07-01', value: 26 },
  { date: '2026-07-02', value: 27 },
  { date: '2026-07-03', value: 29 },
  { date: '2026-07-04', value: 32 },
  { date: '2026-07-05', value: 34 },
  { date: '2026-07-06', value: 36 },
  { date: '2026-07-07', value: 38 },
  { date: '2026-07-08', value: 40 },
  { date: '2026-07-09', value: 41 },
  { date: '2026-07-18', value: 42 },
];

const RHR: Checkpoint[] = [
  { date: '2026-06-28', value: 70 },
  { date: '2026-06-30', value: 74 },
  { date: '2026-07-01', value: 74 },
  { date: '2026-07-02', value: 73 },
  { date: '2026-07-03', value: 71 },
  { date: '2026-07-04', value: 69 },
  { date: '2026-07-05', value: 68 },
  { date: '2026-07-06', value: 67 },
  { date: '2026-07-07', value: 66 },
  { date: '2026-07-08', value: 65 },
  { date: '2026-07-09', value: 64 },
  { date: '2026-07-18', value: 64 },
];

const SLEEP: Checkpoint[] = [
  { date: '2026-06-28', value: 5.8 },
  { date: '2026-06-30', value: 5.3 },
  { date: '2026-07-01', value: 5.3 },
  { date: '2026-07-02', value: 5.4 },
  { date: '2026-07-03', value: 5.7 },
  { date: '2026-07-04', value: 6.3 },
  { date: '2026-07-05', value: 6.6 },
  { date: '2026-07-06', value: 6.8 },
  { date: '2026-07-07', value: 6.9 },
  { date: '2026-07-08', value: 6.9 },
  { date: '2026-07-09', value: 7.0 },
  { date: '2026-07-18', value: 7.1 },
];

const CONSECUTIVE_DAYS: Record<string, number> = {
  '2026-06-28': 7, '2026-06-29': 8, '2026-06-30': 9,
  '2026-07-01': 10, '2026-07-02': 11, '2026-07-03': 1, '2026-07-04': 0,
  '2026-07-05': 0, '2026-07-06': 1, '2026-07-07': 2, '2026-07-08': 3,
  '2026-07-09': 4, '2026-07-10': 5, '2026-07-11': 6, '2026-07-12': 7,
  '2026-07-13': 0, '2026-07-14': 1, '2026-07-15': 2, '2026-07-16': 3,
  '2026-07-17': 4, '2026-07-18': 5,
};

const OFF_DAYS = new Set(['2026-07-04', '2026-07-05', '2026-07-13']);

const ACUITY_EVENTS: Record<string, { kind: 'death'; note: string }[]> = {
  '2026-06-30': [{ kind: 'death', note: 'ICU bed 3 — multi-organ failure, family present, care withdrawn per directive.' }],
  '2026-07-01': [{ kind: 'death', note: 'Second ICU death within 48 hours — post-cardiac-arrest patient, unrecoverable.' }],
};

export function buildOkaforSeries(): DayMetrics[] {
  const dates = dateRange(OKAFOR_START, OKAFOR_END);
  const afterHours = interpolateSeries(dates, AFTER_HOURS, rand, 1.6);
  const backlog = interpolateSeries(dates, BACKLOG, rand, 0.25);
  const hrv = interpolateSeries(dates, HRV, rand, 0.35);
  const rhr = interpolateSeries(dates, RHR, rand, 0.4);
  const sleep = interpolateSeries(dates, SLEEP, rand, 0.08);
  const encounters = interpolateSeries(
    dates,
    [{ date: '2026-06-28', value: 11 }, { date: '2026-07-02', value: 12 }, { date: '2026-07-18', value: 10 }],
    rand,
    0.6,
  );

  return dates.map((date, i) => {
    const afterHoursMin = Math.max(0, Math.round(afterHours[i]));
    const noteBacklog = Math.max(0, Math.round(backlog[i]));
    const hrvRmssd = Math.round(hrv[i] * 10) / 10;
    const restingHr = Math.round(rhr[i]);
    const sleepH = Math.round(sleep[i] * 10) / 10;
    const loadIntensity = Math.max(0, (afterHoursMin - 45) / (122 - 45));

    const sleepEff = Math.round(clampInt(92 - loadIntensity * 30 + noiseIn(rand, 2), 58, 95));
    const steps = Math.round(clampInt(6800 - loadIntensity * 3000 + noiseIn(rand, 220), 2600, 7600));

    return {
      date,
      workload: {
        afterHoursMin,
        noteBacklog,
        inboxOpen: Math.round(clampInt(noteBacklog * 1.5 + 2 + noiseIn(rand, 1), 1, 30)),
        inboxLatencyH: Math.round((2.2 + noteBacklog * 0.3 + noiseIn(rand, 0.4)) * 10) / 10,
        encounters: Math.max(0, Math.round(encounters[i])),
        ordersPlaced: Math.round(clampInt(encounters[i] * 1.5 + noiseIn(rand, 1.3), 6, 30)),
        consecutiveDays: CONSECUTIVE_DAYS[date] ?? 0,
        scheduledH: OFF_DAYS.has(date) ? 0 : Math.round((11 + noiseIn(rand, 0.6)) * 10) / 10,
        ptoDay: OFF_DAYS.has(date),
        acuityEvents: ACUITY_EVENTS[date] ?? [],
      },
      body: { hrvRmssd, restingHr, sleepH, sleepEff, steps },
      // No `personal` key at all — she declined Tier 3 outright.
    };
  });
}

function clampInt(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
