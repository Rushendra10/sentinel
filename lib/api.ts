// lib/api.ts — the single data facade the UI consumes. SIGNATURES ARE FROZEN.
// Internals below are the real seeded engine (lib/data + lib/score + lib/privacy),
// computed once at module load into in-memory maps — this is static seeded data,
// so there is no reason to recompute per request.

import type {
  AdminProfile, AdminRosterRow, Clinician, DayMetrics, Encounter,
  EventPin, InboxEmail, ScoreDay, ScorePoint,
} from './types';

import { CHEN, CLINICIANS, OKAFOR, PATEL, ROSTER } from './data/clinicians';
import { buildChenSeries } from './data/scenario-chen';
import { buildPatelSeries } from './data/scenario-patel';
import { buildOkaforSeries } from './data/scenario-okafor';
import { buildRosterSeries } from './data/roster';
import { getScheduleFor } from './data/schedule';
import { getSeededInboxEmails } from './data/inbox';
import { eventPinsFor } from './score/eventPins';
import { assemblePatelScore, assembleStandardScore, CHEN_TARGETS, OKAFOR_TARGETS } from './score/build';
import type { ClinicianScoreData } from './score/build';
import { scoreDayClamped, toAdminProfile, toAdminRosterRow } from './privacy/projection';

// ————————————————————————————————————————————————————————————————
// Build once, at module load. Deterministic seeded data — identical every run.
// ————————————————————————————————————————————————————————————————

const SCORE_DATA = new Map<string, ClinicianScoreData>();
SCORE_DATA.set('chen', assembleStandardScore(CHEN, buildChenSeries(), CHEN_TARGETS));
SCORE_DATA.set('patel', assemblePatelScore(PATEL, buildPatelSeries()));
SCORE_DATA.set('okafor', assembleStandardScore(OKAFOR, buildOkaforSeries(), OKAFOR_TARGETS));
for (const archetype of ROSTER) {
  SCORE_DATA.set(archetype.clinician.id, assembleStandardScore(archetype.clinician, buildRosterSeries(archetype)));
}

const CLINICIAN_MAP = new Map<string, Clinician>(CLINICIANS.map((c) => [c.id, c]));

function requireScoreData(id: string): ClinicianScoreData {
  const data = SCORE_DATA.get(id);
  if (!data) throw new Error(`Unknown clinician: ${id}`);
  return data;
}

// ————————————————————————————————————————————————————————————————
// Public facade — signatures frozen by lib/types.ts consumers.
// ————————————————————————————————————————————————————————————————

export function listClinicians(): Clinician[] {
  return CLINICIANS;
}

export function getClinician(id: string): Clinician {
  const c = CLINICIAN_MAP.get(id);
  if (!c) throw new Error(`Unknown clinician: ${id}`);
  return c;
}

export function getScoreDay(id: string, date: string): ScoreDay {
  return scoreDayClamped(requireScoreData(id), date);
}

export function getScoreSeries(id: string): ScorePoint[] {
  return requireScoreData(id).scoreSeries;
}

export function getDayMetrics(id: string, date: string): DayMetrics | null {
  const data = requireScoreData(id);
  return data.series.find((d) => d.date === date) ?? null;
}

export function getEventPins(id: string): EventPin[] {
  return eventPinsFor(id);
}

export function getSchedule(id: string, date: string): Encounter[] {
  return getScheduleFor(id, date);
}

export function getSeededInbox(): InboxEmail[] {
  return getSeededInboxEmails();
}

export function getAdminRoster(date: string): AdminRosterRow[] {
  return CLINICIANS.map((c) => toAdminRosterRow(requireScoreData(c.id), date));
}

export function getAdminProfile(id: string, date: string): AdminProfile {
  return toAdminProfile(requireScoreData(id), date);
}

/** Compact pre-aggregated context for live LLM prompts — never raw day series. */
export function getAgentContext(id: string, date: string): Record<string, unknown> {
  const data = requireScoreData(id);
  const clinician = getClinician(id);
  const scoreDay = scoreDayClamped(data, date);

  const first = data.dates[0];
  const last = data.dates[data.dates.length - 1];
  const clampedDate = date < first ? first : date > last ? last : date;
  const idx = data.dates.indexOf(clampedDate);
  const window = data.series.slice(Math.max(0, idx - 6), idx + 1);

  const avg = (values: number[]): number =>
    values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
  const bodyValues = (pick: (d: DayMetrics) => number | undefined): number[] =>
    window.map(pick).filter((v): v is number => v !== undefined);

  return {
    clinicianId: id,
    date,
    name: clinician.name,
    role: clinician.role,
    specialty: clinician.specialty,
    unit: clinician.unit,
    consent: clinician.consent,
    baselines: clinician.baselines,
    score: { loadIndex: scoreDay.loadIndex, tier: scoreDay.tier, trajectory: scoreDay.trajectory },
    triggers: scoreDay.triggers,
    adjustment: scoreDay.adjustment,
    topDrivers: scoreDay.drivers.slice(0, 3).map((d) => ({ tier: d.tier, label: d.label, deltaVsBaseline: d.deltaVsBaseline })),
    last7: {
      afterHoursMinAvg: avg(window.map((d) => d.workload.afterHoursMin)),
      noteBacklogAvg: avg(window.map((d) => d.workload.noteBacklog)),
      encountersAvg: avg(window.map((d) => d.workload.encounters)),
      consecutiveDaysMax: Math.max(...window.map((d) => d.workload.consecutiveDays)),
      acuityEventCount: window.reduce((sum, d) => sum + d.workload.acuityEvents.length, 0),
      hrvRmssdAvg: avg(bodyValues((d) => d.body?.hrvRmssd)),
      restingHrAvg: avg(bodyValues((d) => d.body?.restingHr)),
      sleepHAvg: avg(bodyValues((d) => d.body?.sleepH)),
    },
  };
}
