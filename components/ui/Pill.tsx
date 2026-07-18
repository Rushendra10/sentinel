// components/ui/Pill.tsx — small generic badge/chip used for statuses, refs,
// model badges, and metric chips throughout the UI.
'use client';

import type { ReactNode } from 'react';

const TONES = {
  neutral: 'bg-stone-100 text-stone-600 ring-stone-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  ink: 'bg-stone-900 text-stone-50 ring-stone-900',
} as const;

export function Pill({
  children,
  tone = 'neutral',
  className = '',
  icon,
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
