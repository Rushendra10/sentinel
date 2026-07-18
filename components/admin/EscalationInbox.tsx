// components/admin/EscalationInbox.tsx — seeded + live-sent escalation emails,
// each showing its redaction manifest as chips.
'use client';

import { Inbox, Lock, ShieldCheck } from 'lucide-react';
import type { InboxEmail } from '@/lib/types';
import { Pill } from '@/components/ui/Pill';
import { formatDateMedium } from '@/components/lib/format';

export function EscalationInbox({ emails }: { emails: InboxEmail[] }) {
  const sorted = [...emails].sort((a, b) => b.sentAt.localeCompare(a.sentAt));

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
        <Inbox className="h-4 w-4" />
        Escalation inbox
      </h2>
      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-stone-400">No escalations yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((email) => (
            <div key={email.id} className="rounded-xl border border-stone-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-800">{email.subject}</p>
                  <p className="text-xs text-stone-400">
                    From {email.from} · {formatDateMedium(email.sentAt.slice(0, 10))}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600">
                  <ShieldCheck className="h-3.5 w-3.5" /> Redacted
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-stone-500">
                {email.bodyMd.replace(/[#*_-]/g, '').trim()}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {email.redactionManifest.included.map((item, i) => (
                  <Pill key={`in-${i}`} tone="emerald">{item}</Pill>
                ))}
                {email.redactionManifest.excluded.map((item, i) => (
                  <Pill key={`ex-${i}`} tone="red" icon={<Lock className="h-3 w-3" />}>{item}</Pill>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
