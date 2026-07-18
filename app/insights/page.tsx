// app/insights/page.tsx — the comprehensive view: trajectory, all drivers,
// actions, care plan, verification, and the live agent feed in a sticky rail.
'use client';

import { useState } from 'react';
import { Mic } from 'lucide-react';
import {
  getClinician, getScoreSeries, getEventPins,
} from '@/lib/api';
import { effectiveScoreDay } from '@/lib/score/live';
import { getCannedRun } from '@/lib/agents/canned';
import { useDemoStore } from '@/lib/store';
import { BRAND, DEMO } from '@/lib/branding';
import type { Artifact, InboxEmail } from '@/lib/types';
import { buildDateRange, isOnOrBeforeDate } from '@/components/lib/format';

import { TopNav } from '@/components/ui/TopNav';
import { PageFooter } from '@/components/ui/PageFooter';
import { ScorePill } from '@/components/ui/ScorePill';
import { TimelineBar } from '@/components/timeline/TimelineBar';
import { VoiceOverlay } from '@/components/voice/VoiceOverlay';
import { TrajectoryChart, type TrajectoryPin } from '@/components/charts/TrajectoryChart';
import { DriverGroup } from '@/components/insights/DriverGroup';
import { ActionsPanel } from '@/components/insights/ActionsPanel';
import { CarePlanCard } from '@/components/insights/CarePlanCard';
import { VerificationCard } from '@/components/insights/VerificationCard';
import { AgentFeed } from '@/components/feed/AgentFeed';

export default function InsightsPage() {
  const clinicianId = useDemoStore((s) => s.clinicianId);
  const currentDate = useDemoStore((s) => s.currentDate);
  const artifactStatus = useDemoStore((s) => s.artifactStatus);
  const setArtifactStatus = useDemoStore((s) => s.setArtifactStatus);
  const sendEmail = useDemoStore((s) => s.sendEmail);
  const takenBoosts = useDemoStore((s) => s.takenBoosts);
  const spikeTags = useDemoStore((s) => s.spikeTags);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const clinician = getClinician(clinicianId);
  // Same live-computed score as the home page — signing/approving here moves it.
  const scoreDay = effectiveScoreDay(clinicianId, currentDate, { takenBoosts, spikeTags, artifactStatus });
  const fullSeries = getScoreSeries(clinicianId);
  const allPins = getEventPins(clinicianId);
  const cannedRun = getCannedRun(clinicianId);

  const events = cannedRun.events.filter((e) => isOnOrBeforeDate(e.ts, currentDate));
  const pins = allPins.filter((p) => p.date <= currentDate);

  const seriesByDate = new Map(fullSeries.map((p) => [p.date, p.loadIndex]));
  const domainEnd = fullSeries.length > 0 ? fullSeries[fullSeries.length - 1].date : DEMO.verify;
  const rangeEnd = domainEnd > DEMO.verify ? domainEnd : DEMO.verify;
  const chartData = buildDateRange(DEMO.start, rangeEnd).map((date) => ({
    date,
    loadIndex: date <= currentDate ? seriesByDate.get(date) ?? null : null,
  }));
  const pinPoints: TrajectoryPin[] = pins
    .filter((p) => seriesByDate.get(p.date) !== undefined)
    .map((p) => ({ date: p.date, loadIndex: seriesByDate.get(p.date) as number, kind: p.kind, label: p.label }));

  const workloadDrivers = scoreDay.drivers.filter((d) => d.tier === 'workload');
  const bodyDrivers = scoreDay.drivers.filter((d) => d.tier === 'body');
  const personalDrivers = scoreDay.drivers.filter((d) => d.tier === 'personal');

  const carePlan = cannedRun.artifacts.find((a) => a.type === 'care_plan');

  const verifyPin = allPins.find((p) => p.kind === 'verify');
  const verified = !!verifyPin && verifyPin.date <= currentDate;
  const peak = verifyPin
    ? Math.max(...fullSeries.filter((p) => p.date <= verifyPin.date).map((p) => p.loadIndex), 0)
    : undefined;
  const verifiedValue = verifyPin ? seriesByDate.get(verifyPin.date) : undefined;
  const verifierEvents = events.filter((e) => e.agent === 'verifier');

  const statusFor = (id: string, artifact: Artifact) => artifactStatus[id] ?? artifact.status;

  const handleSendEmail = (artifact: Artifact) => {
    const email: InboxEmail = {
      id: artifact.id,
      from: `${clinician.name}, ${clinician.credentials}`,
      to: artifact.meta?.to ?? BRAND.admin.name,
      sentAt: `${currentDate}T09:00:00-07:00`,
      subject: artifact.title,
      bodyMd: artifact.bodyMd,
      redactionManifest: artifact.redactionManifest ?? { included: [], excluded: [] },
    };
    setArtifactStatus(artifact.id, 'sent');
    sendEmail(email);
  };

  return (
    <div className="min-h-screen pb-40">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-8">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">
            {clinician.name}, {clinician.credentials}
          </h1>
          <p className="text-sm text-stone-400">{clinician.role} · {clinician.specialty}</p>
        </div>
        <div className="flex items-center gap-4">
          <ScorePill loadIndex={scoreDay.loadIndex} tier={scoreDay.tier} />
          <TopNav active="insights" />
        </div>
      </header>

      <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-6 px-6 lg:grid-cols-3">
        <main className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
              Load index trajectory
            </h2>
            <TrajectoryChart data={chartData} pins={pinPoints} tier={scoreDay.tier} />
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-stone-400">
              All drivers
            </h2>
            <DriverGroup tierKey="workload" drivers={workloadDrivers} />
            <DriverGroup tierKey="body" drivers={bodyDrivers} />
            <DriverGroup tierKey="personal" drivers={personalDrivers} />
            {workloadDrivers.length + bodyDrivers.length + personalDrivers.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-stone-400">
                Nothing is driving elevated load today — all signals are within your baseline.
              </p>
            )}
          </section>

          <ActionsPanel
            artifacts={cannedRun.artifacts}
            statusFor={(id) => {
              const artifact = cannedRun.artifacts.find((a) => a.id === id);
              return artifact ? statusFor(id, artifact) : 'draft';
            }}
            onSign={(id) => setArtifactStatus(id, 'signed')}
            onApprove={(id) => setArtifactStatus(id, 'approved')}
            onSendEmail={handleSendEmail}
          />

          {carePlan && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
                Care plan
              </h2>
              <CarePlanCard artifact={carePlan} />
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-400">
              Verification
            </h2>
            <VerificationCard
              verified={verified}
              verifyDate={verifyPin?.date ?? DEMO.verify}
              peak={peak}
              verifiedValue={verifiedValue}
              events={verifierEvents}
            />
          </section>
        </main>

        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <AgentFeed events={events} />
        </aside>
      </div>

      <PageFooter />

      <button
        onClick={() => setVoiceOpen(true)}
        className="fixed bottom-28 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg transition-transform hover:scale-105"
        aria-label="Talk to Sentinel"
        title="Talk to Sentinel"
      >
        <Mic className="h-4.5 w-4.5" />
      </button>
      <VoiceOverlay open={voiceOpen} onClose={() => setVoiceOpen(false)} />
      <TimelineBar />
    </div>
  );
}
