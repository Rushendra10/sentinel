// components/ui/TopNav.tsx — subtle top-right nav between the three pages,
// plus the "View as administrator" jump from clinician-facing pages.
'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export function TopNav({ active }: { active: 'home' | 'insights' | 'admin' }) {
  const linkClass = (isActive: boolean) =>
    `text-sm transition-colors ${
      isActive ? 'text-stone-900 font-medium' : 'text-stone-400 hover:text-stone-600'
    }`;

  if (active === 'admin') {
    return (
      <nav className="flex items-center gap-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-600">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to clinician view
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex items-center gap-4">
      <Link href="/" className={linkClass(active === 'home')}>Home</Link>
      <Link href="/insights" className={linkClass(active === 'insights')}>Insights</Link>
      <span className="h-3 w-px bg-stone-200" />
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-stone-400 transition-colors hover:text-stone-600"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        View as administrator
      </Link>
    </nav>
  );
}
