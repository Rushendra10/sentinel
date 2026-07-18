// components/feed/AgentFeed.tsx — the right-rail agent activity feed: Sentinel ->
// Reasoner -> Skeptic -> Advocate -> Verifier, chronological, staggered reveal.
'use client';

import { Radio } from 'lucide-react';
import type { AgentEvent } from '@/lib/types';
import { AgentEventCard } from './AgentEventCard';

export function AgentFeed({ events }: { events: AgentEvent[] }) {
  const sorted = [...events].sort((a, b) => a.ts.localeCompare(b.ts));

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 px-1">
        <Radio className="h-4 w-4 text-stone-400" />
        <h2 className="text-sm font-semibold text-stone-900">Agent activity</h2>
      </div>
      {sorted.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-stone-400">
          No agent activity yet for this date.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((event, i) => (
            <AgentEventCard
              key={event.id}
              event={event}
              style={{ animationDelay: `${Math.min(i, 12) * 100}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
