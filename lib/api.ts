// lib/api.ts — the single data facade the UI consumes. SIGNATURES ARE FROZEN.
// The data/score workstream replaces the placeholder internals below with the real
// seeded engine (lib/data + lib/score + lib/privacy). UI must only import from here.

import type {
  AdminProfile, AdminRosterRow, Clinician, DayMetrics, Encounter,
  EventPin, InboxEmail, ScoreDay, ScorePoint,
} from './types';

// ————————————————————————————————————————————————————————————————
// PLACEHOLDER IMPLEMENTATION — enough for the UI to render during parallel dev.
// ————————————————————————————————————————————————————————————————

const chen: Clinician = {
  id: 'chen', name: 'Maya Chen', credentials: 'MD', role: 'Attending Physician',
  specialty: 'Emergency Medicine', unit: 'ED',
  consent: { workload: true, body: true, personal: true },
  baselines: { hrvRmssd: 45, restingHr: 62, sleepH: 7.5, afterHoursMin: 40, backlog: 2, encounters: 20 },
};

const placeholderScore: ScoreDay = {
  date: '2026-07-18', loadIndex: 81, tier: 'critical', trajectory: 'rising',
  drivers: [
    { id: 'after-hours', tier: 'workload', label: 'After-hours charting: 140 min', detail: 'Documentation is spilling far past your shifts.', value: '140 min', deltaVsBaseline: '+250% vs your baseline', severity: 3, spark: [45, 60, 70, 85, 90, 95, 100, 110, 115, 120, 125, 130, 135, 140] },
    { id: 'hrv', tier: 'body', label: 'HRV 40% below your baseline', detail: 'Your recovery signal has been suppressed for nine days.', value: '27 ms', deltaVsBaseline: '−40% vs your baseline', severity: 3, spark: [44, 42, 41, 38, 35, 33, 32, 31, 30, 29, 29, 28, 28, 27] },
    { id: 'levo-gap', tier: 'personal', label: 'Levothyroxine gap: 19 days', detail: 'Your refill lapsed exactly as the workload spike began.', value: '19 days', deltaVsBaseline: 'Adherent for 18 months before this', severity: 3 },
  ],
  triggers: { leadFired: '2026-07-07', bodyConfirmed: '2026-07-09', personalCatch: '2026-07-18' },
};

const flatSeries: ScorePoint[] = Array.from({ length: 21 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 5, 28 + i));
  const loadIndex = 24 + Math.round((81 - 24) * (i / 20));
  const tier = loadIndex >= 70 ? 'critical' : loadIndex >= 55 ? 'high' : loadIndex >= 35 ? 'elevated' : 'stable';
  return { date: d.toISOString().slice(0, 10), loadIndex, tier } as ScorePoint;
});

export function listClinicians(): Clinician[] { return [chen]; }
export function getClinician(id: string): Clinician { void id; return chen; }
export function getScoreDay(id: string, date: string): ScoreDay { void id; return { ...placeholderScore, date }; }
export function getScoreSeries(id: string): ScorePoint[] { void id; return flatSeries; }
export function getDayMetrics(id: string, date: string): DayMetrics | null { void id; void date; return null; }
export function getEventPins(id: string): EventPin[] { void id; return []; }
export function getSchedule(id: string, date: string): Encounter[] { void id; void date; return []; }
export function getSeededInbox(): InboxEmail[] { return []; }
export function getAdminRoster(date: string): AdminRosterRow[] {
  void date;
  return [{
    clinicianId: 'chen', name: 'Maya Chen', credentials: 'MD', unit: 'ED', specialty: 'Emergency Medicine',
    loadIndex: 81, tier: 'critical', trajectory: 'rising', spark: flatSeries.map((p) => p.loadIndex),
    visibleDrivers: placeholderScore.drivers.filter((d) => d.tier === 'workload'),
    lockedFactorCount: 2,
  }];
}
export function getAdminProfile(id: string, date: string): AdminProfile {
  void id;
  return {
    clinician: { id: 'chen', name: 'Maya Chen', credentials: 'MD', unit: 'ED', specialty: 'Emergency Medicine', role: 'Attending Physician' },
    scoreDay: { ...placeholderScore, date, drivers: placeholderScore.drivers.filter((d) => d.tier === 'workload'), adjustment: undefined },
    lockedFactorCount: 2,
    spark: flatSeries.map((p) => p.loadIndex),
  };
}
/** Compact pre-aggregated context for live LLM prompts — never raw day series. */
export function getAgentContext(id: string, date: string): Record<string, unknown> {
  return { clinicianId: id, date, note: 'placeholder — replaced by data workstream' };
}
