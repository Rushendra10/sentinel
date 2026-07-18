// lib/data/roster.ts — the 11-person roster. Generic archetype-driven generator;
// no hand-tuning beyond the archetype params in lib/data/clinicians.ts. Nobody
// here gets acuity events or personal-tier data — Load Index stays in SPEC's
// 18–56 band and nobody reads Critical (Chen must be the only one).

import type { DayMetrics } from '../types';
import type { RosterArchetype } from './clinicians';
import { dateRange } from './dates';
import { createRng, noiseIn } from './prng';

const START = '2026-06-28';
const END = '2026-07-18';

/** Normalized 0..1 shape curve (1 = the archetype's most extreme day). */
function shapeCurve(shape: RosterArchetype['trajectoryShape'], t: number): number {
  switch (shape) {
    case 'flat':
      return 1;
    case 'rising':
      return t;
    case 'falling':
      return 0.15 + 0.85 * (1 - t); // "recovering," not fully back to baseline by today
    case 'dip_recover':
      if (t < 0.15) return t / 0.15;
      if (t < 0.5) return 1 - 0.8 * ((t - 0.15) / 0.35);
      return 0.2;
  }
}

export function buildRosterSeries(archetype: RosterArchetype): DayMetrics[] {
  const { clinician, trajectoryShape, hasPrivateFactor, peakIntensity } = archetype;
  const dates = dateRange(START, END);
  const rand = createRng(`roster-${clinician.id}`);
  const b = clinician.baselines;

  // A private factor is a small, persistent (not trend-driven) suppression — a
  // standing personal/body finding, not the thing driving their trajectory.
  const privateFactorMultiplier = hasPrivateFactor ? 0.86 : 1;

  let streak = 0;
  return dates.map((date, i) => {
    const t = i / (dates.length - 1);
    const intensity = shapeCurve(trajectoryShape, t) * peakIntensity;

    // A day off genuinely means no after-hours charting that day — this is also
    // what guarantees a "low-load day in the trailing 7d" so recoveryDeficit's
    // +1 penalty (SPEC §4) only applies to clinicians actually working through
    // their rest days, not to every roster member with a rising trend line.
    const dayOff = i > 0 && i % 6 === 0;
    streak = dayOff ? 0 : streak + 1;

    const afterHoursMin = dayOff
      ? Math.round(clampInt(3 + noiseIn(rand, 2), 0, 8))
      : Math.max(0, Math.round(b.afterHoursMin * (1 + intensity * 1.3) + noiseIn(rand, b.afterHoursMin * 0.08)));
    const noteBacklog = Math.max(0, Math.round(b.backlog * (1 + intensity * 1.6) + noiseIn(rand, 0.6)));
    const encounters = dayOff ? 0 : Math.max(0, Math.round(b.encounters * (1 + intensity * 0.25) + noiseIn(rand, b.encounters * 0.05)));

    const hrvRmssd = Math.round((b.hrvRmssd * (1 - intensity * 0.42) * privateFactorMultiplier + noiseIn(rand, 1.2)) * 10) / 10;
    const restingHr = Math.round(b.restingHr * (1 + intensity * 0.12) + noiseIn(rand, 1.0));
    const sleepH = Math.round((b.sleepH * (1 - intensity * 0.22) + noiseIn(rand, 0.15)) * 10) / 10;

    const sleepEff = Math.round(clampInt(90 - intensity * 22 + noiseIn(rand, 2), 62, 96));
    const steps = Math.round(clampInt(7200 - intensity * 3200 + noiseIn(rand, 250), 2800, 8400));

    return {
      date,
      workload: {
        afterHoursMin,
        noteBacklog,
        inboxOpen: Math.max(1, Math.round(noteBacklog * 1.4 + 2 + noiseIn(rand, 1))),
        inboxLatencyH: Math.round((2 + noteBacklog * 0.3 + noiseIn(rand, 0.3)) * 10) / 10,
        encounters,
        ordersPlaced: Math.max(4, Math.round(encounters * 1.2 + noiseIn(rand, 1))),
        consecutiveDays: streak,
        scheduledH: dayOff ? 0 : Math.round((9.5 + noiseIn(rand, 0.6)) * 10) / 10,
        ptoDay: dayOff,
        acuityEvents: [],
      },
      body: { hrvRmssd, restingHr, sleepH, sleepEff, steps },
    };
  });
}

function clampInt(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
