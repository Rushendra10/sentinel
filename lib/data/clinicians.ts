// lib/data/clinicians.ts — the 14 clinicians at Bayview General Medical Center.
// Three protagonists (chen, patel, okafor) per SPEC §1, plus an 11-person roster
// for admin-view realism. Baselines are each clinician's OWN pre-crisis normal —
// the reference every deviation in lib/score is measured against.

import type { Clinician } from '../types';

export const CHEN: Clinician = {
  id: 'chen',
  name: 'Maya Chen',
  credentials: 'MD',
  role: 'Attending Physician',
  specialty: 'Emergency Medicine',
  unit: 'ED',
  consent: { workload: true, body: true, personal: true },
  baselines: { hrvRmssd: 45, restingHr: 62, sleepH: 7.5, afterHoursMin: 40, backlog: 2, encounters: 20 },
};

export const PATEL: Clinician = {
  id: 'patel',
  name: 'Anand Patel',
  credentials: 'MD',
  role: 'Attending Physician',
  specialty: 'Internal Medicine',
  unit: 'Hospital Medicine',
  consent: { workload: true, body: true, personal: true },
  // HRV baseline is his MEDICATED baseline (38ms) — beta-blockade already priced in;
  // restingHr baseline reflects the "watch says fine" 58-62 read the wearable shows all month.
  baselines: { hrvRmssd: 38, restingHr: 60, sleepH: 6.9, afterHoursMin: 35, backlog: 3, encounters: 14 },
};

export const OKAFOR: Clinician = {
  id: 'okafor',
  name: 'Sarah Okafor',
  credentials: 'MD',
  role: 'Attending Physician',
  specialty: 'Critical Care',
  unit: 'ICU',
  // Consent granularity showcase: workload + wearable connected, personal declined outright.
  consent: { workload: true, body: true, personal: false },
  baselines: { hrvRmssd: 42, restingHr: 64, sleepH: 7.0, afterHoursMin: 45, backlog: 3, encounters: 10 },
};

/**
 * Roster archetype — enough to drive the generic generator in lib/data/roster.ts.
 * `peakIntensity` (roughly 0–0.5) is the fractional deviation from baseline at the
 * archetype's most extreme day; it's a generation knob, not a score anchor — the
 * roster only needs to read as plausible and stay inside SPEC's 18–56 band, nobody
 * critical.
 */
export interface RosterArchetype {
  clinician: Clinician;
  trajectoryShape: 'flat' | 'rising' | 'falling' | 'dip_recover';
  peakIntensity: number;
  hasPrivateFactor: boolean; // true => one body/personal driver deliberately surfaces
}

const rosterConsent = (body: boolean, personal: boolean) => ({ workload: true as const, body, personal });

export const ROSTER: RosterArchetype[] = [
  {
    clinician: {
      id: 'kim', name: 'Daniel Kim', credentials: 'MD', role: 'Attending Physician',
      specialty: 'Emergency Medicine', unit: 'ED', consent: rosterConsent(true, false),
      baselines: { hrvRmssd: 48, restingHr: 60, sleepH: 7.3, afterHoursMin: 38, backlog: 2, encounters: 18 },
    },
    trajectoryShape: 'flat', peakIntensity: 0.30, hasPrivateFactor: false,
  },
  {
    clinician: {
      id: 'nakamura', name: 'Grace Nakamura', credentials: 'MD', role: 'Attending Physician',
      specialty: 'Emergency Medicine', unit: 'ED', consent: rosterConsent(true, false),
      baselines: { hrvRmssd: 44, restingHr: 63, sleepH: 7.1, afterHoursMin: 42, backlog: 3, encounters: 19 },
    },
    trajectoryShape: 'rising', peakIntensity: 0.35, hasPrivateFactor: true,
  },
  {
    clinician: {
      id: 'webb', name: 'Marcus Webb', credentials: 'MD', role: 'Attending Physician',
      specialty: 'Critical Care', unit: 'ICU', consent: rosterConsent(true, false),
      baselines: { hrvRmssd: 41, restingHr: 65, sleepH: 6.8, afterHoursMin: 50, backlog: 4, encounters: 9 },
    },
    trajectoryShape: 'dip_recover', peakIntensity: 1.00, hasPrivateFactor: false,
  },
  {
    clinician: {
      id: 'hussein', name: 'Nadia Hussein', credentials: 'RN', role: 'Registered Nurse',
      specialty: 'Critical Care Nursing', unit: 'ICU', consent: rosterConsent(true, false),
      baselines: { hrvRmssd: 46, restingHr: 61, sleepH: 7.2, afterHoursMin: 20, backlog: 1, encounters: 8 },
    },
    trajectoryShape: 'flat', peakIntensity: 0.22, hasPrivateFactor: false,
  },
  {
    clinician: {
      id: 'rahman', name: 'Aisha Rahman', credentials: 'MD', role: 'Attending Physician',
      specialty: 'Internal Medicine', unit: 'Hospital Medicine', consent: rosterConsent(true, false),
      baselines: { hrvRmssd: 43, restingHr: 64, sleepH: 7.0, afterHoursMin: 44, backlog: 3, encounters: 15 },
    },
    trajectoryShape: 'rising', peakIntensity: 0.40, hasPrivateFactor: false,
  },
  {
    clinician: {
      id: 'osei', name: 'Samuel Osei', credentials: 'MD', role: 'Attending Physician',
      specialty: 'Internal Medicine', unit: 'Hospital Medicine', consent: rosterConsent(true, false),
      baselines: { hrvRmssd: 45, restingHr: 61, sleepH: 7.4, afterHoursMin: 36, backlog: 2, encounters: 14 },
    },
    trajectoryShape: 'flat', peakIntensity: 0.28, hasPrivateFactor: true,
  },
  {
    clinician: {
      id: 'obrien', name: 'Thomas O’Brien', credentials: 'MD', role: 'Attending Physician',
      specialty: 'Hematology-Oncology', unit: 'Oncology', consent: rosterConsent(true, false),
      baselines: { hrvRmssd: 40, restingHr: 66, sleepH: 6.9, afterHoursMin: 48, backlog: 4, encounters: 12 },
    },
    trajectoryShape: 'falling', peakIntensity: 1.30, hasPrivateFactor: false,
  },
  {
    clinician: {
      id: 'voss', name: 'Elena Voss', credentials: 'MD', role: 'Attending Physician',
      specialty: 'Internal Medicine', unit: 'Med-Surg', consent: rosterConsent(true, false),
      baselines: { hrvRmssd: 47, restingHr: 59, sleepH: 7.5, afterHoursMin: 30, backlog: 2, encounters: 16 },
    },
    trajectoryShape: 'flat', peakIntensity: 0.30, hasPrivateFactor: false,
  },
  {
    clinician: {
      id: 'park', name: 'Lindsey Park', credentials: 'NP', role: 'Nurse Practitioner',
      specialty: 'Internal Medicine', unit: 'Med-Surg', consent: rosterConsent(true, false),
      baselines: { hrvRmssd: 44, restingHr: 62, sleepH: 7.0, afterHoursMin: 34, backlog: 2, encounters: 13 },
    },
    trajectoryShape: 'rising', peakIntensity: 0.38, hasPrivateFactor: false,
  },
  {
    clinician: {
      id: 'ellis', name: 'Jordan Ellis', credentials: 'RN', role: 'Registered Nurse',
      specialty: 'Med-Surg Nursing', unit: 'Med-Surg', consent: rosterConsent(true, false),
      baselines: { hrvRmssd: 45, restingHr: 60, sleepH: 7.3, afterHoursMin: 18, backlog: 1, encounters: 10 },
    },
    trajectoryShape: 'flat', peakIntensity: 0.28, hasPrivateFactor: false,
  },
  {
    clinician: {
      id: 'jimenez', name: 'Carla Jimenez', credentials: 'NP', role: 'Nurse Practitioner',
      specialty: 'Hematology-Oncology', unit: 'Oncology', consent: rosterConsent(true, false),
      baselines: { hrvRmssd: 42, restingHr: 63, sleepH: 6.9, afterHoursMin: 37, backlog: 3, encounters: 12 },
    },
    trajectoryShape: 'rising', peakIntensity: 0.42, hasPrivateFactor: true,
  },
];

export const CLINICIANS: Clinician[] = [CHEN, PATEL, OKAFOR, ...ROSTER.map((r) => r.clinician)];
