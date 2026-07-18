// components/home/LoopCard.tsx — right rail: the agent's loop, visible. Detect →
// Understand → Act → Verify with live states; shows the "verified" note once a
// loop has closed (the mockup's "last time the loop closed" moment).
'use client';

import { Check, CircleDashed } from 'lucide-react';
import type { LoopStatus } from '@/lib/coach';
import { formatDateShort } from '@/components/lib/format';

export function LoopCard({ loop }: { loop: LoopStatus }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        Sentinel’s loop
      </h3>
      <ol className="mt-3">
        {loop.steps.map((step, i) => {
          const last = i === loop.steps.length - 1;
          return (
            <li key={step.label} className="relative flex gap-2.5 pb-4 last:pb-0">
              {!last && (
                <span className="absolute left-[9px] top-5 h-[calc(100%-14px)] w-px bg-stone-200" />
              )}
              {step.state === 'done' ? (
                <span className="z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : step.state === 'active' ? (
                <span className="z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-stone-900">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                </span>
              ) : (
                <span className="z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-dashed border-stone-300 bg-white text-stone-300">
                  <CircleDashed className="h-3 w-3" />
                </span>
              )}
              <div className="min-w-0">
                <p className="flex items-baseline gap-1.5 text-xs font-semibold text-stone-800">
                  {step.label}
                  <span className="text-[10px] font-medium text-stone-400">
                    {step.state === 'scheduled' ? `· ${formatDateShort(step.date)}` : formatDateShort(step.date)}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-stone-400">{step.note}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {loop.closedNote && (
        <div className="mt-3 rounded-xl bg-emerald-50 p-2.5">
          <p className="flex items-start gap-1.5 text-[11px] font-medium leading-snug text-emerald-700">
            <Check className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={3} />
            {loop.closedNote}
          </p>
        </div>
      )}
    </div>
  );
}
