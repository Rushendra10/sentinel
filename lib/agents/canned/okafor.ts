// lib/agents/canned/okafor.ts — Dr. Sarah Okafor (ICU intensivist). Loop stage: CLOSED —
// verified recovery, the proof the loop works. Pure workload catch, no personal-health
// data at all — she declined Tier 3 and Sentinel still caught it. See SPEC §1 case 3.

import type { AgentEvent, Artifact } from '../../types';

export const okaforArtifacts: Artifact[] = [
  {
    id: 'okafor-art-notes',
    type: 'note_draft',
    title: '11 ICU Notes — Signed Jul 2',
    status: 'signed',
    bodyMd: `11 backlogged ICU notes from the Jun 30–Jul 2 stretch were drafted and signed the same day. Encounter-level detail is not reproduced here — this is a closed, historic record.`,
    meta: { count: '11', signedOn: '2026-07-02' },
  },
  {
    id: 'okafor-art-escalation',
    type: 'escalation_email',
    title: 'Escalation — Dr. James Whitfield, CMO',
    status: 'sent',
    bodyMd: `**To:** Dr. James Whitfield, Chief Medical Officer
**From:** Sentinel (on behalf of Dr. Sarah Okafor)
**Subject:** Coverage adjustment request — Dr. Okafor, ICU

Dr. Whitfield,

With Dr. Okafor's consent, I'm flagging a sustained workload pattern in the ICU that warrants a coverage adjustment.

- 11 consecutive days worked
- Two patient deaths absorbed within 48 hours (Jun 30, Jul 1)
- After-hours documentation at 120 minutes per night, with no recovery block in the stretch

Requesting a coverage adjustment at your discretion.

— Sentinel, on behalf of Dr. Sarah Okafor`,
    redactionManifest: {
      included: ['consecutive days worked', 'after-hours documentation trend', 'acuity events'],
      excluded: ['all wearable data', 'all personal health records'],
    },
    meta: { to: 'Dr. James Whitfield', title: 'Chief Medical Officer', sentOn: '2026-07-02' },
  },
  {
    id: 'okafor-art-coverage',
    type: 'schedule_proposal',
    title: 'Coverage Adjustment — Approved',
    status: 'approved',
    bodyMd: `### Coverage Adjustment — Approved

Following the Jul 2 escalation, ICU coverage was adjusted effective Jul 3: an additional intensivist shift was added to relieve Dr. Okafor's service block, and she took two recovery days (Jul 4–5).

**Status:** approved and completed.`,
  },
];

export const okaforEvents: AgentEvent[] = [
  {
    id: 'okafor-ev-01', ts: '2026-06-30T19:10:00-07:00', agent: 'sentinel', kind: 'finding',
    text: "Two patient deaths within 48 hours, an eleventh consecutive day worked, after-hours charting at 120 minutes a night. Workload trajectory crossed her personal threshold tonight.",
    refs: ['Deaths ×2 in 48h', '11 consecutive days', 'After-hours 120 min'],
  },
  {
    id: 'okafor-ev-02', ts: '2026-07-01T09:15:00-07:00', agent: 'reasoner', model: 'claude-sonnet-5', kind: 'reasoning',
    text: "Primary driver: back-to-back high-acuity losses compounding an eleven-day stretch with no recovery block. Body signal confirms — HRV down 38% from baseline, sleep at 5.3 hours. She has not connected her personal health record; this reasoning uses workload and wearable data only, and it's enough.",
    refs: ['HRV −38%', 'Sleep 5.3h', 'No personal-tier data'],
  },
  {
    id: 'okafor-ev-03', ts: '2026-07-02T10:00:00-07:00', agent: 'advocate', model: 'claude-sonnet-5', kind: 'action',
    text: "Drafted and same-day signed 11 backlogged ICU notes from the Jun 30–Jul 2 stretch.",
    refs: ['11 notes signed same day'], artifactId: 'okafor-art-notes',
  },
  {
    id: 'okafor-ev-04', ts: '2026-07-02T10:05:00-07:00', agent: 'advocate', model: 'claude-sonnet-5', kind: 'action',
    text: "With her consent, sent an escalation email to Dr. Whitfield — workload facts only.",
    refs: ['Consent given', 'Workload facts only'], artifactId: 'okafor-art-escalation',
  },
  {
    id: 'okafor-ev-05', ts: '2026-07-02T10:10:00-07:00', agent: 'advocate', model: 'claude-sonnet-5', kind: 'action',
    text: "Proposed a coverage adjustment to relieve her ICU service block.",
    refs: ['Coverage adjustment proposed'], artifactId: 'okafor-art-coverage',
  },
  {
    id: 'okafor-ev-06', ts: '2026-07-09T09:00:00-07:00', agent: 'verifier', model: 'claude-sonnet-5', kind: 'verification',
    text: "Score recovered 78 → 39, back to Stable. Coverage was adjusted Jul 3; she took two recovery days, Jul 4–5. After-hours and backlog are back near baseline.",
    refs: ['Load Index 78→39', 'Coverage adjusted Jul 3', 'Recovery days Jul 4–5'],
  },
  {
    id: 'okafor-ev-07', ts: '2026-07-09T09:02:00-07:00', agent: 'verifier', model: 'claude-sonnet-5', kind: 'verification',
    text: "She never connected her personal health record for this episode. Sentinel worked from workload and wearable data alone — and still caught it in time. Tiers are optional; the system still works.",
    refs: ['No personal tier connected'],
  },
];
