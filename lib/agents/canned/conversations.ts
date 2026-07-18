// lib/agents/canned/conversations.ts — the three rehearsed voice/chat utterances from
// SPEC §6. These are also the fuzzy-match fallback for /api/converse when there's no
// live key. encounterIds reference lib/api.getSchedule('chen', '2026-07-18') — that
// function is currently a data-workstream placeholder returning [], so real encounter
// ids don't exist yet. Using 'enc-07' and 'enc-12' as the two flexible, low-acuity
// follow-ups per the orchestrator's fallback instruction; reused across the alvarez and
// budget effects so the two "already telehealth-consented" patients are the same people.

import type { CannedConversation } from '../../types';

export const cannedConversations: CannedConversation[] = [
  {
    key: 'alvarez',
    utterance: "Mrs. Alvarez has been waiting weeks to see me and she's important to me — can I see her and still get out on time?",
    response: {
      reply: "Yes — keep her 4:30. I can move your two flexible, low-acuity follow-ups into Dr. Kim's open slots tomorrow; you'd be out by 6:15. Want me to?",
      effect: {
        kind: 'reschedule',
        encounterIds: ['enc-07', 'enc-12'],
        summary: "Moved two low-acuity follow-ups to Dr. Kim's open slots tomorrow, so Rosa Alvarez keeps her 4:30 visit and you're still out by 6:15.",
      },
    },
  },
  {
    key: 'budget',
    utterance: 'How many patients can I actually take today?',
    response: {
      reply: "You're booked for 19. Your recovery-adjusted budget is 14. Here are five safe deferrals — two of them already agreed to a telehealth follow-up.",
      effect: {
        kind: 'budget',
        booked: 19,
        recommended: 14,
        deferralIds: ['enc-03', 'enc-05', 'enc-07', 'enc-09', 'enc-12'],
        summary: 'Five low-acuity encounters flagged as safe deferrals for today; two are already telehealth-consented.',
      },
    },
  },
  {
    key: 'email',
    utterance: "Send an email to the department chief — let them know I'm close to burnout so they can adjust my shifts.",
    response: {
      reply: "This draft includes only your workload data — consecutive days worked, the after-hours trend, and your note backlog. None of your health information leaves this room. Sending it to Dr. Whitfield now.",
      effect: {
        kind: 'email',
        email: {
          id: 'chen-email-voice',
          from: 'Sentinel (on behalf of Dr. Maya Chen)',
          to: 'Dr. James Whitfield, Chief Medical Officer',
          sentAt: '2026-07-18T17:45:00-07:00',
          subject: 'Coverage adjustment request — Dr. Chen, Emergency Medicine',
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
        },
      },
    },
  },
];
