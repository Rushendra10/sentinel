// components/ui/ConfirmDialog.tsx — small confirm affordance for consent-gated
// actions (send escalation email, send from voice overlay).
'use client';

import { ShieldCheck } from 'lucide-react';
import { Modal } from './Modal';

export function ConfirmDialog({
  open,
  message,
  confirmLabel = 'Send',
  onCancel,
  onConfirm,
}: {
  open: boolean;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} maxWidth="max-w-sm">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-sky-600">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-stone-700 leading-relaxed">{message}</p>
        <div className="mt-2 flex w-full gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
