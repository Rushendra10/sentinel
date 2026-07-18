// components/ui/ScoreRing.tsx — the home page's hero: a custom SVG circular arc
// (no charting lib), tier-colored, with a soft glow and a trajectory arrow.
'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { RiskTier } from '@/lib/types';
import { TIER_META } from '@/lib/branding';

const TRAJECTORY_META = {
  rising: { icon: TrendingUp, label: 'Rising' },
  falling: { icon: TrendingDown, label: 'Falling' },
  flat: { icon: Minus, label: 'Steady' },
} as const;

export function ScoreRing({
  loadIndex,
  tier,
  trajectory,
  size = 260,
}: {
  loadIndex: number;
  tier: RiskTier;
  trajectory: 'rising' | 'flat' | 'falling';
  size?: number;
}) {
  const meta = TIER_META[tier];
  const Traj = TRAJECTORY_META[trajectory].icon;
  const stroke = size * 0.072;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, loadIndex)) / 100;
  const dash = `${c * pct} ${c * (1 - pct)}`;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e7e5e4"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={meta.color}
          strokeWidth={stroke}
          strokeDasharray={dash}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dasharray 700ms cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 14px ${meta.color}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        <span className="text-6xl font-semibold tabular-nums tracking-tight text-stone-900">
          {loadIndex}
        </span>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{ backgroundColor: meta.soft, color: meta.color }}
        >
          {meta.label}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-stone-500">
          <Traj className="h-3.5 w-3.5" style={{ color: meta.color }} strokeWidth={2.25} />
          {TRAJECTORY_META[trajectory].label}
        </span>
      </div>
    </div>
  );
}
