// components/feed/AgentEventCard.tsx — one card in the agent activity feed.
// Challenge/resolution get the required disagree->resolve visual treatment;
// everything else stays quiet. Model badge makes Claude's work visible.
'use client';

import { Code, Brain, ShieldAlert, ClipboardCheck, CheckCheck, Mic } from 'lucide-react';
import type { AgentEvent, AgentName } from '@/lib/types';
import { Pill } from '@/components/ui/Pill';

const AGENT_META: Record<AgentName, { label: string; icon: typeof Code; color: string }> = {
  sentinel: { label: 'Sentinel', icon: Code, color: '#44403c' },
  reasoner: { label: 'Reasoner', icon: Brain, color: '#0284c7' },
  skeptic: { label: 'Skeptic', icon: ShieldAlert, color: '#d97706' },
  advocate: { label: 'Advocate', icon: ClipboardCheck, color: '#7c3aed' },
  verifier: { label: 'Verifier', icon: CheckCheck, color: '#059669' },
  converse: { label: 'Sentinel', icon: Mic, color: '#44403c' },
};

const KIND_BORDER: Record<AgentEvent['kind'], string> = {
  challenge: 'border-l-amber-500',
  resolution: 'border-l-emerald-500',
  finding: 'border-l-stone-200',
  reasoning: 'border-l-stone-200',
  action: 'border-l-sky-300',
  verification: 'border-l-emerald-300',
};

export function AgentEventCard({ event, style }: { event: AgentEvent; style?: React.CSSProperties }) {
  const meta = AGENT_META[event.agent];
  const Icon = meta.icon;

  return (
    <div
      className={`animate-[fadeInUp_320ms_ease-out_both] rounded-xl border-l-4 border border-stone-100 bg-stone-50/60 p-3 ${KIND_BORDER[event.kind]}`}
      style={style}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          <span className="text-sm font-semibold text-stone-800">{meta.label}</span>
          {event.model && (
            <Pill tone="ink" className="font-mono text-[10px] tracking-tight">{event.model}</Pill>
          )}
        </div>
        {event.kind === 'challenge' && (
          <Pill tone="amber" className="font-semibold tracking-wide">CHALLENGE</Pill>
        )}
        {event.kind === 'resolution' && (
          <Pill tone="emerald" className="font-semibold tracking-wide">RESOLVED</Pill>
        )}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{event.text}</p>
      {event.refs && event.refs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {event.refs.map((ref, i) => (
            <Pill key={i} tone="neutral" className="tabular-nums">{ref}</Pill>
          ))}
        </div>
      )}
    </div>
  );
}
