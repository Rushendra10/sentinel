// components/ui/PageFooter.tsx — the footer that must appear on every page.
'use client';

import { BRAND } from '@/lib/branding';

export function PageFooter() {
  return (
    <footer className="mt-auto w-full py-8 text-center text-xs text-stone-400">
      {BRAND.footer}
    </footer>
  );
}
