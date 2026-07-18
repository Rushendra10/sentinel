// lib/agents/live.ts — live Claude calls for the agent pipeline (reasoner → skeptic →
// advocate) and the voice/chat copilot (converse). Every call is wrapped in a 6s
// timeout + try/catch; ANY failure at ANY step returns null so callers fall back to the
// canned content in lib/agents/canned.ts. Skips straight to null — no API call at all —
// when ANTHROPIC_API_KEY is absent or DEMO_MODE=cached is set. See docs/SPEC.md §5.

import Anthropic from '@anthropic-ai/sdk';
import { randomUUID } from 'crypto';
import { DEMO } from '../branding';
import { getAgentContext, getSchedule } from '../api';
import type { AgentEvent, Artifact, ArtifactType, CannedRun, ConverseReply } from '../types';
import {
  ADVOCATE_SYSTEM_PROMPT,
  CONVERSE_SYSTEM_PROMPT,
  REASONER_SYSTEM_PROMPT,
  SKEPTIC_SYSTEM_PROMPT,
} from './prompts';

const MODEL = 'claude-sonnet-5';
const TIMEOUT_MS = 6000;

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

/** No key, or DEMO_MODE=cached forcing canned even with a key present. */
function hasLiveKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY) && process.env.DEMO_MODE !== 'cached';
}

// ————————————————————————————————————————————————————————————————
// Forced-JSON tool schemas — one tool per stage, tool_choice pins the model to it.
// ————————————————————————————————————————————————————————————————

interface ToolDef {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
}

const REASONER_TOOL: ToolDef = {
  name: 'submit_reasoning',
  description: 'Submit the primary-driver reasoning and any private-tier catch for this clinician.',
  input_schema: {
    type: 'object',
    properties: {
      reasoningText: { type: 'string', description: 'Primary driver + compounders, plain language, one short paragraph.' },
      reasoningRefs: { type: 'array', items: { type: 'string' }, description: 'Short metric chips, e.g. "After-hours 140 min".' },
      catchText: { type: 'string', description: 'The private-tier catch, if consented personal data explains or worsens the pattern. Empty string if none.' },
      catchRefs: { type: 'array', items: { type: 'string' } },
    },
    required: ['reasoningText', 'reasoningRefs', 'catchText', 'catchRefs'],
    additionalProperties: false,
  },
};

const SKEPTIC_TOOL: ToolDef = {
  name: 'submit_skeptic_review',
  description: 'Submit the adversarial challenge and the resulting verdict.',
  input_schema: {
    type: 'object',
    properties: {
      challengeText: { type: 'string' },
      resolutionText: { type: 'string' },
      sustained: { type: 'boolean' },
    },
    required: ['challengeText', 'resolutionText', 'sustained'],
    additionalProperties: false,
  },
};

const ARTIFACT_TYPES: ArtifactType[] = [
  'note_draft', 'inbox_triage_plan', 'schedule_proposal', 'refill_request',
  'pcp_appointment_draft', 'escalation_email', 'care_plan',
];

const ADVOCATE_TOOL: ToolDef = {
  name: 'submit_artifacts',
  description: 'Submit the drafted intervention artifacts sized to the sustained finding.',
  input_schema: {
    type: 'object',
    properties: {
      artifacts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ARTIFACT_TYPES },
            title: { type: 'string' },
            bodyMd: { type: 'string' },
            actionText: { type: 'string', description: 'One sentence describing the action, for the feed event.' },
            needsVerification: { type: 'array', items: { type: 'string' } },
            redactionIncluded: { type: 'array', items: { type: 'string' } },
            redactionExcluded: { type: 'array', items: { type: 'string' } },
          },
          required: ['type', 'title', 'bodyMd', 'actionText'],
        },
      },
    },
    required: ['artifacts'],
    additionalProperties: false,
  },
};

const CONVERSE_TOOL: ToolDef = {
  name: 'submit_reply',
  description: 'Submit the spoken/typed reply and any resulting side-effect.',
  input_schema: {
    type: 'object',
    properties: {
      reply: { type: 'string' },
      effectKind: { type: 'string', enum: ['none', 'reschedule', 'budget', 'email'] },
      encounterIds: { type: 'array', items: { type: 'string' } },
      booked: { type: 'number' },
      recommended: { type: 'number' },
      deferralIds: { type: 'array', items: { type: 'string' } },
      emailTo: { type: 'string' },
      emailSubject: { type: 'string' },
      emailBodyMd: { type: 'string' },
      redactionIncluded: { type: 'array', items: { type: 'string' } },
      redactionExcluded: { type: 'array', items: { type: 'string' } },
      summary: { type: 'string' },
    },
    required: ['reply', 'effectKind'],
    additionalProperties: false,
  },
};

// ————————————————————————————————————————————————————————————————
// Shared call helper — every Claude call goes through here: 6s timeout, try/catch,
// null on any failure (bad response shape, timeout, API error, network error).
// ————————————————————————————————————————————————————————————————

async function callTool<T>(system: string, userContent: string, tool: ToolDef): Promise<T | null> {
  if (!hasLiveKey()) return null;
  try {
    const client = getClient();
    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 1536,
        system,
        tools: [tool as unknown as Anthropic.Tool],
        tool_choice: { type: 'tool', name: tool.name },
        messages: [{ role: 'user', content: userContent }],
      },
      { timeout: TIMEOUT_MS },
    );
    const block = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === tool.name,
    );
    if (!block) return null;
    return block.input as T;
  } catch {
    return null;
  }
}

// ————————————————————————————————————————————————————————————————
// Pipeline: reasoner → skeptic → advocate
// ————————————————————————————————————————————————————————————————

interface ReasonerOut { reasoningText: string; reasoningRefs: string[]; catchText: string; catchRefs: string[] }
interface SkepticOut { challengeText: string; resolutionText: string; sustained: boolean }
interface AdvocateArtifactOut {
  type: ArtifactType; title: string; bodyMd: string; actionText: string;
  needsVerification?: string[]; redactionIncluded?: string[]; redactionExcluded?: string[];
}
interface AdvocateOut { artifacts: AdvocateArtifactOut[] }

/** Runs reasoner → skeptic → advocate live against getAgentContext(clinicianId, today).
 * Returns null (fall back to canned) if there's no key, DEMO_MODE=cached is set, or any
 * step in the chain fails or times out. */
export async function run(clinicianId: string): Promise<CannedRun | null> {
  if (!hasLiveKey()) return null;
  try {
    const context = getAgentContext(clinicianId, DEMO.today);
    const contextJson = JSON.stringify(context);

    const reasonerOut = await callTool<ReasonerOut>(REASONER_SYSTEM_PROMPT, contextJson, REASONER_TOOL);
    if (!reasonerOut) return null;

    const skepticInput = JSON.stringify({ context, reasoning: reasonerOut });
    const skepticOut = await callTool<SkepticOut>(SKEPTIC_SYSTEM_PROMPT, skepticInput, SKEPTIC_TOOL);
    if (!skepticOut) return null;

    const advocateInput = JSON.stringify({ context, reasoning: reasonerOut, skeptic: skepticOut });
    const advocateOut = await callTool<AdvocateOut>(ADVOCATE_SYSTEM_PROMPT, advocateInput, ADVOCATE_TOOL);
    if (!advocateOut) return null;

    return mapToRun(reasonerOut, skepticOut, advocateOut);
  } catch {
    return null;
  }
}

function mapToRun(reasonerOut: ReasonerOut, skepticOut: SkepticOut, advocateOut: AdvocateOut): CannedRun {
  const now = new Date().toISOString();
  const events: AgentEvent[] = [];
  const artifacts: Artifact[] = [];

  events.push({
    id: randomUUID(), ts: now, agent: 'reasoner', model: MODEL, kind: 'reasoning',
    text: reasonerOut.reasoningText, refs: reasonerOut.reasoningRefs,
  });
  if (reasonerOut.catchText) {
    events.push({
      id: randomUUID(), ts: now, agent: 'reasoner', model: MODEL, kind: 'finding',
      text: reasonerOut.catchText, refs: reasonerOut.catchRefs,
    });
  }
  events.push({
    id: randomUUID(), ts: now, agent: 'skeptic', model: MODEL, kind: 'challenge',
    text: skepticOut.challengeText,
  });
  events.push({
    id: randomUUID(), ts: now, agent: 'skeptic', model: MODEL, kind: 'resolution',
    text: skepticOut.resolutionText,
  });

  for (const a of advocateOut.artifacts) {
    const id = randomUUID();
    const artifact: Artifact = { id, type: a.type, title: a.title, bodyMd: a.bodyMd, status: 'draft' };
    if (a.needsVerification?.length) artifact.needsVerification = a.needsVerification;
    if (a.redactionIncluded?.length || a.redactionExcluded?.length) {
      artifact.redactionManifest = { included: a.redactionIncluded ?? [], excluded: a.redactionExcluded ?? [] };
    }
    artifacts.push(artifact);
    events.push({
      id: randomUUID(), ts: now, agent: 'advocate', model: MODEL, kind: 'action',
      text: a.actionText, artifactId: id,
    });
  }

  return { events, artifacts };
}

// ————————————————————————————————————————————————————————————————
// Converse (voice/chat copilot) — one-shot, no multi-turn tool loop.
// ————————————————————————————————————————————————————————————————

interface ConverseOut {
  reply: string; effectKind: 'none' | 'reschedule' | 'budget' | 'email';
  encounterIds?: string[]; booked?: number; recommended?: number; deferralIds?: string[];
  emailTo?: string; emailSubject?: string; emailBodyMd?: string;
  redactionIncluded?: string[]; redactionExcluded?: string[]; summary?: string;
}

/** One live Claude call with getSchedule + getAgentContext folded into the user turn.
 * Returns null (fall back to fuzzy-matched canned reply) on missing key, DEMO_MODE=cached,
 * or any failure. */
export async function converse(clinicianId: string, message: string): Promise<ConverseReply | null> {
  if (!hasLiveKey()) return null;
  try {
    const schedule = getSchedule(clinicianId, DEMO.today);
    const context = getAgentContext(clinicianId, DEMO.today);
    const userContent = JSON.stringify({ clinicianId, schedule, context, message });
    const out = await callTool<ConverseOut>(CONVERSE_SYSTEM_PROMPT, userContent, CONVERSE_TOOL);
    if (!out) return null;
    return mapConverseReply(clinicianId, out);
  } catch {
    return null;
  }
}

function mapConverseReply(clinicianId: string, out: ConverseOut): ConverseReply {
  if (out.effectKind === 'reschedule' && out.encounterIds?.length) {
    return {
      reply: out.reply,
      effect: { kind: 'reschedule', encounterIds: out.encounterIds, summary: out.summary ?? out.reply },
    };
  }
  if (out.effectKind === 'budget' && typeof out.booked === 'number' && typeof out.recommended === 'number') {
    return {
      reply: out.reply,
      effect: {
        kind: 'budget', booked: out.booked, recommended: out.recommended,
        deferralIds: out.deferralIds ?? [], summary: out.summary ?? out.reply,
      },
    };
  }
  if (out.effectKind === 'email' && out.emailTo && out.emailBodyMd) {
    return {
      reply: out.reply,
      effect: {
        kind: 'email',
        email: {
          id: randomUUID(),
          from: `Sentinel (on behalf of ${clinicianId === 'chen' ? 'Dr. Maya Chen' : clinicianId})`,
          to: out.emailTo,
          sentAt: new Date().toISOString(),
          subject: out.emailSubject ?? 'Workload update',
          bodyMd: out.emailBodyMd,
          redactionManifest: { included: out.redactionIncluded ?? [], excluded: out.redactionExcluded ?? [] },
        },
      },
    };
  }
  return { reply: out.reply };
}
