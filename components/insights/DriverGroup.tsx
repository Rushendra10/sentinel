// components/insights/DriverGroup.tsx — a tier-grouped section of the full driver
// list, headed by the tier-privacy chip (long form).
'use client';

import type { Driver, TierKey } from '@/lib/types';
import { TierChip } from '@/components/ui/TierChip';
import { DriverRow } from './DriverRow';

export function DriverGroup({ tierKey, drivers }: { tierKey: TierKey; drivers: Driver[] }) {
  if (drivers.length === 0) return null;
  return (
    <div className="border-b border-stone-100 py-2 last:border-none">
      <div className="px-3 py-2">
        <TierChip tierKey={tierKey} variant="long" />
      </div>
      <div className="flex flex-col divide-y divide-stone-50">
        {drivers.map((d) => <DriverRow key={d.id} driver={d} />)}
      </div>
    </div>
  );
}
