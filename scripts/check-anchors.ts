// scripts/check-anchors.ts — asserts the SPEC §1 anchor tables, trigger dates,
// Patel's naive/adjusted split, and the admin-projection privacy wall. Run with:
//   npx tsx scripts/check-anchors.ts
// Plain console.assert/throw — no test framework, this is a hackathon.

import {
  getAdminProfile, getAdminRoster, getScoreDay, getScoreSeries,
} from '../lib/api';

let failures = 0;

function check(label: string, condition: boolean): void {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${label}`);
  } else {
    console.log(`ok   ${label}`);
  }
}

function within(actual: number, target: number, tolerance = 3): boolean {
  return Math.abs(actual - target) <= tolerance;
}

// ————————————————————————————————————————————————————————————————
// Chen — SPEC §1 anchor table
// ————————————————————————————————————————————————————————————————
const chenAnchors: [string, number][] = [
  ['2026-07-01', 24], ['2026-07-05', 30], ['2026-07-07', 41], ['2026-07-09', 52],
  ['2026-07-12', 58], ['2026-07-14', 66], ['2026-07-16', 74], ['2026-07-18', 81], ['2026-07-25', 44],
];
for (const [date, target] of chenAnchors) {
  const day = getScoreDay('chen', date);
  check(`chen ${date} loadIndex ${day.loadIndex} within ±3 of ${target}`, within(day.loadIndex, target));
}
check('chen 2026-07-18 tier critical', getScoreDay('chen', '2026-07-18').tier === 'critical');
check('chen 2026-07-01 tier stable', getScoreDay('chen', '2026-07-01').tier === 'stable');

const chenTriggers = getScoreDay('chen', '2026-07-18').triggers;
check('chen leadFired = 2026-07-07', chenTriggers.leadFired === '2026-07-07');
check('chen bodyConfirmed = 2026-07-09', chenTriggers.bodyConfirmed === '2026-07-09');
check('chen personalCatch = 2026-07-18', chenTriggers.personalCatch === '2026-07-18');

const chenJul18Drivers = getScoreDay('chen', '2026-07-18').drivers;
const chenTop3 = chenJul18Drivers.slice(0, 3).map((d) => d.id);
check(
  `chen 2026-07-18 top3 drivers = [after-hours, hrv, levo-gap], got [${chenTop3.join(', ')}]`,
  chenTop3[0] === 'after-hours' && chenTop3[1] === 'hrv' && chenTop3[2] === 'levo-gap',
);

// ————————————————————————————————————————————————————————————————
// Okafor — closed-loop arc (task-directed calibration targets)
// ————————————————————————————————————————————————————————————————
const okaforAnchors: [string, number][] = [
  ['2026-06-30', 71], ['2026-07-09', 39], ['2026-07-18', 31],
];
for (const [date, target] of okaforAnchors) {
  const day = getScoreDay('okafor', date);
  check(`okafor ${date} loadIndex ${day.loadIndex} within ±3 of ${target}`, within(day.loadIndex, target));
}
check('okafor 2026-07-18 tier stable', getScoreDay('okafor', '2026-07-18').tier === 'stable');
check('okafor leadFired = 2026-06-30', getScoreDay('okafor', '2026-07-18').triggers.leadFired === '2026-06-30');
check('okafor never has a personal field', getScoreDay('okafor', '2026-07-18').drivers.every((d) => d.tier !== 'personal'));

// ————————————————————————————————————————————————————————————————
// Patel — naive vs. beta-blocker-adjusted split
// ————————————————————————————————————————————————————————————————
const patelDay = getScoreDay('patel', '2026-07-18');
check(`patel 2026-07-18 loadIndex ${patelDay.loadIndex} within ±3 of 62`, within(patelDay.loadIndex, 62));
check('patel 2026-07-18 tier high', patelDay.tier === 'high');
check('patel has adjustment object on 2026-07-18', !!patelDay.adjustment);
if (patelDay.adjustment) {
  check(`patel naiveIndex ${patelDay.adjustment.naiveIndex} within ±3 of 38`, within(patelDay.adjustment.naiveIndex, 38));
  check('patel adjusted - naive >= 15 points', patelDay.loadIndex - patelDay.adjustment.naiveIndex >= 15);
}
check('patel personalCatch = 2026-07-17', getScoreDay('patel', '2026-07-17').triggers.personalCatch === '2026-07-17');
check('patel has no adjustment before catch (2026-07-10)', !getScoreDay('patel', '2026-07-10').adjustment);

// ————————————————————————————————————————————————————————————————
// Roster — nobody but Chen is Critical; roster stays in SPEC's 18–56 band
// ————————————————————————————————————————————————————————————————
const rosterIds = ['kim', 'nakamura', 'webb', 'hussein', 'rahman', 'osei', 'obrien', 'voss', 'park', 'ellis', 'jimenez'];
check('roster has exactly 11 clinicians', rosterIds.length === 11);
for (const id of rosterIds) {
  const day = getScoreDay(id, '2026-07-18');
  check(`roster ${id} loadIndex ${day.loadIndex} in [18, 56]`, day.loadIndex >= 18 && day.loadIndex <= 56);
  check(`roster ${id} is not critical`, day.tier !== 'critical');
}
const roster2to3Locked = rosterIds.filter((id) => getScoreDay(id, '2026-07-18').drivers.some((d) => d.tier !== 'workload'));
check(`2-3 roster clinicians show a private factor, got ${roster2to3Locked.length} (${roster2to3Locked.join(', ')})`, roster2to3Locked.length >= 2 && roster2to3Locked.length <= 3);

const chenSeries = getScoreSeries('chen');
check('nobody outside chen ever reaches critical on 2026-07-18', ['patel', 'okafor', ...rosterIds].every((id) => getScoreDay(id, '2026-07-18').tier !== 'critical'));
check('chen 21-day+ series exists (through verification window)', chenSeries.length >= 21);

// ————————————————————————————————————————————————————————————————
// Privacy wall — admin payloads must never carry Tier-2/3 substrings
// ————————————————————————————————————————————————————————————————
const adminRoster = getAdminRoster('2026-07-18');
const adminProfiles = ['chen', 'patel', 'okafor', ...rosterIds].map((id) => getAdminProfile(id, '2026-07-18'));
const adminJson = JSON.stringify(adminRoster) + JSON.stringify(adminProfiles);

const forbidden = ['hrvRmssd', 'sleepH', 'medications', 'lastPcpVisit', 'levothyroxine', 'metoprolol'];
for (const term of forbidden) {
  check(`admin payload JSON never contains "${term}"`, !adminJson.toLowerCase().includes(term.toLowerCase()));
}
check('chen admin profile shows locked factors', getAdminProfile('chen', '2026-07-18').lockedFactorCount >= 2);
check('patel admin profile shows exactly 1 locked factor', getAdminProfile('patel', '2026-07-18').lockedFactorCount === 1);
check('admin roster has all 14 clinicians', adminRoster.length === 14);

// ————————————————————————————————————————————————————————————————
console.log('');
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log('All anchor checks passed.');
}
