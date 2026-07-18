// components/home/PrivacyFlipModal.tsx — the privacy-flip: side-by-side "You see"
// vs "Your hospital sees". Workload rows mirror exactly; body/personal collapse
// into a single locked stub on the hospital side. This is the visceral beat.
'use client';

import { Lock, Eye, Building2 } from 'lucide-react';
import type { Clinician, ScoreDay } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { TierChip } from '@/components/ui/TierChip';
import { ScorePill } from '@/components/ui/ScorePill';
import { lastName, pluralize } from '@/components/lib/format';

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
    <Modal open={open} onClose={onClose} title="Private by design" maxWidth="max-w-3xl">
      <p className="mb-5 text-sm text-stone-500">
        The composite score and workload drivers are part of the consent contract you made with{' '}
        {clinician.name.split(' ')[0]}&rsquo;s hospital. Body and personal-record drivers never leave this
        screen.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
            <Eye className="h-4 w-4 text-stone-400" /> You see
          </div>
          <ScorePill loadIndex={scoreDay.loadIndex} tier={scoreDay.tier} />
          <div className="mt-4 space-y-2">
            {workloadDrivers.map((d) => <DriverLine key={d.id} label={d.label} tierKey="workload" />)}
            {privateDrivers.map((d) => <DriverLine key={d.id} label={d.label} tierKey={d.tier} />)}
          </div>
        </div>
        <div className="rounded-2xl border border-stone-200 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
            <Building2 className="h-4 w-4 text-stone-400" /> Your hospital sees
          </div>
          <ScorePill loadIndex={scoreDay.loadIndex} tier={scoreDay.tier} />
          <div className="mt-4 space-y-2">
            {workloadDrivers.map((d) => <DriverLine key={d.id} label={d.label} tierKey="workload" />)}
            {privateDrivers.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2.5 text-sm text-violet-700">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                {pluralize(privateDrivers.length, 'private factor')} — visible only to Dr. {lastName(clinician.name)}
              </div>
            )}
          </div>
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
