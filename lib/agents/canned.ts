// lib/agents/canned.ts — canned agent outputs: the demo's guaranteed-offline content.
// SIGNATURES ARE FROZEN. The agent-service workstream replaces the placeholder
// content below with the full, SPEC-faithful runs for chen / patel / okafor
// and the three rehearsed conversations.

import type { CannedConversation, CannedRun } from '../types';

const placeholder: CannedRun = {
  events: [
    {
      id: 'ev-1', ts: '2026-07-07T18:40:00-07:00', agent: 'sentinel', kind: 'finding',
      text: 'Workload trajectory rising 3 consecutive days — after-hours charting and backlog trending up with 3 consecutive days worked.',
      refs: ['After-hours 85 min', 'Backlog 6'],
    },
    {
      id: 'ev-2', ts: '2026-07-18T09:00:00-07:00', agent: 'reasoner', model: 'claude-sonnet-5', kind: 'reasoning',
      text: 'Primary driver: after-hours documentation, compounded by two patient deaths and fourteen consecutive days without recovery.',
    },
  ],
  artifacts: [
    {
      id: 'art-care-plan', type: 'care_plan', title: 'Care Plan — Chen, Maya, MD', status: 'draft',
      bodyMd: '**Placeholder** — replaced by the agent-service workstream.',
    },
  ],
};

export function getCannedRun(clinicianId: string): CannedRun {
  void clinicianId;
  return placeholder;
}

export function getCannedConversations(): CannedConversation[] {
  return [
    {
      key: 'email',
      utterance: 'Send an email to the department chief — let them know I am close to burnout so they can adjust my shifts.',
      response: { reply: 'Placeholder — replaced by the agent-service workstream.' },
    },
  ];
}
