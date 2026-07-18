// components/insights/ApprovalCard.tsx — schedule_proposal / refill_request /
// pcp_appointment_draft: a short proposal with a single Approve action.
'use client';

import { CalendarClock, Pill as PillIcon, Stethoscope, CheckCircle2 } from 'lucide-react';
import type { Artifact, ArtifactStatus, ArtifactType } from '@/lib/types';
import { Markdown } from '@/components/ui/Markdown';
import { Pill } from '@/components/ui/Pill';

const ICON: Record<string, typeof CalendarClock> = {
  schedule_proposal: CalendarClock,
  refill_request: PillIcon,
  pcp_appointment_draft: Stethoscope,
};

export function ApprovalCard({
  artifact,
  status,
  onApprove,
}: {
  artifact: Artifact;
  status: ArtifactStatus;
  onApprove: () => void;
}) {
  const Icon = ICON[artifact.type as ArtifactType] ?? CalendarClock;
  const approved = status === 'approved';

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-800">{artifact.title}</p>
          <Markdown content={artifact.bodyMd} className="mt-1 text-sm [&_p]:my-1 [&_p]:text-stone-500" />
        </div>
        <div className="shrink-0">
          {approved ? (
            <Pill tone="emerald" icon={<CheckCircle2 className="h-3 w-3" />}>Approved</Pill>
          ) : (
            <button
              onClick={onApprove}
              className="rounded-full bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-stone-800"
            >
              Approve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
