// app/admin/page.tsx — the CMO view: unit strip, roster, redacted profiles,
// and the escalation inbox. Everything here is built by omission upstream —
// this page never imports body/personal fields at all.
'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { getAdminRoster, getAdminProfile, getSeededInbox } from '@/lib/api';
import { useDemoStore } from '@/lib/store';
import { BRAND } from '@/lib/branding';
import { TopNav } from '@/components/ui/TopNav';
import { PageFooter } from '@/components/ui/PageFooter';
import { TimelineBar } from '@/components/timeline/TimelineBar';
import { UnitStrip } from '@/components/admin/UnitStrip';
import { RosterTable } from '@/components/admin/RosterTable';
import { RedactedProfilePanel } from '@/components/admin/RedactedProfilePanel';
import { EscalationInbox } from '@/components/admin/EscalationInbox';

export default function AdminPage() {
  const currentDate = useDemoStore((s) => s.currentDate);
  const sentEmails = useDemoStore((s) => s.sentEmails);
  const [selected, setSelected] = useState<string | null>(null);

  const roster = getAdminRoster(currentDate);
  const seededInbox = getSeededInbox();
  const inbox = useMemo(
    () =>
      [...seededInbox, ...sentEmails].filter((e) => e.sentAt.slice(0, 10) <= currentDate),
    [seededInbox, sentEmails, currentDate],
  );
  const profile = selected ? getAdminProfile(selected, currentDate) : null;

  return (
    <div className="min-h-screen pb-40">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight text-stone-900">{BRAND.name}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
              <ShieldCheck className="h-3 w-3" />
              Administrator view
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-400">
            {BRAND.admin.name} · {BRAND.admin.title} · {BRAND.hospital}
          </p>
        </div>
        <TopNav active="admin" />
      </header>

      <main className="mx-auto mt-8 flex max-w-6xl flex-col gap-6 px-6">
        <UnitStrip roster={roster} />
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">Roster</h2>
          <RosterTable roster={roster} onSelect={setSelected} />
        </section>
        <EscalationInbox emails={inbox} />
      </main>

      <PageFooter />

      <RedactedProfilePanel
        open={!!selected}
        onClose={() => setSelected(null)}
        profile={profile}
        currentDate={currentDate}
      />
      <TimelineBar />
    </div>
  );
}
