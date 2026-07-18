// components/admin/RedactedProfilePanel.tsx — same visual language as the
// clinician's own insights view, but Tier-2/3 rows render as locked stubs.
// No adjustment/naive-score info is ever rendered here, even defensively —
// that context is sealed to the clinician regardless of what the payload holds.
'use client';

import { Lock } from 'lucide-react';
import type { AdminProfile } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { ScorePill } from '@/components/ui/ScorePill';
import { TrajectoryArrow } from '@/components/ui/TrajectoryArrow';
import { DriverGroup } from '@/components/insights/DriverGroup';
import { TrajectoryChart } from '@/components/charts/TrajectoryChart';
import { addDays, lastName, pluralize } from '@/components/lib/format';

export function RedactedProfilePanel({
  open,
  onClose,
  profile,
  currentDate,
}: {
  open: boolean;
  onClose: () => void;
  profile: AdminProfile | null;
  currentDate: string;
}) {
  if (!profile) return null;
  const { clinician, scoreDay, lockedFactorCount, spark } = profile;
  const chartData = spark.map((v, i) => ({
    date: addDays(currentDate, i - (spark.length - 1)),
    loadIndex: v,
  }));
  const workloadDrivers = scoreDay.drivers.filter((d) => d.tier === 'workload');

  return (
    <Modal open={open} onClose={onClose} title={`${clinician.name}, ${clinician.credentials} — administrator view`} maxWidth="max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-400">{clinician.role} · {clinician.specialty} · {clinician.unit}</p>
        <div className="flex items-center gap-2">
          <ScorePill loadIndex={scoreDay.loadIndex} tier={scoreDay.tier} />
          <TrajectoryArrow trajectory={scoreDay.trajectory} className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-5">
        <TrajectoryChart data={chartData} pins={[]} tier={scoreDay.tier} height={220} />
      </div>

      <div className="mt-5 rounded-2xl border border-stone-100">
        <DriverGroup tierKey="workload" drivers={workloadDrivers} />
        {lockedFactorCount > 0 && (
          <div className="flex items-center gap-3 border-t border-stone-100 p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
              <Lock className="h-3.5 w-3.5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-violet-700">
                {pluralize(lockedFactorCount, 'private factor')} — visible only to Dr. {lastName(clinician.name)}
              </p>
              <div className="mt-1.5 flex gap-1.5">
                {Array.from({ length: lockedFactorCount }).map((_, i) => (
                  <span key={i} className="h-2 w-24 rounded-full bg-stone-200 blur-[2px]" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
