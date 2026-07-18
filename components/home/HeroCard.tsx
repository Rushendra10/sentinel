// components/home/HeroCard.tsx — the mockup-style hero: score on the left, ONE
// recommended action on the right. Help first, numbers second.
'use client';

import { Mic } from 'lucide-react';
import type { ScoreDay } from '@/lib/types';
import type { CoachAction } from '@/lib/coach';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { AdjustmentPill } from '@/components/ui/AdjustmentPill';
import { CoachCtaButton } from './CoachCtaButton';

export function HeroCard({
  scoreDay,
  action,
  onVoice,
}: {
  scoreDay: ScoreDay;
  action: CoachAction;
  onVoice: () => void;
}) {
  return (
    <div className="flex w-full items-center gap-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:gap-6 sm:p-6">
      <div className="flex shrink-0 flex-col items-center gap-2">
        <ScoreRing
          loadIndex={scoreDay.loadIndex}
          tier={scoreDay.tier}
          trajectory={scoreDay.trajectory}
          size={128}
          compact
        />
      </div>
      <div className="w-px self-stretch bg-stone-100" />
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold leading-snug text-stone-900">{action.title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{action.detail}</p>
        {scoreDay.adjustment && (
          <div className="mt-2.5">
            <AdjustmentPill
              reason={scoreDay.adjustment.reason}
              naiveIndex={scoreDay.adjustment.naiveIndex}
            />
          </div>
        )}
        <div className="mt-4 flex items-center gap-3">
          {action.cta && <CoachCtaButton cta={action.cta} solid />}
          {action.impactPts !== undefined && action.impactPts >= 1 && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600">
              ≈ −{Math.round(action.impactPts)} pts
            </span>
          )}
          <button
            onClick={onVoice}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-400 transition-colors hover:text-stone-600"
          >
            <Mic className="h-3.5 w-3.5" />
            or talk to Sentinel
          </button>
        </div>
      </div>
    </div>
  );
}
