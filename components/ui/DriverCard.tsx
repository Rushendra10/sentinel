// components/ui/DriverCard.tsx — a single driver rendered as a clean card, used
// for the home page's "what is driving this" top-3.
'use client';

import type { Driver } from '@/lib/types';
import { TierChip } from './TierChip';

const SEVERITY_BAR: Record<1 | 2 | 3, string> = {
  1: 'bg-stone-300',
  2: 'bg-amber-400',
  3: 'bg-red-400',
};

export function DriverCard({ driver }: { driver: Driver }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <span className={`mt-0.5 w-1 shrink-0 rounded-full ${SEVERITY_BAR[driver.severity]}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium text-stone-900 leading-snug">{driver.label}</p>
        </div>
        <p className="mt-0.5 text-sm text-stone-500 leading-snug">{driver.detail}</p>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="text-xs font-medium text-stone-400">{driver.deltaVsBaseline}</span>
          <TierChip tierKey={driver.tier} />
        </div>
      </div>
    </div>
  );
}
