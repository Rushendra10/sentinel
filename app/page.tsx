// app/page.tsx — the clinician home. Score-first, uncrowded, one primary path
// ("Tell me more") and one secondary path (voice). Nothing else lives here.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mic, Lock } from 'lucide-react';
import { getClinician, getScoreDay, getScoreSeries } from '@/lib/api';
import { useDemoStore } from '@/lib/store';
import { BRAND, TIER_META } from '@/lib/branding';
import { formatDateLong } from '@/components/lib/format';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Sparkline } from '@/components/ui/Sparkline';
import { DriverCard } from '@/components/ui/DriverCard';
import { AdjustmentPill } from '@/components/ui/AdjustmentPill';
import { TopNav } from '@/components/ui/TopNav';
import { PageFooter } from '@/components/ui/PageFooter';
import { TimelineBar } from '@/components/timeline/TimelineBar';
import { VoiceOverlay } from '@/components/voice/VoiceOverlay';
import { AnnounceBanner } from '@/components/home/AnnounceBanner';
import { PrivacyFlipModal } from '@/components/home/PrivacyFlipModal';

export default function Home() {
  const clinicianId = useDemoStore((s) => s.clinicianId);
  const currentDate = useDemoStore((s) => s.currentDate);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const clinician = getClinician(clinicianId);
  const scoreDay = getScoreDay(clinicianId, currentDate);
  const series = getScoreSeries(clinicianId)
    .filter((p) => p.date <= currentDate)
    .map((p) => p.loadIndex);
  const tierMeta = TIER_META[scoreDay.tier];

  const topDrivers = [...scoreDay.drivers]
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-8">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight text-stone-900">{BRAND.name}</span>
          <span className="text-sm text-stone-400">· {BRAND.hospital}</span>
        </div>
        <TopNav active="home" />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-6 pb-32 pt-10">
        <div className="w-full text-center">
          <p className="text-2xl font-semibold text-stone-900">
            Good morning, Dr. {clinician.name.split(' ').slice(-1)[0]}
          </p>
          <p className="mt-1 text-sm text-stone-400">{formatDateLong(currentDate)}</p>
        </div>

        <div className="mt-10 flex flex-col items-center">
          <ScoreRing loadIndex={scoreDay.loadIndex} tier={scoreDay.tier} trajectory={scoreDay.trajectory} />
          {scoreDay.adjustment && (
            <div className="mt-4">
              <AdjustmentPill reason={scoreDay.adjustment.reason} naiveIndex={scoreDay.adjustment.naiveIndex} />
            </div>
          )}
          <div className="mt-6 w-56">
            <Sparkline data={series} color={tierMeta.color} height={44} />
            <p className="mt-1 text-center text-[11px] text-stone-400">21-day load index</p>
          </div>
        </div>

        <section className="mt-12 w-full">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
            What is driving this
          </h2>
          <div className="flex flex-col gap-3">
            {topDrivers.length === 0 ? (
              <p className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-400">
                No elevated drivers today — steady state.
              </p>
            ) : (
              topDrivers.map((d) => <DriverCard key={d.id} driver={d} />)
            )}
          </div>
        </section>

        <div className="mt-10 flex flex-col items-center gap-5">
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-stone-800"
          >
            Tell me more
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setVoiceOpen(true)}
            className="flex flex-col items-center gap-1.5 text-stone-500 transition-colors hover:text-stone-700"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <Mic className="h-4.5 w-4.5" />
            </span>
            <span className="text-xs font-medium">Talk to Sentinel</span>
          </button>
        </div>

        <button
          onClick={() => setPrivacyOpen(true)}
          className="mt-14 inline-flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-600"
        >
          <Lock className="h-3 w-3" />
          Private by design — see what your hospital sees
        </button>
      </main>

      <PageFooter />

      <AnnounceBanner onOpenVoice={() => setVoiceOpen(true)} />
      <VoiceOverlay open={voiceOpen} onClose={() => setVoiceOpen(false)} />
      <PrivacyFlipModal
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        clinician={clinician}
        scoreDay={scoreDay}
      />
      <TimelineBar />
    </div>
  );
}
