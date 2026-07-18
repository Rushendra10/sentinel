// components/insights/EscalationEmailCard.tsx — escalation_email: privacy
// performing on camera. The redaction manifest renders prominently before send.
'use client';

import { useState } from 'react';
import { Mail, Lock, CheckCircle2 } from 'lucide-react';
import type { Artifact, ArtifactStatus } from '@/lib/types';
import { Markdown } from '@/components/ui/Markdown';
import { Pill } from '@/components/ui/Pill';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BRAND } from '@/lib/branding';

export function EscalationEmailCard({
  artifact,
  status,
  onSend,
}: {
  artifact: Artifact;
  status: ArtifactStatus;
  onSend: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const sent = status === 'sent';
  const to = artifact.meta?.to ?? BRAND.admin.name;
  const manifest = artifact.redactionManifest ?? { included: [], excluded: [] };

  return (
    <>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
            <Mail className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-stone-800">{artifact.title}</p>
            <p className="text-xs text-stone-400">To {to}</p>
          </div>
          {sent && <Pill tone="emerald" icon={<CheckCircle2 className="h-3 w-3" />}>Sent</Pill>}
        </div>

        <Markdown content={artifact.bodyMd} className="mt-3 text-sm [&_p]:my-1 [&_p]:text-stone-500" />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="mb-1.5 text-xs font-semibold text-emerald-700">Includes</p>
            <ul className="space-y-1 text-xs text-emerald-700">
              {manifest.included.map((item, i) => <li key={i}>• {item}</li>)}
            </ul>
          </div>
          <div className="rounded-xl bg-red-50 p-3">
            <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-red-700">
              <Lock className="h-3 w-3" /> Excludes
            </p>
            <ul className="space-y-1 text-xs text-red-700">
              {manifest.excluded.map((item, i) => <li key={i}>• {item}</li>)}
            </ul>
          </div>
        </div>

        {!sent && (
          <button
            onClick={() => setConfirmOpen(true)}
            className="mt-3 rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800"
          >
            Send to {to}
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        message="Only your workload data is included — your health data stays here."
        confirmLabel="Send"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onSend();
        }}
      />
    </>
  );
}
