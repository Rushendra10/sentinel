// components/timeline/TimelineBar.tsx — the demo time machine. Fixed bottom-center
// pill, toggled with 'd'. Openly framed as the simulation control, per spec.
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { History } from 'lucide-react';
import { useDemoStore } from '@/lib/store';
import { DEMO } from '@/lib/branding';
import { getClinician, getScoreDay } from '@/lib/api';
import { TIER_META } from '@/lib/branding';
import { addDays, dayDiff, formatDateMedium, initials } from '@/components/lib/format';

const TOTAL_DAYS = dayDiff(DEMO.start, DEMO.verify);

export function TimelineBar() {
  const currentDate = useDemoStore((s) => s.currentDate);
  const clinicianId = useDemoStore((s) => s.clinicianId);
  const timelineOpen = useDemoStore((s) => s.timelineOpen);
  const setDate = useDemoStore((s) => s.setDate);
  const setClinician = useDemoStore((s) => s.setClinician);
  const toggleTimeline = useDemoStore((s) => s.toggleTimeline);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      if (e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        toggleTimeline();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleTimeline]);

  if (!timelineOpen) return null;

  const dayIndex = Math.max(0, Math.min(TOTAL_DAYS, dayDiff(DEMO.start, currentDate)));

  return (
    <div className="fixed bottom-5 left-1/2 z-40 w-[min(94vw,760px)] -translate-x-1/2 rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-stone-400">
          <History className="h-3.5 w-3.5" />
          Simulation timeline
        </span>
        <span className="text-sm font-semibold tabular-nums text-stone-800">
          {formatDateMedium(currentDate)}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={TOTAL_DAYS}
        step={1}
        value={dayIndex}
        onChange={(e) => setDate(addDays(DEMO.start, Number(e.target.value)))}
        className="timeline-slider mt-3 w-full"
        aria-label="Demo date"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {DEMO.jumps.map((jump) => {
            const active = jump.date === currentDate;
            return (
              <button
                key={jump.date}
                onClick={() => setDate(jump.date)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {jump.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5">
          {DEMO.personas.map((id) => {
            const clinician = getClinician(id);
            const active = id === clinicianId;
            let tierColor = '#a8a29e';
            try {
              tierColor = TIER_META[getScoreDay(id, currentDate).tier].color;
            } catch {
              // defensive: data workstream may not have this persona wired yet
            }
            return (
              <button
                key={id}
                onClick={() => {
                  setClinician(id);
                  if (pathname !== '/') router.push('/');
                }}
                title={clinician.name}
                className={`relative flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold transition-all ${
                  active
                    ? 'bg-stone-900 text-white ring-2 ring-stone-900 ring-offset-2 ring-offset-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {initials(clinician.name)}
                <span
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: tierColor }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
