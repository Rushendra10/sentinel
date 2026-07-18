// lib/score/eventPins.ts — timeline event pins per SPEC §1/§7, hardcoded per
// protagonist (they're specific narrative beats, not derived from formulas).
// Roster clinicians get none — they aren't part of the detection storyline.

import type { EventPin } from '../types';

const CHEN_PINS: EventPin[] = [
  { date: '2026-07-05', label: 'Colleague leave — Chen absorbs shifts', kind: 'coverage' },
  { date: '2026-07-07', label: 'Sentinel trigger — workload trend rising 3 days straight', kind: 'trigger' },
  { date: '2026-07-08', label: 'Patient death — septic shock, bay 4', kind: 'death' },
  { date: '2026-07-09', label: 'Second patient death — failed resuscitation', kind: 'death' },
  { date: '2026-07-09', label: 'Body confirmation — HRV and sleep deteriorating', kind: 'confirm' },
  { date: '2026-07-14', label: 'Dosing-order near-miss caught by pharmacist', kind: 'near_miss' },
  { date: '2026-07-18', label: 'Personal-context catch — levothyroxine gap, 19 days', kind: 'catch' },
  { date: '2026-07-18', label: 'Intervention — refill request, recovery block, escalation drafted', kind: 'intervention' },
  { date: '2026-07-20', label: 'Protected recovery day', kind: 'recovery' },
  { date: '2026-07-24', label: 'Second recovery day', kind: 'recovery' },
  { date: '2026-07-25', label: 'Verifier closes the loop — recovery confirmed', kind: 'verify' },
];

const OKAFOR_PINS: EventPin[] = [
  { date: '2026-06-30', label: 'Patient death — ICU bed 3', kind: 'death' },
  { date: '2026-06-30', label: 'Sentinel trigger — workload trend rising', kind: 'trigger' },
  { date: '2026-07-01', label: 'Second patient death within 48 hours', kind: 'death' },
  { date: '2026-07-02', label: 'Escalation sent with consent; coverage adjusted', kind: 'intervention' },
  { date: '2026-07-04', label: 'Recovery day', kind: 'recovery' },
  { date: '2026-07-05', label: 'Second recovery day', kind: 'recovery' },
  { date: '2026-07-09', label: 'Verifier closes the loop — full recovery confirmed', kind: 'verify' },
];

const PATEL_PINS: EventPin[] = [
  { date: '2026-07-17', label: 'Personal-context catch — beta-blocker recalibration', kind: 'catch' },
];

const PINS: Record<string, EventPin[]> = {
  chen: CHEN_PINS,
  okafor: OKAFOR_PINS,
  patel: PATEL_PINS,
};

export function eventPinsFor(clinicianId: string): EventPin[] {
  return PINS[clinicianId] ?? [];
}
