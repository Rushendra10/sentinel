// components/ui/ScorePill.tsx — a compact tier-colored score readout, reused on
// headers, the privacy flip, and admin roster/profile views.
'use client';

import { TIER_META } from '@/lib/branding';
import type { RiskTier } from '@/lib/types';

export function ScorePill({ loadIndex, tier, size = 'md' }: { loadIndex: number; tier: RiskTier; size?: 'sm' | 'md' }) {
  const meta = TIER_META[tier];
  const pad = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5';
  const num = size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <div className={`inline-flex items-center gap-2 rounded-full ${pad}`} style={{ backgroundColor: meta.soft }}>
      <span className={`font-semibold tabular-nums ${num}`} style={{ color: meta.color }}>{loadIndex}</span>
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: meta.color }}>{meta.label}</span>
    </div>
  );
}
