// lib/agents/canned.ts — canned agent outputs: the demo's guaranteed-offline content.
// SIGNATURES ARE FROZEN: getCannedRun(clinicianId), getCannedConversations().
// Content lives in lib/agents/canned/*.ts — one module per case, plus the three
// rehearsed voice/chat conversations. See docs/SPEC.md §1, §5, §6.

import type { CannedConversation, CannedRun } from '../types';
import { chenArtifacts, chenEvents } from './canned/chen';
import { patelArtifacts, patelEvents } from './canned/patel';
import { okaforArtifacts, okaforEvents } from './canned/okafor';
import { cannedConversations } from './canned/conversations';

const RUNS: Record<string, CannedRun> = {
  chen: { events: chenEvents, artifacts: chenArtifacts },
  patel: { events: patelEvents, artifacts: patelArtifacts },
  okafor: { events: okaforEvents, artifacts: okaforArtifacts },
};

/** Returns the pre-generated, SPEC-faithful agent run for a clinician. Unknown ids get an
 * empty run rather than a throw — the roster's 11 other clinicians have no scripted run. */
export function getCannedRun(clinicianId: string): CannedRun {
  return RUNS[clinicianId] ?? { events: [], artifacts: [] };
}

/** The three rehearsed voice/chat utterances from SPEC §6 — also the fuzzy-match
 * fallback contract for POST /api/converse. */
export function getCannedConversations(): CannedConversation[] {
  return cannedConversations;
}
