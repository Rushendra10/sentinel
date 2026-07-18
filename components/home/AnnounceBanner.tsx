// components/home/AnnounceBanner.tsx — the announce moment. Speech must originate
// from a real user gesture (browsers block unsolicited speechSynthesis), so this
// arms a one-time listener for the first pointer/key interaction anywhere on the
// page — which includes clicking a timeline jump chip — rather than firing from a
// bare mount effect.
'use client';

import { useEffect, useState } from 'react';
import { Volume2, MessageCircle, X } from 'lucide-react';
import { useDemoStore } from '@/lib/store';

const ANNOUNCE_LINE =
  "Dr. Chen — your load index has crossed into critical. I have prepared some options. Talk to me when you have thirty seconds.";
const CRITICAL_DATE = '2026-07-18';

function speakAnnounce() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(ANNOUNCE_LINE);
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang === 'en-US' && /natural|premium|enhanced/i.test(v.name)) ??
    voices.find((v) => v.lang === 'en-US') ??
    voices[0];
  if (preferred) utter.voice = preferred;
  utter.rate = 1.02;
  window.speechSynthesis.speak(utter);
  return true;
}

export function AnnounceBanner({ onOpenVoice }: { onOpenVoice: () => void }) {
  const [visible, setVisible] = useState(false);
  const [spoke, setSpoke] = useState(false);
  const clinicianId = useDemoStore((s) => s.clinicianId);
  const currentDate = useDemoStore((s) => s.currentDate);

  useEffect(() => {
    function tryAnnounce() {
      const s = useDemoStore.getState();
      if (
        s.clinicianId === 'chen' &&
        s.currentDate >= CRITICAL_DATE &&
        !s.announced
      ) {
        s.markAnnounced();
        setVisible(true);
        setSpoke(speakAnnounce());
        window.removeEventListener('pointerdown', tryAnnounce);
        window.removeEventListener('keydown', tryAnnounce);
      }
    }
    window.addEventListener('pointerdown', tryAnnounce);
    window.addEventListener('keydown', tryAnnounce);
    return () => {
      window.removeEventListener('pointerdown', tryAnnounce);
      window.removeEventListener('keydown', tryAnnounce);
    };
  }, []);

  // The announcement is Chen's critical-day moment — never on another persona's
  // page, and never while the timeline is scrubbed to a pre-critical date.
  if (!visible || clinicianId !== 'chen' || currentDate < CRITICAL_DATE) return null;

  return (
    <div className="fixed left-1/2 top-20 z-30 w-[min(92vw,480px)] -translate-x-1/2 animate-[bannerSlideIn_360ms_cubic-bezier(0.16,1,0.3,1)]">
      <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white/95 p-3.5 pl-4 shadow-xl backdrop-blur">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
          <Volume2 className="h-4 w-4" />
        </span>
        <p className="flex-1 text-sm leading-snug text-stone-600">
          Sentinel has prepared options for your critical load index.
        </p>
        <button
          onClick={onOpenVoice}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-stone-700"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Talk to Sentinel
        </button>
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {!spoke && (
        <button
          onClick={() => setSpoke(speakAnnounce())}
          className="mx-auto mt-2 flex items-center gap-1 rounded-full bg-stone-900/80 px-2.5 py-1 text-[11px] font-medium text-white"
        >
          <Volume2 className="h-3 w-3" /> Enable sound
        </button>
      )}
    </div>
  );
}
