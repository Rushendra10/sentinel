// lib/privacy/projection.ts — SPEC §3: admin payloads are built BY OMISSION, never
// by client-side filtering. AdminRosterRow / AdminProfile are constructed field by
// field from only the workload-tier data; body/personal drivers and the Patel
// `adjustment` object are never assigned into these objects in the first place —
// there is no field for the UI to accidentally leak, because the field doesn't exist.

import type { AdminProfile, AdminRosterRow, Driver, ScoreDay } from '../types';
import type { ClinicianScoreData } from '../score/build';

function lockedFactorCount(drivers: Driver[]): number {
  return drivers.filter((d) => d.tier === 'body' || d.tier === 'personal').length;
}

function visibleDrivers(drivers: Driver[]): Driver[] {
  return drivers.filter((d) => d.tier === 'workload');
}

/** Clamp to the clinician's actual data range — series don't all extend to Jul 25. */
export function scoreDayClamped(data: ClinicianScoreData, date: string): ScoreDay {
  const exact = data.scoreDays.get(date);
  if (exact) return exact;
  const first = data.dates[0];
  const last = data.dates[data.dates.length - 1];
  const clamped = date < first ? first : last;
  return data.scoreDays.get(clamped) as ScoreDay;
}

function sparkThrough(data: ClinicianScoreData, date: string, length = 21): number[] {
  const first = data.dates[0];
  const last = data.dates[data.dates.length - 1];
  const clamped = date < first ? first : date > last ? last : date;
  const idx = data.dates.indexOf(clamped);
  return data.scoreSeries.slice(Math.max(0, idx - (length - 1)), idx + 1).map((p) => p.loadIndex);
}

export function toAdminRosterRow(data: ClinicianScoreData, date: string): AdminRosterRow {
  const day = scoreDayClamped(data, date);
  const c = data.clinician;
  return {
    clinicianId: c.id,
    name: c.name,
    credentials: c.credentials,
    unit: c.unit,
    specialty: c.specialty,
    loadIndex: day.loadIndex,
    tier: day.tier,
    trajectory: day.trajectory,
    spark: sparkThrough(data, date),
    visibleDrivers: visibleDrivers(day.drivers),
    lockedFactorCount: lockedFactorCount(day.drivers),
  };
}

export function toAdminProfile(data: ClinicianScoreData, date: string): AdminProfile {
  const day = scoreDayClamped(data, date);
  const c = data.clinician;
  const redactedScoreDay: ScoreDay = {
    date: day.date,
    loadIndex: day.loadIndex,
    tier: day.tier,
    trajectory: day.trajectory,
    drivers: visibleDrivers(day.drivers),
    triggers: day.triggers,
    // `adjustment` intentionally omitted — never assigned, never present on this object.
  };
  return {
    clinician: { id: c.id, name: c.name, credentials: c.credentials, unit: c.unit, specialty: c.specialty, role: c.role },
    scoreDay: redactedScoreDay,
    lockedFactorCount: lockedFactorCount(day.drivers),
    spark: sparkThrough(data, date),
  };
}
