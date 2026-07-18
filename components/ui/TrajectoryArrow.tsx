// components/ui/TrajectoryArrow.tsx — small reusable rising/falling/steady arrow.
'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const META = {
  rising: { icon: TrendingUp, color: '#dc2626' },
  falling: { icon: TrendingDown, color: '#059669' },
  flat: { icon: Minus, color: '#78716c' },
} as const;

export function TrajectoryArrow({ trajectory, className = 'h-3.5 w-3.5' }: { trajectory: 'rising' | 'flat' | 'falling'; className?: string }) {
  const { icon: Icon, color } = META[trajectory];
  return <Icon className={className} style={{ color }} strokeWidth={2.25} />;
}
