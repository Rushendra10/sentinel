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

export function DriverCard({ driver, footer }: { driver: Driver; footer?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex gap-3 p-4">
        <span className={`mt-0.5 w-1 shrink-0 rounded-full ${SEVERITY_BAR[driver.severity]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium text-stone-900 leading-snug">{driver.label}</p>
            <TierChip tierKey={driver.tier} />
          </div>
          <p className="mt-0.5 text-sm text-stone-500 leading-snug">{driver.detail}</p>
          <p className="mt-2 text-xs font-medium text-stone-400">{driver.deltaVsBaseline}</p>
        </div>
      </div>
      {footer && <div className="border-t border-stone-100 px-4 py-2.5">{footer}</div>}
    </div>
  );
}
