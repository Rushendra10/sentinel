// components/home/BoostsCard.tsx — right rail: things the doctor can DO right now,
// each with a score impact computed through the engine's own formula. Includes the
// unexplained-spike "tag it" card: wearable telemetry caught a strain event nobody
// logged; tagging it reclassifies unexplained load as explained and the score moves.
'use client';

import { Check, CalendarPlus, Wind, MoonStar, Zap } from 'lucide-react';
import type { BoostItem, SpikeCard } from '@/lib/coach';
import { useDemoStore } from '@/lib/store';

const KIND_ICON = { calendar: CalendarPlus, start: Wind, reminder: MoonStar } as const;

function fmtPts(pts: number): string {
  return `≈ −${Math.max(1, Math.round(pts))} pt${Math.round(pts) > 1 ? 's' : ''}`;
}

export function BoostsCard({ boosts, spike }: { boosts: BoostItem[]; spike: SpikeCard | null }) {
  const takenBoosts = useDemoStore((s) => s.takenBoosts);
  const takeBoost = useDemoStore((s) => s.takeBoost);
  const spikeTags = useDemoStore((s) => s.spikeTags);
  const tagSpike = useDemoStore((s) => s.tagSpike);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        Boost your score
      </h3>

      {spike && (
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50/50 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
              <Zap className="h-3.5 w-3.5 text-red-500" />
              Spike · {spike.window}
            </p>
            {!spikeTags[spike.id] && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                Unlogged
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-stone-500">{spike.detail}</p>
          {spikeTags[spike.id] ? (
            <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-emerald-50 p-2 text-[11px] font-medium leading-snug text-emerald-700">
              <Check className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={3} />
              Tagged “{spikeTags[spike.id]}” — reclassified as explained load · {fmtPts(spike.impactPts)}
            </p>
          ) : (
            <>
              <p className="mt-2 text-[11px] font-medium text-stone-700">{spike.question}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {spike.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => tagSpike(spike.id, opt)}
                    className="rounded-full border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-medium text-stone-600 transition-colors hover:border-stone-400 hover:bg-stone-50"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {boosts.map((b) => {
          const Icon = KIND_ICON[b.kind];
          const done = !!takenBoosts[b.id];
          return (
            <li key={b.id} className="flex flex-col rounded-xl border border-stone-100 bg-stone-50/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-stone-500 shadow-sm">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  {fmtPts(b.impactPts)}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium leading-snug text-stone-800">{b.label}</p>
              <p className="mt-0.5 flex-1 text-[11px] leading-snug text-stone-400">{b.sub}</p>
              <div className="mt-2.5">
                {done ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <Check className="h-3 w-3" strokeWidth={3} />
                    {b.doneLabel}
                  </span>
                ) : (
                  <button
                    onClick={() => takeBoost(b.id)}
                    className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[10px] font-semibold text-stone-600 transition-colors hover:border-stone-400 hover:bg-stone-50"
                  >
                    {b.ctaLabel}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 border-t border-stone-100 pt-3 text-[10px] leading-snug text-stone-400">
        Impacts are computed from your own baseline model — taking an action updates your score.
      </p>
    </div>
  );
}
