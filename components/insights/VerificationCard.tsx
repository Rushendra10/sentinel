// components/insights/VerificationCard.tsx — the loop closes here. Scheduled
// state before the verify date; the proud delta + verifier log after.
'use client';

import { Clock, CheckCheck, ArrowDown } from 'lucide-react';
import type { AgentEvent } from '@/lib/types';
import { formatDateMedium } from '@/components/lib/format';

export function VerificationCard({
  verified,
  verifyDate,
  peak,
  verifiedValue,
  events,
}: {
  verified: boolean;
  verifyDate?: string;
  peak?: number;
  verifiedValue?: number;
  events: AgentEvent[];
}) {
  if (!verified) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-400">
          <Clock className="h-4.5 w-4.5" />
        </span>
        <p className="text-sm text-stone-500">
          Sentinel re-checks your data on {verifyDate ? formatDateMedium(verifyDate) : 'the scheduled date'} to confirm the load actually dropped.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <CheckCheck className="h-4 w-4" />
        Verified {verifyDate && formatDateMedium(verifyDate)}
      </div>
      {peak !== undefined && verifiedValue !== undefined && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-4xl font-semibold tabular-nums text-stone-400">{peak}</span>
          <ArrowDown className="h-6 w-6 text-emerald-500" />
          <span className="text-4xl font-semibold tabular-nums text-emerald-600">{verifiedValue}</span>
        </div>
      )}
      {events.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-emerald-100 pt-3">
          {events.map((e) => (
            <li key={e.id} className="text-sm leading-relaxed text-emerald-800">• {e.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
