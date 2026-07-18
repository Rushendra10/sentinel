// lib/agents/canned/patel.ts — Dr. Anand Patel (hospitalist). Loop stage: detected
// yesterday (Jul 17), contextualized, monitoring. Catch: medication-masked vitals —
// metoprolol caps his heart-rate response, so his wearable reads "excellent" while
// Sentinel's medicated-baseline recalibration reads High and rising. See SPEC §1 case 2.

import type { AgentEvent, Artifact } from '../../types';

export const patelArtifacts: Artifact[] = [
  {
    id: 'patel-art-cap',
    type: 'schedule_proposal',
    title: 'Census Relief — Cap Admissions Tomorrow',
    status: 'draft',
    bodyMd: `### Census Relief Proposal — Cap New Admissions

Dr. Patel's service has grown from 14 to 22 patients over the past three weeks amid unit short-staffing. Proposing a cap on new admissions to his service for tomorrow (Jul 18) at his current census, routing new admissions to the on-call hospitalist float instead.

**Basis:** after-hours charting up from 35 to 85 minutes a night, inbox response latency doubling, sustained census growth with no relief built in.`,
  },
  {
    id: 'patel-art-redistribute',
    type: 'schedule_proposal',
    title: 'Census Relief — Redistribute 4 Stable Patients',
    status: 'draft',
    bodyMd: `### Census Relief Proposal — Redistribute Stable Patients

Proposing redistribution of 4 clinically stable patients from Dr. Patel's service to a colleague with lower census, effective tomorrow's rounds. Candidates were selected for stability and low anticipated complexity.

This brings his active census from 22 toward a sustainable range without disrupting continuity for his higher-acuity patients.`,
  },
];

export const patelEvents: AgentEvent[] = [
  {
    id: 'patel-ev-01', ts: '2026-07-17T07:30:00-07:00', agent: 'sentinel', kind: 'finding',
    text: "Census climbing: 14 to 22 patients per day over three weeks amid unit short-staffing. After-hours charting up 143% (35 → 85 min), inbox response latency doubling. Raw body-strain reading: mild.",
    refs: ['Census 14→22', 'After-hours +143%', 'Inbox latency ×2', 'Raw strain: mild'],
  },
  {
    id: 'patel-ev-02', ts: '2026-07-17T07:35:00-07:00', agent: 'reasoner', model: 'claude-sonnet-5', kind: 'finding',
    text: "His wearable reports resting heart rate 58–62 — \"excellent,\" all month. But his record, visible only to him, lists metoprolol 50 mg for hypertension. Beta-blockade caps heart-rate response, so a resting-HR-derived strain reading can't be taken at face value here. Recalibrating against his medicated baseline moves this from the 40th percentile to the 88th. Naive Load Index 38 becomes an adjusted 62 — and it's rising.",
    refs: ['RHR 58–62 "excellent"', 'Metoprolol 50mg', '40th → 88th percentile', 'Naive 38 → Adjusted 62'],
  },
  {
    id: 'patel-ev-03', ts: '2026-07-17T07:40:00-07:00', agent: 'skeptic', model: 'claude-sonnet-5', kind: 'challenge',
    text: "Is this just a sensor artifact — a watch reading calm because the heart rate it measures can't climb, not because he's actually fine? Could this recalibration be overcorrecting on a single data point?",
    refs: ['Sensor artifact?', 'Single data point?'],
  },
  {
    id: 'patel-ev-04', ts: '2026-07-17T07:44:00-07:00', agent: 'skeptic', model: 'claude-sonnet-5', kind: 'resolution',
    text: "Rejected: a sensor artifact wouldn't also move his sleep and HRV in the same direction. Both corroborate the medicated-baseline reading independently of resting heart rate. Sustained — the recalibration holds.",
    refs: ['Sleep corroborates', 'HRV corroborates'],
  },
  {
    id: 'patel-ev-05', ts: '2026-07-17T07:50:00-07:00', agent: 'advocate', model: 'claude-sonnet-5', kind: 'action',
    text: "Proposed capping new admissions to his service tomorrow at his current census, routing overflow to the float pool.",
    refs: ['Cap at current census'], artifactId: 'patel-art-cap',
  },
  {
    id: 'patel-ev-06', ts: '2026-07-17T07:51:00-07:00', agent: 'advocate', model: 'claude-sonnet-5', kind: 'action',
    text: "Proposed redistributing 4 stable patients to a colleague with lower census.",
    refs: ['4 patients redistributed'], artifactId: 'patel-art-redistribute',
  },
  {
    id: 'patel-ev-07', ts: '2026-07-17T08:00:00-07:00', agent: 'sentinel', kind: 'finding',
    text: "Status: two census-relief actions proposed and pending review; monitoring active. Next check scheduled Jul 24.",
    refs: ['2 actions pending', 'Next check Jul 24'],
  },
];
