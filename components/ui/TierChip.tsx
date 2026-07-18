// components/ui/TierChip.tsx — the tier-privacy chip used everywhere a driver or
// group needs to say who can see it. Icon + label always together (status colors
// are never carried by hue alone).
'use client';

import { Building2, Lock, Heart, Shield } from 'lucide-react';
import type { TierKey } from '@/lib/types';
import { TIER_KEY_META } from '@/lib/branding';

const TIER_KEY_STYLE: Record<TierKey, { bg: string; text: string; ring: string }> = {
  workload: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' },
  body: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
  personal: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200' },
};

function TierIcon({ tierKey, className }: { tierKey: TierKey; className?: string }) {
  if (tierKey === 'workload') return <Building2 className={className} strokeWidth={2} />;
  if (tierKey === 'body') return <Heart className={className} strokeWidth={2} />;
  return <Shield className={className} strokeWidth={2} />;
}

export function TierChip({
  tierKey,
  variant = 'short',
  className = '',
}: {
  tierKey: TierKey;
  variant?: 'short' | 'long';
  className?: string;
}) {
  const style = TIER_KEY_STYLE[tierKey];
  const meta = TIER_KEY_META[tierKey];
  const label = variant === 'long' ? meta.label : meta.short;
  const showLock = tierKey !== 'workload';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style.bg} ${style.text} ${style.ring} ${className}`}
    >
      <span className="inline-flex items-center gap-0.5">
        {showLock && <Lock className="h-3 w-3 shrink-0" strokeWidth={2.25} />}
        <TierIcon tierKey={tierKey} className="h-3 w-3 shrink-0" />
      </span>
      {label}
    </span>
  );
}
