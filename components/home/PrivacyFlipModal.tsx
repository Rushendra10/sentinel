// components/home/PrivacyFlipModal.tsx — the privacy view. No duplicated lists:
// what the hospital can see is shown once (it's visible to both, obviously), and
// the private section carries ONLY what never leaves the clinician's screen.
'use client';

import { Lock, Building2 } from 'lucide-react';
import type { Clinician, ScoreDay } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { TierChip } from '@/components/ui/TierChip';
import { ScorePill } from '@/components/ui/ScorePill';
import { lastName } from '@/components/lib/format';

export function PrivacyFlipModal({
  open,
  onClose,
  clinician,
  scoreDay,
}: {
  open: boolean;
  onClose: () => void;
  clinician: Clinician;
  scoreDay: ScoreDay;
}) {
  const workloadDrivers = scoreDay.drivers.filter((d) => d.tier === 'workload');
  const privateDrivers = scoreDay.drivers.filter((d) => d.tier !== 'workload');

  return (
    <Modal open={open} onClose={onClose} title="Private by design" maxWidth="max-w-lg">
      <p className="mb-5 text-sm text-stone-500">
        Your hospital sees the composite score and workload signals it already owns — never your body
        or personal-record data. That separation is the consent contract.
      </p>

      <div className="rounded-2xl border border-stone-200 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
          <Building2 className="h-4 w-4 text-stone-400" /> Shared with your hospital
        </div>
        <ScorePill loadIndex={scoreDay.loadIndex} tier={scoreDay.tier} />
        <div className="mt-3 space-y-1.5">
          {workloadDrivers.map((d) => (
            <DriverLine key={d.id} label={d.label} tierKey="workload" />
          ))}
          {workloadDrivers.length === 0 && (
            <p className="px-3 py-1.5 text-sm text-stone-400">Score and trend only — no elevated workload drivers today.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-800">
          <Lock className="h-4 w-4 text-violet-500" /> Only you, Dr. {lastName(clinician.name)}
        </div>
        <div className="space-y-1.5">
          {privateDrivers.map((d) => (
            <DriverLine key={d.id} label={d.label} tierKey={d.tier} />
          ))}
          <p className="px-3 pt-1.5 text-xs leading-snug text-violet-700/80">
            Everything from your wearable and your own health record stays on this screen — it shapes
            your score and your recommendations, and is never shared in any individual form.
          </p>
        </div>
      </div>
    </Modal>
  );
}

function DriverLine({ label, tierKey }: { label: string; tierKey: 'workload' | 'body' | 'personal' }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-50">
      <span className="truncate">{label}</span>
      <TierChip tierKey={tierKey} className="shrink-0" />
    </div>
  );
}
