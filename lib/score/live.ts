// lib/score/live.ts — the live-action layer: every "quick win" carries a score
// impact COMPUTED from the same formula as the engine (same k, same term weights),
// never a hardcoded delta. An action maps to a change in the input space (recovery
// units credited, backlog cleared, a spike reclassified), we reduce the effective
// strain T by that term, and re-run 100·(1−e^(−kT)). Taking the action applies the
// same delta to the displayed score.

import { LOAD_INDEX_K, tierFromIndex } from './engine';
import { getRawLoad, getScoreDay } from '../api';
import type { ArtifactStatus, ScoreDay } from '../types';

/** Recover effective strain T from the displayed (anchor-corrected) score. */
function effectiveT(loadIndex: number): number {
  const s = Math.min(Math.max(loadIndex, 1), 99) / 100;
  return -Math.log(1 - s) / LOAD_INDEX_K;
}

/** Score points gained by reducing effective strain by deltaT, at this day's operating point. */
export function deltaPts(id: string, date: string, deltaT: number): number {
  const s = getScoreDay(id, date).loadIndex;
  const T = effectiveT(s);
  const s2 = 100 * (1 - Math.exp(-LOAD_INDEX_K * Math.max(0, T - deltaT)));
  return Math.max(0, Math.round((s - s2) * 10) / 10);
}

// ————— action → input-space change (weights mirror engine.computeRawWB) —————

// CABR-style reweighting: an unexplained strain spike carries w_u = 2.0; once the
// clinician tags it, it's explained clinical load at w_e = 0.5.
const SPIKE_UNITS = 0.35;
export const SPIKE_TAG_DELTA_T = (2.0 - 0.5) * SPIKE_UNITS;

export type BoostKind = 'calendar' | 'start' | 'reminder';
export interface Boost {
  id: string;
  label: string;
  sub: string;
  kind: BoostKind;
  ctaLabel: string;
  doneLabel: string;
  deltaT: number;
}

/** The generic recovery micro-actions. deltaT values are input-space term changes:
 * weight × credited units, capped by what the day's raw terms actually contain. */
export function boostCatalog(id: string, date: string): Boost[] {
  const raw = getRawLoad(id, date);
  const boosts: Boost[] = [
    {
      id: 'walk-20',
      label: 'Block a 20-min walk tomorrow, 7:00 AM',
      sub: 'Restorative movement credits your recovery term',
      kind: 'calendar',
      ctaLabel: 'Add to calendar',
      doneLabel: 'On your calendar',
      deltaT: 1.0 * Math.min(0.3, Math.max(0.15, raw.recoveryDeficit * 0.15)),
    },
    {
      id: 'reset-90',
      label: '90-second paced breathing before your next block',
      sub: 'Fastest lever on suppressed vagal tone',
      kind: 'start',
      ctaLabel: 'Start now',
      doneLabel: 'Done — nice',
      deltaT: 2.0 * Math.min(0.1, Math.max(0.04, raw.hrvSuppression * 0.06)),
    },
    {
      id: 'lights-1030',
      label: 'Lights out by 10:30 tonight',
      sub: 'Projected against your sleep-debt term',
      kind: 'reminder',
      ctaLabel: 'Set reminder',
      doneLabel: 'Reminder set',
      deltaT: 1.2 * Math.min(0.4, Math.max(0.15, raw.sleepDeficit * 0.5)),
    },
  ];
  return boosts;
}

/** Score-moving artifact approvals: input-space changes for the big actions.
 * (Personal-tier artifacts — refill, PCP visit — deliberately move NOTHING:
 * personal health data never adds or removes score points.) */
export function artifactDeltaT(id: string, artifactId: string, date: string): number {
  const raw = getRawLoad(id, date);
  if (id === 'chen') {
    // Signing the drafted notes clears the backlog term and most of tonight's after-hours.
    if (artifactId === 'chen-art-note-v1' || artifactId === 'chen-art-note-v2') {
      return (1.2 * raw.backlogDev + 1.5 * raw.afterHoursDev * 0.6) / 2; // half per signed note batch
    }
    // Approved recovery block + shift relief halves the recovery deficit.
    if (artifactId === 'chen-art-schedule') return 1.0 * raw.recoveryDeficit * 0.5;
  }
  if (id === 'patel') {
    if (artifactId === 'patel-art-cap') return 1.0 * raw.volumeDev * 0.6 + 1.5 * raw.afterHoursDev * 0.25;
    if (artifactId === 'patel-art-redistribute') return 1.0 * raw.volumeDev * 0.3;
  }
  return 0;
}

const SCORE_MOVING_ARTIFACTS: Record<string, string[]> = {
  chen: ['chen-art-note-v1', 'chen-art-note-v2', 'chen-art-schedule'],
  patel: ['patel-art-cap', 'patel-art-redistribute'],
};

export interface LiveState {
  takenBoosts: Record<string, true>;
  spikeTags: Record<string, string>;
  artifactStatus: Record<string, ArtifactStatus>;
}

/** The displayed score: engine output minus every credit the clinician has earned
 * this session — all credits computed through the same formula, none hardcoded. */
export function effectiveScoreDay(id: string, date: string, live: LiveState): ScoreDay & { creditPts: number } {
  const base = getScoreDay(id, date);
  let deltaT = 0;

  for (const boost of boostCatalog(id, date)) {
    if (live.takenBoosts[boost.id]) deltaT += boost.deltaT;
  }
  if (Object.keys(live.spikeTags).length > 0) deltaT += SPIKE_TAG_DELTA_T;
  for (const artifactId of SCORE_MOVING_ARTIFACTS[id] ?? []) {
    const status = live.artifactStatus[artifactId];
    if (status === 'signed' || status === 'approved' || status === 'sent') {
      deltaT += artifactDeltaT(id, artifactId, date);
    }
  }

  if (deltaT === 0) return { ...base, creditPts: 0 };

  const T = effectiveT(base.loadIndex);
  const adjusted = Math.round(100 * (1 - Math.exp(-LOAD_INDEX_K * Math.max(0, T - deltaT))));
  const creditPts = base.loadIndex - adjusted;
  return {
    ...base,
    loadIndex: adjusted,
    tier: tierFromIndex(adjusted),
    trajectory: creditPts >= 3 ? 'falling' : base.trajectory,
    creditPts,
  };
}
