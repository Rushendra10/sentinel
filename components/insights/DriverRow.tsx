// components/insights/DriverRow.tsx — one driver in the full tiered list, with
// its own sparkline.
'use client';

import type { Driver } from '@/lib/types';
import { Sparkline } from '@/components/ui/Sparkline';
import { TIER_KEY_META } from '@/lib/branding';

const SEVERITY_DOT: Record<1 | 2 | 3, string> = {
  1: 'bg-stone-300',
  2: 'bg-amber-400',
  3: 'bg-red-400',
};

export function DriverRow({ driver }: { driver: Driver }) {
  const color = TIER_KEY_META[driver.tier].color;
  return (
    <div className="flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-stone-50">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOT[driver.severity]}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-stone-800">{driver.label}</p>
        <p className="truncate text-xs text-stone-400">{driver.detail}</p>
      </div>
      <span className="shrink-0 text-xs font-medium text-stone-500">{driver.deltaVsBaseline}</span>
      <div className="hidden w-20 shrink-0 sm:block">
        {driver.spark && <Sparkline data={driver.spark} color={color} height={28} showEndDot={false} />}
      </div>
    </div>
  );
}
