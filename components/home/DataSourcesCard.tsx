// components/home/DataSourcesCard.tsx — left rail: where Sentinel's signal comes
// from, per-source freshness, and the wear-your-watch nudge when data goes stale.
// Doubles as a quiet consent showcase (sources can be "Not connected · optional").
'use client';

import { Activity, CalendarDays, Watch, FileHeart, Lock } from 'lucide-react';
import type { DataSource } from '@/lib/coach';

const DOT: Record<DataSource['status'], string> = {
  fresh: 'bg-emerald-500',
  stale: 'bg-amber-500',
  off: 'bg-stone-300',
  adjusted: 'bg-violet-500',
};

const ICONS = [Activity, CalendarDays, Watch, FileHeart];

export function DataSourcesCard({
  sources,
  onOpenPrivacy,
}: {
  sources: DataSource[];
  onOpenPrivacy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
        Your data
      </h3>
      <ul className="mt-3 space-y-3">
        {sources.map((s, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <li key={s.name} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-medium text-stone-800">
                  {s.name}
                  <span className={`h-1.5 w-1.5 rounded-full ${DOT[s.status]}`} />
                </p>
                <p
                  className={`mt-0.5 text-[11px] leading-snug ${
                    s.status === 'stale' ? 'font-medium text-amber-600' : 'text-stone-400'
                  }`}
                >
                  {s.note}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
      <button
        onClick={onOpenPrivacy}
        className="mt-4 inline-flex items-center gap-1 border-t border-stone-100 pt-3 text-[11px] text-stone-400 transition-colors hover:text-stone-600"
      >
        <Lock className="h-3 w-3" />
        You choose what Sentinel sees
      </button>
    </div>
  );
}
