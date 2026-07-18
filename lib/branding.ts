// lib/branding.ts — product constants. Rename the product here and nowhere else.

export const BRAND = {
  name: 'Sentinel',
  tagline: 'It watches over the people who watch over everyone else.',
  closeLine: 'Because the doctor finally has a doctor.',
  hospital: 'Bayview General Medical Center',
  admin: { name: 'Dr. James Whitfield', title: 'Chief Medical Officer' },
  footer: 'All data synthetic · Sentinel demo · Abridge × Anthropic × Lightspeed hackathon 2026',
} as const;

export const DEMO = {
  start: '2026-06-28',
  today: '2026-07-18',
  verify: '2026-07-25',
  jumps: [
    { date: '2026-07-01', label: 'Baseline' },
    { date: '2026-07-07', label: 'Trigger' },
    { date: '2026-07-09', label: 'Body confirms' },
    { date: '2026-07-18', label: 'Today · Catch' },
    { date: '2026-07-25', label: 'Verified' },
  ],
  personas: ['chen', 'patel', 'okafor'],
} as const;

export const TIER_META = {
  stable: { label: 'Stable', color: '#059669', soft: '#ecfdf5' }, // emerald
  elevated: { label: 'Elevated', color: '#d97706', soft: '#fffbeb' }, // amber
  high: { label: 'High', color: '#ea580c', soft: '#fff7ed' }, // orange
  critical: { label: 'Critical', color: '#dc2626', soft: '#fef2f2' }, // red
} as const;

export const TIER_KEY_META = {
  workload: { label: 'Workload · shared with your hospital', short: 'Workload', color: '#0284c7' }, // sky
  body: { label: 'Body · private to you', short: 'Body', color: '#e11d48' }, // rose
  personal: { label: 'Personal health · private to you', short: 'Personal', color: '#7c3aed' }, // violet
} as const;
