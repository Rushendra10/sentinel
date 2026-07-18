// lib/coach.ts — the "help, don't inform" layer for the clinician home.
// Everything here is deterministic, persona- and date-aware content: the hero's
// one recommended action, a fix for each driver, data-source freshness, and the
// agent-loop tracker. Pure functions, no LLM, safe for any clinician id.

import type { ArtifactStatus } from './types';
import { getScoreSeries } from './api';
import { artifactDeltaT, boostCatalog, deltaPts, SPIKE_TAG_DELTA_T, type Boost } from './score/live';

export interface CoachCta {
  label: string;
  /** Shown after the action is taken (artifact/done kinds). */
  doneLabel?: string;
  kind: 'link' | 'artifact' | 'done';
  href?: string; // kind: link
  artifactId?: string; // kind: artifact — wired to the same store state as /insights
  targetStatus?: ArtifactStatus;
}

export interface CoachAction {
  title: string;
  detail: string;
  cta?: CoachCta;
  /** Formula-computed projected score improvement, shown as "≈ −N pts". */
  impactPts?: number;
}

export interface DriverFix {
  text: string;
  cta?: CoachCta;
}

export interface DataSource {
  name: string;
  note: string;
  status: 'fresh' | 'stale' | 'off' | 'adjusted';
}

export interface LoopStep {
  label: string;
  note: string;
  date: string; // when this step completed / is scheduled
  state: 'done' | 'active' | 'scheduled';
}

export interface LoopStatus {
  steps: LoopStep[];
  /** Present once the loop has closed — the "verified" moment. */
  closedNote?: string;
}

// ————— phases —————

type ChenPhase = 'baseline' | 'trigger' | 'strain' | 'act' | 'recovering' | 'verified';
function chenPhase(date: string): ChenPhase {
  if (date < '2026-07-07') return 'baseline';
  if (date < '2026-07-09') return 'trigger';
  if (date < '2026-07-18') return 'strain';
  if (date < '2026-07-19') return 'act';
  if (date < '2026-07-25') return 'recovering';
  return 'verified';
}

type OkaforPhase = 'crisis' | 'relief' | 'closed';
function okaforPhase(date: string): OkaforPhase {
  if (date < '2026-07-02') return 'crisis';
  if (date < '2026-07-09') return 'relief';
  return 'closed';
}

// ————— hero action —————

export function getHeroAction(clinicianId: string, date: string): CoachAction {
  if (clinicianId === 'chen') {
    switch (chenPhase(date)) {
      case 'baseline':
        return {
          title: 'You’re at baseline — nothing needs you',
          detail:
            'Sentinel is watching the record so you don’t have to. One thing worth protecting: Sunday is your only low-load day in the next seven.',
          cta: { kind: 'link', label: 'See your data', href: '/insights' },
        };
      case 'trigger':
        return {
          title: 'Block 30 minutes tomorrow morning for backlog',
          detail:
            'After-hours charting has risen three days straight (+112% vs your baseline). Clearing the backlog before rounds beats clearing it at midnight.',
          cta: { kind: 'done', label: 'Add to calendar', doneLabel: 'Added for 7:00 AM' },
        };
      case 'strain':
        return {
          title: 'Let Sentinel draft a coverage request',
          detail:
            'Your body is now confirming the workload trend — HRV down, sleep eroding. The request shares workload facts only; your health data stays here.',
          cta: { kind: 'link', label: 'Preview the draft', href: '/insights' },
        };
      case 'act':
        return {
          title: '11 notes are drafted — sign them and go home',
          detail:
            'Signing takes about six minutes and clears tonight’s after-hours charting. Your refill and Thursday’s recovery block are staged below.',
          cta: { kind: 'link', label: 'Review & sign', href: '/insights' },
          impactPts: deltaPts(
            'chen',
            date,
            artifactDeltaT('chen', 'chen-art-note-v1', date) + artifactDeltaT('chen', 'chen-art-note-v2', date),
          ),
        };
      case 'recovering':
        return {
          title: 'Recovery in progress — keep Thursday protected',
          detail:
            'After-hours is falling and your refill was picked up Jul 19. The protected block on Thursday is what keeps this trend moving down.',
          cta: { kind: 'link', label: 'Track recovery', href: '/insights' },
        };
      case 'verified':
        return {
          title: 'It worked — your load is down 46%',
          detail:
            'After-hours down 61%, backlog cleared, HRV recovering. Sentinel re-checked the data and verified the interventions actually landed.',
          cta: { kind: 'link', label: 'See what worked', href: '/insights' },
        };
    }
  }

  if (clinicianId === 'patel') {
    if (date < '2026-07-17') {
      return {
        title: 'Census is creeping — Sentinel is watching',
        detail:
          'Nothing needs you yet. Your strain readings are recalibrated for your beta-blocker, so trust this number over your watch’s.',
        cta: { kind: 'link', label: 'See your data', href: '/insights' },
      };
    }
    return {
      title: 'Cap admissions tomorrow — the plan is ready',
      detail:
        'Census went 14 → 22 in three weeks, and your medication-adjusted strain is at the 88th percentile. Two census-relief actions await your sign-off.',
      cta: {
        kind: 'artifact',
        label: 'Approve the cap',
        doneLabel: 'Approved — scheduler notified',
        artifactId: 'patel-art-cap',
        targetStatus: 'approved',
      },
      impactPts: deltaPts('patel', date, artifactDeltaT('patel', 'patel-art-cap', date)),
    };
  }

  if (clinicianId === 'okafor') {
    switch (okaforPhase(date)) {
      case 'crisis':
        return {
          title: 'Two losses in 48 hours — let Sentinel get you backup',
          detail:
            'You’re on day eleven without a break. A coverage request is ready — workload facts only, sent with your consent.',
          cta: { kind: 'link', label: 'Review the request', href: '/insights' },
        };
      case 'relief':
        return {
          title: 'Relief is in motion',
          detail:
            'Your 11 notes were drafted and signed the same day, the chief adjusted coverage Jul 3, and two recovery days are on your schedule.',
          cta: { kind: 'link', label: 'See the plan', href: '/insights' },
        };
      case 'closed':
        return {
          title: 'Nothing needs you today',
          detail:
            'Your loop closed Jul 9 — recovery verified, score down 78 → 39. Sentinel is back to quiet watching. Next check-in: Aug 1.',
          cta: { kind: 'link', label: 'See what worked', href: '/insights' },
        };
    }
  }

  return {
    title: 'You’re at baseline — nothing needs you',
    detail: 'Sentinel is watching your workload signals and will step in before strain compounds.',
  };
}

// ————— per-driver fixes —————

export function getDriverFix(clinicianId: string, driverId: string, date: string): DriverFix | null {
  if (clinicianId === 'chen') {
    const phase = chenPhase(date);
    switch (driverId) {
      case 'after-hours':
        if (phase === 'act' || phase === 'recovering' || phase === 'verified') {
          return {
            text: '11 notes are drafted — signing them clears tonight’s charting.',
            cta: { kind: 'link', label: 'Review & sign', href: '/insights' },
          };
        }
        return {
          text: 'Block 30 min tomorrow morning for backlog, before rounds.',
          cta: { kind: 'done', label: 'Add to calendar', doneLabel: 'Added for 7:00 AM' },
        };
      case 'backlog':
        return {
          text: 'Inbox triage is ready — 14 routine replies for one-tap approval.',
          cta: { kind: 'link', label: 'Open triage', href: '/insights' },
        };
      case 'hrv':
        return {
          text: 'Protected recovery block Thursday + weekend relief — proposal ready.',
          cta: {
            kind: 'artifact',
            label: 'Approve block',
            doneLabel: 'Approved — scheduler notified',
            artifactId: 'chen-art-schedule',
            targetStatus: 'approved',
          },
        };
      case 'sleep':
        return {
          text: 'Aim for lights-out by 10:30 — Sentinel kept tomorrow’s first hour clear.',
          cta: { kind: 'done', label: 'Set reminder', doneLabel: 'Reminder set' },
        };
      case 'levo-gap':
        return {
          text: 'Refill request is drafted for your pharmacy — one tap to send.',
          cta: {
            kind: 'artifact',
            label: 'Send refill',
            doneLabel: 'Sent to pharmacy',
            artifactId: 'chen-art-refill',
            targetStatus: 'sent',
          },
        };
      case 'pcp-overdue':
        return {
          text: 'Aug 3, 2:00 PM held with Dr. Raman — TSH recheck included.',
          cta: {
            kind: 'artifact',
            label: 'Confirm visit',
            doneLabel: 'Confirmed',
            artifactId: 'chen-art-pcp',
            targetStatus: 'approved',
          },
        };
      case 'consecutive-days':
        return {
          text: 'Shift relief Jul 19–20 is proposed — no clinical assignment Thursday.',
          cta: {
            kind: 'artifact',
            label: 'Approve relief',
            doneLabel: 'Approved — scheduler notified',
            artifactId: 'chen-art-schedule',
            targetStatus: 'approved',
          },
        };
      case 'acuity':
        return {
          text: 'Two deaths in 48h is heavy — a privacy-safe escalation is prepared.',
          cta: { kind: 'link', label: 'See escalation', href: '/insights' },
        };
      default:
        return null;
    }
  }

  if (clinicianId === 'patel') {
    switch (driverId) {
      case 'beta-blocker-recal':
        return {
          text: 'Your watch under-reads you — Sentinel recalibrates for metoprolol.',
          cta: { kind: 'link', label: 'See how', href: '/insights' },
        };
      case 'volume':
      case 'after-hours':
        return {
          text: 'Cap admissions at 18 tomorrow — redistribution plan is ready.',
          cta: {
            kind: 'artifact',
            label: 'Approve cap',
            doneLabel: 'Approved — scheduler notified',
            artifactId: 'patel-art-cap',
            targetStatus: 'approved',
          },
        };
      case 'backlog':
        return {
          text: 'Redistribute 4 stable patients to the float pool — plan drafted.',
          cta: {
            kind: 'artifact',
            label: 'Approve plan',
            doneLabel: 'Approved',
            artifactId: 'patel-art-redistribute',
            targetStatus: 'approved',
          },
        };
      case 'sleep':
        return {
          text: 'Aim for lights-out by 10:30 tonight — census cap starts tomorrow.',
          cta: { kind: 'done', label: 'Set reminder', doneLabel: 'Reminder set' },
        };
      default:
        return null;
    }
  }

  if (clinicianId === 'okafor') {
    switch (driverId) {
      case 'acuity':
      case 'after-hours':
      case 'consecutive-days':
        return {
          text: 'Coverage request ready — workload facts only, sent with your consent.',
          cta: { kind: 'link', label: 'Review request', href: '/insights' },
        };
      default:
        return null;
    }
  }

  return null;
}

// ————— data sources (left rail) —————

export function getDataSources(clinicianId: string, date: string): DataSource[] {
  if (clinicianId === 'patel') {
    return [
      { name: 'EHR activity', note: 'Epic Signal · live', status: 'fresh' },
      { name: 'Schedule', note: 'QGenda · synced', status: 'fresh' },
      { name: 'Apple Watch', note: 'Readings adjusted for metoprolol', status: 'adjusted' },
      { name: 'Health records', note: 'Medication list current', status: 'fresh' },
    ];
  }
  if (clinicianId === 'okafor') {
    const watchStale = date >= '2026-07-17';
    return [
      { name: 'EHR activity', note: 'Epic Signal · live', status: 'fresh' },
      { name: 'Schedule', note: 'QGenda · synced', status: 'fresh' },
      watchStale
        ? { name: 'Apple Watch', note: 'Not worn since Jul 16 — wear it to keep insights precise', status: 'stale' }
        : { name: 'Apple Watch', note: 'Synced this morning', status: 'fresh' },
      { name: 'Health records', note: 'Not connected · optional — Sentinel works without it', status: 'off' },
    ];
  }
  // chen + roster default
  return [
    { name: 'EHR activity', note: 'Epic Signal · live', status: 'fresh' },
    { name: 'Schedule', note: 'QGenda · synced', status: 'fresh' },
    { name: 'Apple Watch', note: 'Synced 6:40 AM · recovery, sleep & movement feed your score', status: 'fresh' },
    { name: 'Health records', note: 'Pharmacy fills current', status: 'fresh' },
  ];
}

// ————— agent loop (right rail) —————

function stepState(date: string, stepDate: string, activeThrough?: string): LoopStep['state'] {
  if (date > (activeThrough ?? stepDate)) return 'done';
  if (date >= stepDate) return 'active';
  return 'scheduled';
}

export function getLoopStatus(clinicianId: string, date: string): LoopStatus {
  if (clinicianId === 'chen') {
    const steps: LoopStep[] = [
      { label: 'Detect', note: 'Workload trend fired — before the deaths', date: '2026-07-07', state: stepState(date, '2026-07-07') },
      { label: 'Understand', note: 'Body confirmed · own record cross-referenced', date: '2026-07-09', state: stepState(date, '2026-07-09', '2026-07-17') },
      { label: 'Act', note: 'Notes, refill, recovery block, escalation', date: '2026-07-18', state: stepState(date, '2026-07-18') },
      { label: 'Verify', note: 'Sentinel re-checks the data', date: '2026-07-25', state: stepState(date, '2026-07-25') },
    ];
    return {
      steps,
      closedNote:
        date >= '2026-07-25'
          ? 'Verified Jul 25 — after-hours down 61%, HRV recovering. Next check: Aug 1.'
          : undefined,
    };
  }
  if (clinicianId === 'patel') {
    return {
      steps: [
        { label: 'Detect', note: 'Census + strain trend', date: '2026-07-17', state: stepState(date, '2026-07-17') },
        { label: 'Understand', note: 'Recalibrated for beta-blockade', date: '2026-07-17', state: stepState(date, '2026-07-17', '2026-07-17') },
        { label: 'Act', note: 'Two proposals await your sign-off', date: '2026-07-18', state: date >= '2026-07-17' ? 'active' : 'scheduled' },
        { label: 'Verify', note: 'After the actions land', date: '2026-07-28', state: 'scheduled' },
      ],
    };
  }
  if (clinicianId === 'okafor') {
    return {
      steps: [
        { label: 'Detect', note: 'Two deaths in 48h · day 11', date: '2026-06-30', state: stepState(date, '2026-06-30') },
        { label: 'Understand', note: 'Workload + wearable only — no personal data', date: '2026-07-01', state: stepState(date, '2026-07-01') },
        { label: 'Act', note: 'Notes signed · escalation sent · coverage adjusted', date: '2026-07-02', state: stepState(date, '2026-07-02', '2026-07-05') },
        { label: 'Verify', note: 'Recovered — score 78 → 39', date: '2026-07-09', state: stepState(date, '2026-07-09') },
      ],
      closedNote:
        date >= '2026-07-09'
          ? 'Loop closed Jul 9 — HRV back to baseline, two rest days taken. Score 78 → 39.'
          : undefined,
    };
  }
  return {
    steps: [
      { label: 'Detect', note: 'Watching your workload signals', date: date, state: 'active' },
      { label: 'Understand', note: 'Runs when a trend fires', date: date, state: 'scheduled' },
      { label: 'Act', note: 'Takes work off your plate', date: date, state: 'scheduled' },
      { label: 'Verify', note: 'Confirms the load dropped', date: date, state: 'scheduled' },
    ],
  };
}

// ————— quick wins (right rail): actions with formula-computed score impact —————

export interface BoostItem extends Boost {
  impactPts: number; // computed via the engine's own k + weights, never hardcoded
}

export function getBoostActions(clinicianId: string, date: string): BoostItem[] {
  return boostCatalog(clinicianId, date).map((b) => ({
    ...b,
    impactPts: deltaPts(clinicianId, date, b.deltaT),
  }));
}

// ————— unexplained spike → tag it (the wearable catch nobody logged) —————

export interface SpikeCard {
  id: string;
  window: string;
  detail: string;
  question: string;
  options: string[];
  impactPts: number;
}

export function getSpike(clinicianId: string, date: string): SpikeCard | null {
  // Chen, today: a strain spike with no movement and nothing on the schedule —
  // detected from ingested wearable telemetry (HR + HRV + movement gate).
  if (clinicianId === 'chen' && date === '2026-07-18') {
    return {
      id: 'chen-spike-0718',
      window: '2:10 – 2:35 PM',
      detail: 'HR 104 · HRV 52% below your baseline · no movement · nothing on your schedule',
      question: 'Was it a code, a hard conversation, or something else?',
      options: ['Code', 'Hard conversation', 'Unexpected admission', 'Something else'],
      impactPts: deltaPts(clinicianId, date, SPIKE_TAG_DELTA_T),
    };
  }
  return null;
}

// ————— trend, in words —————

export function getTrendPhrase(clinicianId: string, date: string): string {
  const series = getScoreSeries(clinicianId).filter((p) => p.date <= date);
  if (series.length < 3) return '21-day trend — just getting to know your baseline';
  const window = series.slice(-8);
  let rises = 0;
  for (let i = 1; i < window.length; i++) if (window[i].loadIndex > window[i - 1].loadIndex) rises++;
  const delta = window[window.length - 1].loadIndex - window[0].loadIndex;
  if (delta > 4) {
    return rises >= 5
      ? '21-day trend — up nearly every day this week'
      : `21-day trend — today is rise ${rises} this week`;
  }
  if (delta < -4) return '21-day trend — easing, down from the peak this week';
  return '21-day trend — holding steady this week';
}
