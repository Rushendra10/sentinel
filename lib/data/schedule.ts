// lib/data/schedule.ts — Chen's Jul 18 schedule, the ground truth the voice tools
// (get_today_schedule / propose_reschedule) operate on. SPEC §6 utterance 1 (the
// Rosa Alvarez negotiation) and utterance 2 (the budget/deferral list) both read
// directly off this list. Every other clinician/date combination is out of scope
// for the demo — an empty list is the honest answer.

import type { Encounter } from '../types';

const CHEN_JUL18: Encounter[] = [
  { id: 'chen-e1', time: '08:00', patient: 'Marcus Feldman', reason: 'Suture removal, right forearm', acuity: 'low', flexible: true, telehealthOk: true },
  { id: 'chen-e2', time: '08:30', patient: 'Linda Chu', reason: 'Post-concussion recheck', acuity: 'low', flexible: true },
  { id: 'chen-e3', time: '09:00', patient: 'Devon Walsh', reason: 'Asthma exacerbation follow-up', acuity: 'moderate', flexible: false },
  { id: 'chen-e4', time: '09:30', patient: 'Priya Sundaram', reason: 'Medication reconciliation', acuity: 'low', flexible: true, telehealthOk: true },
  { id: 'chen-e5', time: '10:00', patient: 'Harold Jennings', reason: 'Chest pain follow-up, non-cardiac', acuity: 'moderate', flexible: false },
  { id: 'chen-e6', time: '10:30', patient: 'Nia Thompson', reason: 'Ankle sprain recheck', acuity: 'low', flexible: true },
  { id: 'chen-e7', time: '11:00', patient: 'Carlos Medina', reason: 'Laceration recheck, left hand', acuity: 'low', flexible: false },
  { id: 'chen-e8', time: '11:30', patient: 'Wendy Park', reason: 'UTI follow-up', acuity: 'low', flexible: true },
  { id: 'chen-e9', time: '12:00', patient: 'Fatima Nasser', reason: 'Migraine follow-up', acuity: 'moderate', flexible: false },
  {
    id: 'chen-e10', time: '12:30', patient: 'Gregory Voss', reason: 'Fall-related contusion recheck',
    acuity: 'low', flexible: true, note: 'Movable to Dr. Kim’s open slots tomorrow',
  },
  { id: 'chen-e11', time: '13:00', patient: 'Simone Baptiste', reason: 'Abdominal pain follow-up', acuity: 'moderate', flexible: false },
  {
    id: 'chen-e12', time: '13:30', patient: 'Owen Whitfield', reason: 'Post-ED wound check',
    acuity: 'low', flexible: true, note: 'Movable to Dr. Kim’s open slots tomorrow',
  },
  { id: 'chen-e13', time: '14:00', patient: 'Renata Silva', reason: 'Syncope follow-up', acuity: 'high', flexible: false },
  { id: 'chen-e14', time: '14:30', patient: 'Trevor Lindqvist', reason: 'Dizziness follow-up', acuity: 'moderate', flexible: false },
  { id: 'chen-e15', time: '15:00', patient: 'Aaliyah Brooks', reason: 'Rib contusion recheck', acuity: 'low', flexible: false },
  { id: 'chen-e16', time: '15:30', patient: 'Benjamin Ortiz', reason: 'Post-fracture splint check', acuity: 'moderate', flexible: false },
  { id: 'chen-e17', time: '16:00', patient: 'Grace Ilunga', reason: 'Anxiety / panic follow-up', acuity: 'moderate', flexible: false },
  {
    id: 'chen-e18', time: '16:30', patient: 'Rosa Alvarez', reason: 'Follow-up for recurrent abdominal pain',
    acuity: 'moderate', flexible: false, note: 'Waited three weeks to see Dr. Chen specifically',
  },
  { id: 'chen-e19', time: '17:00', patient: 'Desmond Okoye', reason: 'Cellulitis recheck', acuity: 'high', flexible: false },
];

export function getScheduleFor(clinicianId: string, date: string): Encounter[] {
  if (clinicianId === 'chen' && date === '2026-07-18') return CHEN_JUL18;
  return [];
}
