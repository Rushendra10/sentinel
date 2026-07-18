// components/ui/AdjustmentPill.tsx — the "Adjusted from {naive}" pill shown when
// Sentinel has re-interpreted the score using Tier-3 context (Patel's beta-blocker
// recalibration). Reason is revealed on hover/click, never on score alone.
'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';

export function AdjustmentPill({ reason, naiveIndex }: { reason: string; naiveIndex: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-200 transition-colors hover:bg-violet-100"
      >
        <Lock className="h-3 w-3" strokeWidth={2.25} />
        Adjusted from {naiveIndex}
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-stone-200 bg-white p-3 text-xs leading-relaxed text-stone-600 shadow-lg animate-[fadeIn_150ms_ease-out]">
          {reason}
        </div>
      )}
    </div>
  );
}
