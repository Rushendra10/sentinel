// app/page.tsx — the clinician home. Design principle: help, don't inform.
// One score, one recommended action (hero), each driver paired with its fix,
// and the side rails carry data-source status + the agent's visible loop.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { getClinician, getScoreSeries } from '@/lib/api';
import { effectiveScoreDay } from '@/lib/score/live';
import { getBoostActions, getDataSources, getDriverFix, getHeroAction, getSpike, getTrendPhrase } from '@/lib/coach';
import { useDemoStore } from '@/lib/store';
import { BRAND, TIER_META } from '@/lib/branding';
import { formatDateLong, lastName } from '@/components/lib/format';
import { Sparkline } from '@/components/ui/Sparkline';
import { DriverCard } from '@/components/ui/DriverCard';
import { TopNav } from '@/components/ui/TopNav';
import { PageFooter } from '@/components/ui/PageFooter';
import { TimelineBar } from '@/components/timeline/TimelineBar';
import { VoiceOverlay } from '@/components/voice/VoiceOverlay';
import { AnnounceBanner } from '@/components/home/AnnounceBanner';
import { PrivacyFlipModal } from '@/components/home/PrivacyFlipModal';
import { HeroCard } from '@/components/home/HeroCard';
import { CoachCtaButton } from '@/components/home/CoachCtaButton';
import { DataSourcesCard } from '@/components/home/DataSourcesCard';
import { BoostsCard } from '@/components/home/BoostsCard';

export default function Home() {
  const clinicianId = useDemoStore((s) => s.clinicianId);
  const currentDate = useDemoStore((s) => s.currentDate);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const takenBoosts = useDemoStore((s) => s.takenBoosts);
  const spikeTags = useDemoStore((s) => s.spikeTags);
  const artifactStatus = useDemoStore((s) => s.artifactStatus);

  const clinician = getClinician(clinicianId);
  // The displayed score is COMPUTED: engine output minus formula-derived credits
  // for every action taken this session (boosts, spike tags, signed/approved work).
  const scoreDay = effectiveScoreDay(clinicianId, currentDate, { takenBoosts, spikeTags, artifactStatus });
  const series = getScoreSeries(clinicianId)
    .filter((p) => p.date <= currentDate)
    .map((p) => p.loadIndex);
  const tierMeta = TIER_META[scoreDay.tier];

  const heroAction = getHeroAction(clinicianId, currentDate);
  const trendPhrase = getTrendPhrase(clinicianId, currentDate);
  const sources = getDataSources(clinicianId, currentDate);
  const boosts = getBoostActions(clinicianId, currentDate);
  const spike = getSpike(clinicianId, currentDate);

  const topDrivers = [...scoreDay.drivers]
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight text-stone-900">{BRAND.name}</span>
          <span className="text-sm text-stone-400">· {BRAND.hospital}</span>
        </div>
        <TopNav active="home" />
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-32 pt-9">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-2xl font-semibold text-stone-900">
            Good morning, Dr. {lastName(clinician.name)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-stone-400">
            {formatDateLong(currentDate)} ·
            <Lock className="h-3 w-3" />
            Only you can see this
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[218px_minmax(0,1fr)_218px]">
          <aside className="order-2 lg:order-1 lg:sticky lg:top-8 lg:h-fit">
            <DataSourcesCard sources={sources} onOpenPrivacy={() => setPrivacyOpen(true)} />
          </aside>

          <section className="order-1 mx-auto w-full max-w-2xl min-w-0 lg:order-2">
            <HeroCard scoreDay={scoreDay} action={heroAction} onVoice={() => setVoiceOpen(true)} />

            <div className="mt-3 flex items-center gap-3 px-1">
              <div className="w-24 shrink-0">
                <Sparkline data={series} color={tierMeta.color} height={26} />
              </div>
              <p className="text-xs text-stone-400">{trendPhrase}</p>
            </div>

            <section className="mt-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
                What&rsquo;s driving this, and what to do
              </h2>
              <div className="flex flex-col gap-3">
                {topDrivers.length === 0 ? (
                  <p className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-400">
                    Nothing is driving elevated load today — all signals are within your baseline.
                  </p>
                ) : (
                  topDrivers.map((d) => {
                    const fix = getDriverFix(clinicianId, d.id, currentDate);
                    return (
                      <DriverCard
                        key={d.id}
                        driver={d}
                        footer={
                          fix ? (
                            <div className="flex items-center justify-between gap-3">
                              <p className="flex min-w-0 items-start gap-2 text-sm text-stone-700">
                                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
                                <span className="leading-snug">{fix.text}</span>
                              </p>
                              {fix.cta && <CoachCtaButton cta={fix.cta} />}
                            </div>
                          ) : undefined
                        }
                      />
                    );
                  })
                )}
              </div>
            </section>

            <div className="mt-9 flex flex-col items-center gap-4">
              <Link
                href="/insights"
                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-stone-800"
              >
                Tell me more
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setPrivacyOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-600"
              >
                <Lock className="h-3 w-3" />
                Private by design — see what your hospital sees
              </button>
            </div>
          </section>

          <aside className="order-3 lg:sticky lg:top-8 lg:h-fit">
            <BoostsCard boosts={boosts} spike={spike} />
          </aside>
        </div>
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
