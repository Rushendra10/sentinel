// components/home/CoachCtaButton.tsx — one button for every coach action.
// 'link' navigates, 'artifact' flips the same store state /insights uses (so an
// approval here shows as Approved there), 'done' is a local one-tap acknowledge.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import type { CoachCta } from '@/lib/coach';
import { useDemoStore } from '@/lib/store';

const SOLID =
  'inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-stone-700';
const OUTLINE =
  'inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50';
const DONE =
  'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700';

export function CoachCtaButton({ cta, solid = false }: { cta: CoachCta; solid?: boolean }) {
  const artifactStatus = useDemoStore((s) =>
    cta.artifactId ? s.artifactStatus[cta.artifactId] : undefined,
  );
  const setArtifactStatus = useDemoStore((s) => s.setArtifactStatus);
  const [localDone, setLocalDone] = useState(false);
  const cls = solid ? SOLID : OUTLINE;

  if (cta.kind === 'link') {
    return (
      <Link href={cta.href ?? '/insights'} className={cls}>
        {cta.label}
      </Link>
    );
  }

  const done = cta.kind === 'artifact' ? artifactStatus === cta.targetStatus : localDone;
  if (done) {
    return (
      <span className={DONE}>
        <Check className="h-3.5 w-3.5" />
        {cta.doneLabel ?? 'Done'}
      </span>
    );
  }

  return (
    <button
      onClick={() =>
        cta.kind === 'artifact' && cta.artifactId && cta.targetStatus
          ? setArtifactStatus(cta.artifactId, cta.targetStatus)
          : setLocalDone(true)
      }
      className={cls}
    >
      {cta.label}
    </button>
  );
}
