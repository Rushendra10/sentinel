// components/insights/ActionsPanel.tsx — dispatches each non-care-plan artifact
// to its sign-off/approve/send card. Care plan renders separately (its own
// document-styled section, per spec).
'use client';

import { ClipboardList } from 'lucide-react';
import type { Artifact, ArtifactStatus } from '@/lib/types';
import { NoteDraftCard } from './NoteDraftCard';
import { ApprovalCard } from './ApprovalCard';
import { EscalationEmailCard } from './EscalationEmailCard';

export function ActionsPanel({
  artifacts,
  statusFor,
  onSign,
  onApprove,
  onSendEmail,
}: {
  artifacts: Artifact[];
  statusFor: (id: string) => ArtifactStatus;
  onSign: (id: string) => void;
  onApprove: (id: string) => void;
  onSendEmail: (artifact: Artifact) => void;
}) {
  const actionable = artifacts.filter((a) => a.type !== 'care_plan');
  if (actionable.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
        <ClipboardList className="h-4 w-4" />
        Actions
      </h2>
      <div className="flex flex-col gap-3">
        {actionable.map((artifact) => {
          const status = statusFor(artifact.id);
          if (artifact.type === 'note_draft') {
            return (
              <NoteDraftCard
                key={artifact.id}
                artifact={artifact}
                status={status}
                onSign={() => onSign(artifact.id)}
              />
            );
          }
          if (artifact.type === 'escalation_email') {
            return (
              <EscalationEmailCard
                key={artifact.id}
                artifact={artifact}
                status={status}
                onSend={() => onSendEmail(artifact)}
              />
            );
          }
          // schedule_proposal, refill_request, pcp_appointment_draft, inbox_triage_plan
          return (
            <ApprovalCard
              key={artifact.id}
              artifact={artifact}
              status={status}
              onApprove={() => onApprove(artifact.id)}
            />
          );
        })}
      </div>
    </section>
  );
}
