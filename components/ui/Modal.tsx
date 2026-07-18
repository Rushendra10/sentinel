// components/ui/Modal.tsx — generic centered dialog used across insights/admin/home.
'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${maxWidth} max-h-[85vh] overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-2xl animate-[modalIn_200ms_cubic-bezier(0.16,1,0.3,1)]`}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white/95 px-6 py-4 backdrop-blur">
            <h3 className="text-base font-semibold text-stone-900">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-1.5 text-stone-400 shadow-sm transition-colors hover:bg-stone-100 hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
