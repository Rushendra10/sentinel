// components/insights/NoteDraftCard.tsx — a note_draft artifact: preview card +
// modal with the rendered note, review flags, and the sign action.
'use client';

import { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Artifact, ArtifactStatus } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Pill } from '@/components/ui/Pill';
import { Markdown } from '@/components/ui/Markdown';

export function NoteDraftCard({
  artifact,
  status,
  onSign,
}: {
  artifact: Artifact;
  status: ArtifactStatus;
  onSign: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [justSigned, setJustSigned] = useState(false);
  const signed = status === 'signed';
  const preview = artifact.bodyMd.replace(/[#*_-]/g, '').trim().slice(0, 110);

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-800">{artifact.title}</p>
          <p className="truncate text-xs text-stone-400">{preview}…</p>
          {artifact.meta?.queued && (
            <p className="mt-0.5 text-xs font-medium text-sky-600">{artifact.meta.queued}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {artifact.needsVerification && artifact.needsVerification.length > 0 && !signed && (
            <Pill tone="amber" icon={<AlertTriangle className="h-3 w-3" />}>
              {artifact.needsVerification.length} to review
            </Pill>
          )}
          {signed ? (
            <Pill tone="emerald" icon={<CheckCircle2 className="h-3 w-3" />}>Signed</Pill>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-50"
            >
              Open note
            </button>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={artifact.title}>
        {artifact.needsVerification && artifact.needsVerification.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {artifact.needsVerification.map((flag, i) => (
              <Pill key={i} tone="amber" icon={<AlertTriangle className="h-3 w-3" />}>{flag}</Pill>
            ))}
          </div>
        )}
        <Markdown content={artifact.bodyMd} />
        {artifact.meta?.queued && (
          <p className="mt-4 text-xs font-medium text-sky-600">{artifact.meta.queued}</p>
        )}
        <div className="mt-5 border-t border-stone-100 pt-4">
          {signed || justSigned ? (
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 animate-[checkPop_420ms_cubic-bezier(0.34,1.56,0.64,1)]">
              <CheckCircle2 className="h-5 w-5" />
              Signed
            </div>
          ) : (
            <button
              onClick={() => {
                setJustSigned(true);
                onSign();
              }}
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
            >
              Sign note
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
