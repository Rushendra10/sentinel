// lib/agents/canned/chen.ts — Dr. Maya Chen (ED attending). Loop stage: intervention
// fires TODAY (Jul 18) — the live demo spine. Catch: lapsed levothyroxine (Tier 3).
// See docs/SPEC.md §1 (anchor table) and §5 (agent architecture) for the facts this
// content must trace to. Do not invent clinical detail beyond the two vignettes below.

import type { AgentEvent, Artifact } from '../../types';

export const chenArtifacts: Artifact[] = [
  {
    id: 'chen-art-note-v1',
    type: 'note_draft',
    title: 'ED Note — 62M, Chest Pain (r/o ACS)',
    status: 'draft',
    bodyMd: `**Subjective:** 62-year-old male with a history of hypertension and hyperlipidemia presents with 2 hours of exertional substernal chest pressure, non-radiating, that resolved fully after sublingual nitroglycerin in the ED. Denies dyspnea, diaphoresis, or nausea at time of evaluation.

**Objective:** Vital signs stable on arrival. Serial troponins negative ×2 (0h/3h). ECG: nonspecific T-wave inversions, no ST-segment elevation. HEART score 4 (moderate risk).

**Assessment:** Chest pain, HEART score 4 — moderate risk for ACS. Rule-out ACS in progress.

**Plan:** Admit to observation unit; morning exercise stress test. Start aspirin 81 mg daily. Home beta-blocker held (heart rate 54 on arrival). Cardiology follow-up arranged prior to discharge.`,
    needsVerification: ['Home statin dose unconfirmed — reconcile with pharmacy record before discharge.'],
    meta: { queued: '9 more notes drafted and queued' },
  },
  {
    id: 'chen-art-note-v2',
    type: 'note_draft',
    title: 'ED Note — 34F, Asthma Exacerbation',
    status: 'draft',
    bodyMd: `**Subjective:** 34-year-old female with known asthma presents with 3 days of worsening wheeze and mild dyspnea following an upper respiratory infection. Denies fever or chest pain.

**Objective:** SpO2 94% on arrival, improved to 98% after two duonebulizer treatments and oral prednisone 60 mg. Peak flow improved from 65% to 85% of personal best over the course of the visit.

**Assessment:** Acute asthma exacerbation, URI-triggered, moderate severity — responding well to treatment.

**Plan:** Discharge home with a 5-day prednisone burst, albuterol MDI q4–6h PRN, and inhaled-corticosteroid adherence counseling. Return precautions reviewed with patient.`,
    needsVerification: ['Last controller-inhaler refill date unconfirmed.'],
    meta: { queued: '9 more notes drafted and queued' },
  },
  {
    id: 'chen-art-inbox',
    type: 'inbox_triage_plan',
    title: 'Inbox Triage — Jul 18',
    status: 'draft',
    bodyMd: `**14 routine items drafted for her one-tap review:**
- 6 normal-result notifications (labs, imaging) — replies drafted, ready to send
- 5 refill authorizations — routine, no dose changes
- 3 scheduling confirmations — routine follow-up bookings

**3 escalated directly to her — need clinical judgment:**
- Abnormal potassium on a recently discharged patient
- A colleague's coverage question for next week
- A patient message reporting new symptoms since discharge`,
    meta: { drafted: '14', escalated: '3' },
  },
  {
    id: 'chen-art-schedule',
    type: 'schedule_proposal',
    title: 'Recovery Block + Shift Relief',
    status: 'draft',
    bodyMd: `### Schedule Adjustment Proposal — Dr. Maya Chen, Emergency Medicine

**Requesting:**
- **Protected recovery block:** Thursday, Jul 23 — no clinical assignment, no on-call.
- **Shift relief:** Jul 19–20 — coverage requested from the float pool or a voluntary swap.

**Basis (workload facts only):** 14 consecutive days worked, after-hours documentation trending 40 → 140 min/night, note backlog at 11, two high-acuity events absorbed in the past 10 days.

This request is workload-driven. No clinical or personal health information is included.`,
  },
  {
    id: 'chen-art-refill',
    type: 'refill_request',
    title: 'Levothyroxine Refill — Her Pharmacy',
    status: 'draft',
    bodyMd: `**Patient:** Maya Chen
**Medication:** Levothyroxine 88 mcg, once daily
**Status:** Supply exhausted since approximately Jun 29 (last fill May 30, 30-day supply).

Prescriber renewal is required to process this refill. Flagging for pharmacist follow-up pending her upcoming PCP visit.`,
    meta: { medication: 'Levothyroxine 88 mcg', pharmacy: 'On file' },
  },
  {
    id: 'chen-art-pcp',
    type: 'pcp_appointment_draft',
    title: 'PCP Appointment — Dr. Priya Raman',
    status: 'draft',
    bodyMd: `**Provider:** Dr. Priya Raman, Internal Medicine
**Date:** Monday, Aug 3, 2026
**Time:** 2:00 PM
**Reason for visit:** Annual visit, overdue — last visit Feb 2024 (29 months ago). Requesting a TSH lab order given the lapsed levothyroxine therapy.

Submitted on Dr. Chen's behalf; awaiting her confirmation.`,
    meta: { provider: 'Dr. Priya Raman', date: '2026-08-03', time: '14:00' },
  },
  {
    id: 'chen-art-escalation',
    type: 'escalation_email',
    title: 'Escalation — Dr. James Whitfield, CMO',
    status: 'draft',
    bodyMd: `**To:** Dr. James Whitfield, Chief Medical Officer
**From:** Sentinel (on behalf of Dr. Maya Chen)
**Subject:** Coverage adjustment request — Dr. Chen, Emergency Medicine

Dr. Whitfield,

On behalf of Dr. Maya Chen, I'm flagging a sustained workload pattern that warrants a coverage adjustment.

- 14 consecutive days worked, covering a colleague's leave since Jul 5
- After-hours documentation climbing from 40 to 140 minutes per night
- Note backlog now at 11
- Two high-acuity events (patient deaths) absorbed in the past 10 days
- A dosing-order near-miss caught by pharmacy on Jul 14 — no harm, but a fatigue indicator

Requesting a coverage adjustment — additional relief shifts or a temporary reduction in her service block — at your discretion.

— Sentinel, on behalf of Dr. Maya Chen`,
    redactionManifest: {
      included: ['consecutive days worked', 'after-hours documentation trend', 'note backlog', 'acuity events'],
      excluded: ['all wearable data', 'all personal health records', 'all medication information'],
    },
    meta: { to: 'Dr. James Whitfield', title: 'Chief Medical Officer' },
  },
  {
    id: 'chen-art-careplan',
    type: 'care_plan',
    title: 'Care Plan — Chen, Maya, MD',
    status: 'draft',
    bodyMd: `# Care Plan — Chen, Maya, MD

**Assessment:** Pattern consistent with elevated burnout risk — occupational overload with physiological strain and a compounding personal-care lapse. A risk pattern, not a diagnosis.

**Interventions in progress:**
- 11 backlogged notes drafted for her sign-off (2 ready now, 9 queued)
- Inbox triaged: 14 routine items drafted, 3 escalated to her
- Protected recovery block (Jul 23) and shift relief (Jul 19–20) proposed to the scheduler
- Escalation to Dr. Whitfield prepared, consent-gated, workload facts only

**Personal health actions:**
- Levothyroxine 88 mcg refill sent to her pharmacy
- PCP appointment requested — Dr. Priya Raman, Aug 3 at 2:00 PM
- TSH recheck suggested at that visit

**Follow-up:** Sentinel re-checks your data on Jul 25 and Aug 1.

— Sentinel, your agent`,
  },
];

export const chenEvents: AgentEvent[] = [
  {
    id: 'chen-ev-01', ts: '2026-07-07T18:40:00-07:00', agent: 'sentinel', kind: 'finding',
    text: "Workload trajectory fired: after-hours charting up to 85 minutes tonight (+112% vs her baseline), note backlog at 6, third consecutive day worked. This is three days before either death — the record moved first.",
    refs: ['After-hours 85 min (+112%)', 'Backlog 6', 'Day 3 of stretch'],
  },
  {
    id: 'chen-ev-02', ts: '2026-07-09T08:05:00-07:00', agent: 'sentinel', kind: 'finding',
    text: "Body confirms the trend: HRV down 27% sustained across 3 days, sleep under 6.5 hours for 3 straight nights. Severity escalated. Two patient deaths (Jul 8, Jul 9) logged as acuity load on top of the existing trajectory.",
    refs: ['HRV −27% ×3d', 'Sleep <6.5h ×3', 'Deaths ×2 (Jul 8–9)'],
  },
  {
    id: 'chen-ev-03', ts: '2026-07-18T08:40:00-07:00', agent: 'reasoner', model: 'claude-sonnet-5', kind: 'reasoning',
    text: "Primary driver is after-hours documentation, now averaging 140 minutes a night. Compounding: two deaths absorbed in 48 hours, fourteen consecutive days worked, zero recovery blocks in that stretch. Body strain corroborates — HRV down 40% from baseline, sleep at 5.1 hours, resting heart rate up 9 beats. This isn't one bad night; it's three weeks with no floor under her.",
    refs: ['After-hours 140 min', 'HRV −40%', 'Sleep 5.1h', 'RHR +9', '14 consecutive days'],
  },
  {
    id: 'chen-ev-04', ts: '2026-07-18T08:47:00-07:00', agent: 'reasoner', model: 'claude-sonnet-5', kind: 'finding',
    text: "Cross-referencing her own record — a tier only she can share — turns up a levothyroxine fill gap of 19 days. Last fill May 30, a thirty-day supply, exhausted around Jun 29: the gap opens exactly where this episode begins. The renewal is blocked on an annual PCP visit, and she hasn't had one in 29 months; she canceled her March appointment for a shift swap and never rebooked. Untreated hypothyroid fatigue is compounding the occupational load — and it's invisible to any system not permitted to see her own chart.",
    refs: ['Levothyroxine gap 19d', 'Last fill May 30', 'Last PCP visit 29mo ago', 'Canceled Mar appt'],
  },
  {
    id: 'chen-ev-05', ts: '2026-07-18T08:52:00-07:00', agent: 'skeptic', model: 'claude-sonnet-5', kind: 'challenge',
    text: "Before this becomes the story: could this just be a normal on-service stretch for an EM attending covering a colleague's leave? Is there a seasonal census bump behind the after-hours climb? Is the pharmacy near-miss a single outlier rather than a pattern? And is the fatigue simply explained by workload alone, without reaching for a medication gap that wasn't part of the original trigger?",
    refs: ['On-service stretch?', 'Seasonal census?', 'Single outlier week?'],
  },
  {
    id: 'chen-ev-06', ts: '2026-07-18T08:56:00-07:00', agent: 'skeptic', model: 'claude-sonnet-5', kind: 'resolution',
    text: "The strongest alternative — an ordinary on-service stretch — fails on three facts: her trajectory exceeds every prior coverage block on record, the body signal kept declining through her one lighter day, and the symptom curve tracks the medication gap, not the schedule.",
    refs: ['Trajectory exceeds prior blocks', 'Decline persisted through lighter day', 'Curve tracks med gap'],
  },
  {
    id: 'chen-ev-07', ts: '2026-07-18T09:05:00-07:00', agent: 'advocate', model: 'claude-sonnet-5', kind: 'action',
    text: "Drafted a SOAP note for the 62-year-old chest-pain encounter — the first of 11 backlogged notes ready for her sign-off.",
    refs: ['11 notes queued'], artifactId: 'chen-art-note-v1',
  },
  {
    id: 'chen-ev-08', ts: '2026-07-18T09:06:00-07:00', agent: 'advocate', model: 'claude-sonnet-5', kind: 'action',
    text: "Drafted a SOAP note for the 34-year-old asthma-exacerbation encounter — second of 11; nine more drafted and queued behind it.",
    refs: ['9 more queued'], artifactId: 'chen-art-note-v2',
  },
  {
    id: 'chen-ev-09', ts: '2026-07-18T09:07:00-07:00', agent: 'advocate', model: 'claude-sonnet-5', kind: 'action',
    text: "Triaged her inbox: 14 routine items drafted for one-tap approval, 3 escalated directly to her.",
    refs: ['14 drafted', '3 escalated'], artifactId: 'chen-art-inbox',
  },
  {
    id: 'chen-ev-10', ts: '2026-07-18T09:08:00-07:00', agent: 'advocate', model: 'claude-sonnet-5', kind: 'action',
    text: "Proposed a protected recovery block for Thursday and shift relief for Jul 19–20 to the scheduling system — workload facts only.",
    refs: ['Recovery block Jul 23', 'Relief Jul 19–20'], artifactId: 'chen-art-schedule',
  },
  {
    id: 'chen-ev-11', ts: '2026-07-18T09:09:00-07:00', agent: 'advocate', model: 'claude-sonnet-5', kind: 'action',
    text: "Sent a levothyroxine 88 mcg refill request to her pharmacy, flagged for prescriber renewal.",
    refs: ['Levothyroxine 88mcg'], artifactId: 'chen-art-refill',
  },
  {
    id: 'chen-ev-12', ts: '2026-07-18T09:10:00-07:00', agent: 'advocate', model: 'claude-sonnet-5', kind: 'action',
    text: "Drafted a PCP appointment request — Dr. Priya Raman, Aug 3 at 2:00 PM, with a TSH recheck suggested.",
    refs: ['Aug 3, 2:00 PM'], artifactId: 'chen-art-pcp',
  },
  {
    id: 'chen-ev-13', ts: '2026-07-18T09:11:00-07:00', agent: 'advocate', model: 'claude-sonnet-5', kind: 'action',
    text: "Prepared a consent-gated escalation email to Dr. Whitfield — workload facts only, held for her review before sending.",
    refs: ['Consent-gated'], artifactId: 'chen-art-escalation',
  },
  {
    id: 'chen-ev-14', ts: '2026-07-18T09:12:00-07:00', agent: 'advocate', model: 'claude-sonnet-5', kind: 'action',
    text: "Assembled a Care Plan for her — the same document we'd hand a patient, addressed instead to the doctor.",
    refs: ['Care Plan assembled'], artifactId: 'chen-art-careplan',
  },
  {
    id: 'chen-ev-15', ts: '2026-07-25T09:00:00-07:00', agent: 'verifier', model: 'claude-sonnet-5', kind: 'verification',
    text: "Workload reversed: after-hours charting down 61% (140 → 55 min), note backlog cleared from 11 to 3, two recovery days taken (Jul 20, Jul 24).",
    refs: ['After-hours −61%', 'Backlog 11→3', 'Recovery days Jul 20 & 24'],
  },
  {
    id: 'chen-ev-16', ts: '2026-07-25T09:01:00-07:00', agent: 'verifier', model: 'claude-sonnet-5', kind: 'verification',
    text: "Body signal recovering: HRV up from 27 to 36 ms, sleep back to 6.9 hours. Personal-care loop closed — refill filled Jul 19, PCP visit booked for Aug 3.",
    refs: ['HRV 27→36 ms', 'Sleep 6.9h', 'Refill filled Jul 19', 'PCP booked Aug 3'],
  },
  {
    id: 'chen-ev-17', ts: '2026-07-25T09:02:00-07:00', agent: 'verifier', model: 'claude-sonnet-5', kind: 'verification',
    text: "Load Index 81 → 44 and still falling. Next check scheduled for Aug 1.",
    refs: ['Load Index 81→44'],
  },
];
