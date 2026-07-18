// components/admin/UnitStrip.tsx — average Load Index per unit, compact tiles.
'use client';

import type { AdminRosterRow } from '@/lib/types';
import { TIER_META } from '@/lib/branding';
import { avg, tierForLoadIndex } from '@/components/lib/format';

export function UnitStrip({ roster }: { roster: AdminRosterRow[] }) {
  const byUnit = new Map<string, number[]>();
  roster.forEach((r) => {
    const list = byUnit.get(r.unit) ?? [];
    list.push(r.loadIndex);
    byUnit.set(r.unit, list);
  });
  const units = [...byUnit.entries()].map(([unit, values]) => ({
    unit,
    avgLoad: Math.round(avg(values)),
    count: values.length,
  }));

  if (units.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {units.map((u) => {
        const meta = TIER_META[tierForLoadIndex(u.avgLoad)];
        return (
          <div
            key={u.unit}
            className="flex min-w-[140px] flex-1 items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <span className="h-9 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
            <div>
              <p className="text-xs font-medium text-stone-400">{u.unit} · {u.count} clinicians</p>
              <p className="text-2xl font-semibold tabular-nums text-stone-900">{u.avgLoad}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
