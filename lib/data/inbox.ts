// lib/data/inbox.ts — the seeded admin inbox. Okafor's Jul 2 escalation is
// historic: it already sits in the chief's inbox, timestamped, proving the loop
// ran once before "today." Chen's escalation (sent live during the demo) is
// appended at runtime by lib/store.ts, not here.

import type { InboxEmail } from '../types';
import { BRAND } from '../branding';

const OKAFOR_ESCALATION: InboxEmail = {
  id: 'inbox-okafor-2026-07-02',
  from: 'Sentinel (on behalf of Dr. Sarah Okafor)',
  to: `${BRAND.admin.name}, ${BRAND.admin.title}`,
  sentAt: '2026-07-02T20:15:00-07:00',
  subject: 'Elevated workload risk — Dr. Sarah Okafor, ICU',
  bodyMd: [
    'Dr. Whitfield,',
    '',
    'Sentinel has flagged a pattern consistent with elevated burnout risk for Dr. Sarah Okafor (ICU), and she has consented to share this workload summary with your office.',
    '',
    '- **11 consecutive days worked**, no recovery day in the trailing week',
    '- **Two patient deaths within 48 hours** (Jun 30, Jul 1) attributed to her service',
    '- **After-hours documentation averaging 120 minutes/night**, well above her own baseline',
    '',
    'She is requesting coverage relief to allow a recovery block in the coming days.',
    '',
    '— Sentinel, on behalf of Dr. Okafor',
  ].join('\n'),
  redactionManifest: {
    included: ['Consecutive days worked (11)', 'After-hours documentation trend', 'Note backlog', 'Acuity events (2 deaths, 48h)'],
    excluded: ['All wearable data', 'All personal health records'],
  },
};

export function getSeededInboxEmails(): InboxEmail[] {
  return [OKAFOR_ESCALATION];
}
