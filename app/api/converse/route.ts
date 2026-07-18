// app/api/converse/route.ts — POST { clinicianId, message } → { reply, effect? }.
// With a live key: one Claude call (getSchedule + getAgentContext folded into the
// prompt), falling back to the fuzzy keyword match on any failure. Without a key, or
// with DEMO_MODE=cached: fuzzy-matches the message against the three canned
// conversations. Deliberately simple — one shot, no multi-turn tool loop. See
// docs/SPEC.md §6 (voice) and §9 (API surface).

import { NextResponse } from 'next/server';
import { getCannedConversations } from '../../../lib/agents/canned';
import { converse as converseLive } from '../../../lib/agents/live';
import type { CannedConversation, ConverseReply } from '../../../lib/types';

const ALVAREZ_KEYWORDS = ['alvarez', 'wrap up', 'wrap-up', 'patient wrap'];
const BUDGET_KEYWORDS = ['how many', 'budget', 'prioritize', 'prioritise'];
const EMAIL_KEYWORDS = ['email', 'chief', 'notify', 'escalat'];

function findByKey(conversations: CannedConversation[], key: CannedConversation['key']): ConverseReply | undefined {
  return conversations.find((c) => c.key === key)?.response;
}

/** Keyword fuzzy-match against the three rehearsed conversations from SPEC §6. Falls
 * back to a generic hint reply if nothing matches — the demo's three utterances are
 * rehearsed almost verbatim, so this rarely misses in practice. */
function fuzzyMatch(message: string): ConverseReply {
  const m = message.toLowerCase();
  const conversations = getCannedConversations();

  if (ALVAREZ_KEYWORDS.some((k) => m.includes(k))) {
    const reply = findByKey(conversations, 'alvarez');
    if (reply) return reply;
  }
  if (BUDGET_KEYWORDS.some((k) => m.includes(k))) {
    const reply = findByKey(conversations, 'budget');
    if (reply) return reply;
  }
  if (EMAIL_KEYWORDS.some((k) => m.includes(k))) {
    const reply = findByKey(conversations, 'email');
    if (reply) return reply;
  }

  return {
    reply: "I can help with your schedule, your recovery-adjusted load budget, or escalating to the chief — try asking about one of those.",
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = body as {
    clinicianId?: unknown; message?: unknown; date?: unknown;
    history?: { role?: unknown; text?: unknown }[];
  } | null;
  const clinicianId = parsed?.clinicianId;
  const message = parsed?.message;
  const date = typeof parsed?.date === 'string' ? parsed.date : undefined;
  const history = Array.isArray(parsed?.history)
    ? parsed.history
        .filter((h) => (h?.role === 'user' || h?.role === 'assistant') && typeof h?.text === 'string')
        .map((h) => ({ role: h.role as 'user' | 'assistant', text: h.text as string }))
    : [];

  if (typeof clinicianId !== 'string' || clinicianId.length === 0) {
    return NextResponse.json({ error: 'clinicianId is required' }, { status: 400 });
  }
  if (typeof message !== 'string' || message.length === 0) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const live = await converseLive(clinicianId, message, date, history);
  if (live) return NextResponse.json({ ...live, mode: 'live' });

  return NextResponse.json({ ...fuzzyMatch(message), mode: 'cached' });
}
