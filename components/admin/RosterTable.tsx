// components/admin/RosterTable.tsx — the roster: sortable by loadIndex desc by
// default, row click opens the redacted profile.
'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';
import type { AdminRosterRow } from '@/lib/types';
import { Sparkline } from '@/components/ui/Sparkline';
import { ScorePill } from '@/components/ui/ScorePill';
import { TrajectoryArrow } from '@/components/ui/TrajectoryArrow';
import { TIER_META } from '@/lib/branding';
import { pluralize } from '@/components/lib/format';

export function RosterTable({
  roster,
  onSelect,
}: {
  roster: AdminRosterRow[];
  onSelect: (clinicianId: string) => void;
}) {
  const [desc, setDesc] = useState(true);

  const sorted = useMemo(
    () => [...roster].sort((a, b) => (desc ? b.loadIndex - a.loadIndex : a.loadIndex - b.loadIndex)),
    [roster, desc],
  );

  if (roster.length === 0) {
    return <p className="rounded-2xl border border-stone-200 bg-white p-6 text-center text-sm text-stone-400">No roster data yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-100 text-left text-xs font-medium uppercase tracking-wide text-stone-400">
            <th className="px-4 py-3">Clinician</th>
            <th className="px-4 py-3">Unit</th>
            <th className="px-4 py-3">Tier</th>
            <th className="px-4 py-3">
              <button onClick={() => setDesc((v) => !v)} className="inline-flex items-center gap-1 hover:text-stone-600">
                Load index
                {desc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </button>
            </th>
            <th className="px-4 py-3">21-day trend</th>
            <th className="px-4 py-3">Visible drivers</th>
            <th className="px-4 py-3">Private</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.clinicianId}
              onClick={() => onSelect(row.clinicianId)}
              className="cursor-pointer border-b border-stone-50 transition-colors last:border-none hover:bg-stone-50"
            >
              <td className="px-4 py-3">
                <p className="font-medium text-stone-800">{row.name}, {row.credentials}</p>
                <p className="text-xs text-stone-400">{row.specialty}</p>
              </td>
              <td className="px-4 py-3 text-stone-500">{row.unit}</td>
              <td className="px-4 py-3">
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: TIER_META[row.tier].soft, color: TIER_META[row.tier].color }}
                >
                  {TIER_META[row.tier].label}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <ScorePill loadIndex={row.loadIndex} tier={row.tier} size="sm" />
                  <TrajectoryArrow trajectory={row.trajectory} />
                </div>
              </td>
              <td className="w-24 px-4 py-3">
                <Sparkline data={row.spark} color={TIER_META[row.tier].color} height={26} showEndDot={false} />
              </td>
              <td className="px-4 py-3 text-xs text-stone-500">
                {row.visibleDrivers.slice(0, 2).map((d) => d.label).join(' · ') || '—'}
              </td>
              <td className="px-4 py-3">
                {row.lockedFactorCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                    <Lock className="h-3 w-3" />
                    {pluralize(row.lockedFactorCount, 'factor')}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
