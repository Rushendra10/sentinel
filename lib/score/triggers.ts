// lib/score/triggers.ts — trigger dates per SPEC §4/§1. These are fixed per
// protagonist (the spec publishes exact dates for the lead trigger, body
// confirmation, and personal-context catch); roster clinicians never trigger —
// they exist for admin-view realism, not for the detection storyline.

export interface TriggerDates {
  leadFired?: string;
  bodyConfirmed?: string;
  personalCatch?: string;
}

const TRIGGER_DATES: Record<string, TriggerDates> = {
  chen: { leadFired: '2026-07-07', bodyConfirmed: '2026-07-09', personalCatch: '2026-07-18' },
  patel: { personalCatch: '2026-07-17' },
  okafor: { leadFired: '2026-06-30' },
};

/** Only the triggers that have already fired as of `date` (timeline scrubs reveal them progressively). */
export function triggersAsOf(clinicianId: string, date: string): TriggerDates {
  const all = TRIGGER_DATES[clinicianId];
  if (!all) return {};
  const out: TriggerDates = {};
  if (all.leadFired && all.leadFired <= date) out.leadFired = all.leadFired;
  if (all.bodyConfirmed && all.bodyConfirmed <= date) out.bodyConfirmed = all.bodyConfirmed;
  if (all.personalCatch && all.personalCatch <= date) out.personalCatch = all.personalCatch;
  return out;
}

export function fullTriggers(clinicianId: string): TriggerDates {
  return TRIGGER_DATES[clinicianId] ?? {};
}
