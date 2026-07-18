'use client';
// lib/store.ts — the single client-side demo state. Everything time-aware derives
// from currentDate; all demo mutations (sign, send, reschedule) live here.
// Refresh = clean demo reset, by design.

import { create } from 'zustand';
import { DEMO } from './branding';
import type { ArtifactStatus, InboxEmail } from './types';

interface DemoStore {
  currentDate: string; // 'YYYY-MM-DD' — the timeline cursor ("today")
  clinicianId: string; // active persona: 'chen' | 'patel' | 'okafor'
  timelineOpen: boolean;
  announced: boolean; // the one-time voice announcement fired

  artifactStatus: Record<string, ArtifactStatus>; // overrides on canned artifact status
  rescheduledIds: string[]; // encounter ids moved by the agent
  emailDraft: InboxEmail | null; // escalation email awaiting confirm
  sentEmails: InboxEmail[]; // appear in the admin inbox
  takenBoosts: Record<string, true>; // quick-win actions taken this session
  spikeTags: Record<string, string>; // spikeId -> chosen tag ("explained" reclassification)

  setDate: (d: string) => void;
  setClinician: (id: string) => void;
  toggleTimeline: () => void;
  markAnnounced: () => void;
  setArtifactStatus: (id: string, s: ArtifactStatus) => void;
  applyReschedule: (ids: string[]) => void;
  setEmailDraft: (e: InboxEmail | null) => void;
  sendEmail: (e: InboxEmail) => void;
  takeBoost: (id: string) => void;
  tagSpike: (spikeId: string, tag: string) => void;
}

export const useDemoStore = create<DemoStore>((set) => ({
  currentDate: DEMO.today,
  clinicianId: 'chen',
  timelineOpen: true,
  announced: false,

  artifactStatus: {},
  rescheduledIds: [],
  emailDraft: null,
  sentEmails: [],
  takenBoosts: {},
  spikeTags: {},

  setDate: (d) => set({ currentDate: d }),
  setClinician: (id) => set({ clinicianId: id }),
  toggleTimeline: () => set((s) => ({ timelineOpen: !s.timelineOpen })),
  markAnnounced: () => set({ announced: true }),
  setArtifactStatus: (id, status) =>
    set((s) => ({ artifactStatus: { ...s.artifactStatus, [id]: status } })),
  applyReschedule: (ids) =>
    set((s) => ({ rescheduledIds: [...new Set([...s.rescheduledIds, ...ids])] })),
  setEmailDraft: (e) => set({ emailDraft: e }),
  sendEmail: (e) =>
    set((s) => ({ sentEmails: [...s.sentEmails, e], emailDraft: null })),
  takeBoost: (id) => set((s) => ({ takenBoosts: { ...s.takenBoosts, [id]: true } })),
  tagSpike: (spikeId, tag) => set((s) => ({ spikeTags: { ...s.spikeTags, [spikeId]: tag } })),
}));
