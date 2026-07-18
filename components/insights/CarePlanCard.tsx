// components/insights/CarePlanCard.tsx — the punchline artifact: a care plan
// document rendered for the doctor, in the doctor's own product's voice.
'use client';

import { Stamp } from 'lucide-react';
import type { Artifact } from '@/lib/types';
import { Markdown } from '@/components/ui/Markdown';

export function CarePlanCard({ artifact }: { artifact: Artifact }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-stone-400">
            Sentinel · Clinical Wellness
          </p>
          <h3 className="mt-1 font-serif text-2xl text-stone-900">{artifact.title}</h3>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-50 text-stone-400">
          <Stamp className="h-5 w-5" />
        </span>
      </div>
      <div className="pt-4 font-serif">
        <Markdown content={artifact.bodyMd} className="[&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-stone-700 [&_li]:text-[15px] [&_li]:text-stone-700" />
      </div>
      <p className="mt-6 border-t border-stone-100 pt-4 text-right font-serif italic text-stone-500">
        — Sentinel, your agent
      </p>
    </div>
  );
}
