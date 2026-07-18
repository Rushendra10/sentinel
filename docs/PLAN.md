# SENTINEL — 4.5-Hour Build Plan
**Builder agents: read SPEC.md fully first. SPEC is the source of truth for all product behavior; this file tells you what to build, in what order, and what "done" means. The demo path (SPEC §10) is sacred — when in doubt, optimize for it.**

---

## 0. Stack & standing decisions (do not relitigate)

- **Next.js 15 (App Router) + TypeScript + Tailwind.** Single app, `npm run dev`, localhost demo. No database — all state in seeded modules + one in-memory mutable store.
- **Charts: Recharts.** UI builder MUST invoke the **dataviz skill** before writing chart code.
- **LLM: `@anthropic-ai/sdk`** in route handlers only. Default model `claude-sonnet-5` (latency); Reasoner may use `claude-fable-5`. JSON outputs forced via tool-use. **Never** send raw day-series — pre-aggregated compact JSON only.
- **Canned-response cache is mandatory** (SPEC §5): live-with-fallback (~6s timeout) + `DEMO_MODE=cached` for guaranteed offline demo.
- **Voice:** Web Speech API (Chrome) for STT, `speechSynthesis` for TTS. Pre-rendered announce audio in `/public/audio/`. Fallback ladder per SPEC §6.
- **State:** one Zustand store: `{ currentDate, activeClinicianId, role }` — every page derives from it. No `Date.now()` anywhere; "today" defaults to `2026-07-18`.
- **Repo:** public GitHub (`sentinel`), MIT, `ANTHROPIC_API_KEY` in gitignored `.env.local` ONLY (public repo — check before every push). README with 3-line run instructions.
- **Determinism:** fixed seed constant; anchor tables (SPEC §1) asserted by a check script.
- **Demo machine:** Chrome, 125% zoom, external audio if venue allows.

## 1. Repo layout (scaffold creates this; everyone stays in their lane)

```
sentinel/
  app/
    page.tsx                    # clinician home (landing)
    insights/page.tsx
    admin/page.tsx
    api/state/route.ts
    api/agent/run/route.ts
    api/converse/route.ts
    api/actions/[id]/route.ts
    api/admin/roster/route.ts
  lib/
    branding.ts                 # { name: "Sentinel", tagline, closeLine }
    types.ts                    # FROZEN CONTRACTS (below)
    store.ts                    # Zustand timeline/persona/role store
    data/                       # Workstream B ONLY
      seed.ts, generator.ts, clinicians.ts, scenario-chen.ts,
      scenario-patel.ts, scenario-okafor.ts, roster.ts,
      schedule.ts, vignettes.ts
    score/                      # Workstream C ONLY
      engine.ts, triggers.ts, calibrate.ts, check-anchors.ts
    agents/                     # Workstream D ONLY
      prompts.ts, orchestrator.ts, converse.ts, tools.ts,
      cache.ts, canned/*.json, generate-canned.ts
    privacy/
      projection.ts             # role-split: admin payloads never contain Tier-2/3 fields
  components/                   # Workstream E ONLY (ui/, charts/, feed/, voice/, admin/)
  public/audio/announce.mp3
  scripts/prerender-audio.sh
  .env.local (gitignored) · README.md
```

## 2. Frozen type contracts (scaffold commits these in `lib/types.ts`; changes ONLY via the orchestrator)

```ts
export type TierKey = 'workload' | 'body' | 'personal';
export type RiskTier = 'stable' | 'elevated' | 'high' | 'critical';
export type Role = 'clinician' | 'admin';

export interface Clinician {
  id: string; name: string; credentials: string; role: string; unit: string;
  avatarSeed: string;
  consent: { workload: true; body: boolean; personal: boolean };
  baselines: { hrvRmssd28d: number; restingHr: number; sleepTargetH: number;
               afterHoursMin: number; backlog: number; encountersPerDay: number };
}

export interface DayMetrics {
  date: string;                                  // '2026-07-18'
  workload: { afterHoursMin: number; noteBacklog: number; inboxOpen: number;
              inboxLatencyH: number; encounters: number; ordersPlaced: number;
              consecutiveDays: number; scheduledH: number; ptoDay: boolean;
              acuityEvents: { kind: 'death'|'code'|'icu_transfer'|'near_miss'; note: string }[] };
  body?:    { hrvRmssd: number; restingHr: number; sleepH: number; sleepEff: number; steps: number };
  personal?: { medications: { name: string; dose: string; lastFill: string; daysSupply: number;
                              refillsRemaining: number; class?: string }[];
               conditions: string[]; lastPcpVisit: string;
               labs: { name: string; value: string; date: string }[] };
}

export interface Driver {
  id: string; tier: TierKey; label: string;      // human phrasing, e.g. "After-hours charting 140 min"
  detail: string; value: string; deltaVsBaseline: string;
  severity: 1|2|3; spark?: number[];
}

export interface ScoreDay {
  date: string; loadIndex: number; tier: RiskTier;
  trajectory: 'rising'|'flat'|'falling';
  drivers: Driver[];                              // ALL drivers, tier-tagged
  triggers: { leadFired?: string; bodyConfirmed?: string; personalCatch?: string };
  adjustment?: { reason: string; naiveIndex: number };   // Patel: med recalibration
}

export type AgentName = 'sentinel'|'reasoner'|'skeptic'|'advocate'|'verifier'|'converse';
export interface AgentEvent {
  id: string; ts: string; agent: AgentName; model?: string;   // 'claude-sonnet-5' badge
  kind: 'finding'|'reasoning'|'challenge'|'resolution'|'action'|'verification'|'tool_call'|'speech';
  text: string; refs?: string[]; artifactId?: string;
}

export type ArtifactType = 'note_draft'|'inbox_triage_plan'|'schedule_proposal'|'refill_request'
                          |'pcp_appointment_draft'|'escalation_email'|'care_plan';
export interface Artifact {
  id: string; type: ArtifactType; title: string; bodyMd: string;
  status: 'draft'|'signed'|'approved'|'sent';
  redactionManifest?: { included: string[]; excluded: string[] };   // escalation_email
  needsVerification?: string[];                                     // note_draft
}

export interface AdminRosterRow {                 // built by privacy projection — NO Tier-2/3 fields exist here
  clinicianId: string; name: string; unit: string; loadIndex: number; tier: RiskTier;
  trajectory: 'rising'|'flat'|'falling'; spark: number[];
  visibleDrivers: Driver[];                        // tier === 'workload' only
  lockedFactorCount: number;
}
```

## 3. Workstreams (one subagent each; parallel after scaffold)

### WS-A — Scaffold & design system *(serial, first ~20 min — everything blocks on this)*
create-next-app + Tailwind + deps (`@anthropic-ai/sdk`, `zustand`, `recharts`, `lucide-react`) · commit `types.ts`, `branding.ts`, `store.ts`, tier color tokens, app shell (nav-less, clean), route stubs returning typed fake data (one hardcoded `ScoreDay`) so every other stream builds against working endpoints · timeline bar skeleton (`d` toggle) · repo init + first push.
**Done when:** `npm run dev` renders landing stub with fake score ring data; all routes respond typed JSON; contracts pushed.

### WS-B — Data engine *(60–75 min)*
Seeded generator + the three protagonist arcs hitting SPEC §1 anchor tables exactly (interpolate + bounded noise between anchors) · 11 roster clinicians from archetype params · Jul 19–25 verification extension for Chen · Patel gets `adjustment` data (naive 38 → adjusted 62) · Okafor gets completed-loop history (email Jul 2, recovery days, verified Jul 9) + `consent.personal = false` · schedules with colleague open slots + 2 telehealth-consented patients (voice tools ground here) · 2 ambient encounter vignettes for Chen · realistic names/units, weekday texture, causality (SPEC §8).
**Done when:** `check-anchors.ts` passes (anchors ±0 for metrics — they're inputs); data reads as deployed-system-real in a 30s eyeball test.

### WS-C — Score engine *(45–60 min)*
Formulas + triggers per SPEC §4 · calibrate `k` so Chen's Load Index hits anchors ±3 (and Patel 62/38 split, Okafor 78→39→31) · tier mapping, trajectory, trigger dates (Chen lead=Jul 7, body=Jul 9, catch=Jul 18; Patel catch=Jul 17; Okafor lead=Jun 30, verified=Jul 9) · driver builder (human-phrased `Driver[]`, tier-tagged, severity-ranked) · privacy projection (`privacy/projection.ts`): admin payload built by *omission*, never filtering client-side.
**Done when:** `check-anchors.ts` asserts all score anchors + trigger dates + "admin projection contains zero body/personal fields" and passes.

### WS-D — Agent service *(75–90 min)*
Prompts (Reasoner, Skeptic w/ mandatory strongest-alternative, Advocate w/ invent-nothing note rule, Verifier one-liner) · orchestrator: staged event stream for `/api/agent/run` (SSE or chunked JSON; typewriter handled client-side) · Converse endpoint with the 6 tools (SPEC §5) + in-memory side effects (schedule mutation, admin inbox append) with confirm gate on `send_escalation_email` · canned cache: `generate-canned.ts` runs every call once against live API and writes `canned/*.json`; runtime falls back on timeout/error; `DEMO_MODE=cached` forces it.
**Done when:** full Chen run produces the SPEC-§10 feed (Sentinel→Reasoner→Skeptic challenge→resolution→Advocate artifacts incl. care plan + redacted email) live AND cached; all three rehearsed utterances work with typed input end-to-end.

### WS-E — UI *(90–120 min, can split into E1 landing+insights / E2 admin+voice)*
Invoke **dataviz skill first**. Landing per SPEC §7 (score ring, 3 factor cards, Tell-me-more, mic, privacy-flip modal — NOTHING else) · Insights (trajectory chart w/ tier bands + event pins, tiered driver groups w/ lock chips, agent feed w/ model badges + disagree→resolve styling + typewriter, actions panel w/ sign/approve/send flows, care plan render, verification card) · Voice overlay (waveform, push-to-talk, transcript bubbles, action chips, typed-input fallback visible on `t`) · Admin (unit strip, roster table, escalation inbox w/ Okafor's historic email, redacted profile w/ locked stubs) · timeline bar finalized (slider + jump chips + persona switcher).
**Done when:** every beat of SPEC §10 is clickable start-to-finish with WS-B/C data and canned agent events; landing passes the "uncrowded" eyeball test; privacy flip is visceral.

### WS-F — Integration, hardening, demo kit *(orchestrator + all, final 60–75 min)*
Wire live Claude → regenerate canned from best outputs · pre-render `announce.mp3` (`scripts/prerender-audio.sh`: ElevenLabs if key, else macOS `say -v` premium voice) · full demo-path walkthrough ×2 fixing anything on the path · record backup screen video of the whole path · README + push · **rehearse the script ×3 with a timer** (the catch beat cold) · submit before deadline.

## 4. Schedule & checkpoints (T0 = build start)

| Clock | Milestone |
|---|---|
| T+0:00 | WS-A scaffold starts (solo) |
| T+0:20 | **CP1: contracts frozen, routes stubbed** → WS-B, C, D, E launch in parallel |
| T+1:15 | **CP2: data+score merged** (anchors pass); E has real numbers; D has canned Chen run |
| T+2:30 | **CP3: integration** — demo path clickable end-to-end (canned OK); admin + voice wired |
| T+3:15 | **FEATURE FREEZE.** Bug-bash ONLY the demo path. Regenerate canned, record backup video |
| T+3:50 | Rehearse ×3, tune the catch beat, decide voice ladder rung + `DEMO_MODE` |
| T+4:15 | Push, README, submission form done (deadline 10pm PT — do not ride it) |

**Priority ladder (cut from the bottom, never the top):**
- **P0 (the demo lives):** landing · insights (chart, drivers, feed, actions, care plan) · Chen full arc + catch · timeline bar · canned agent run · privacy-flip modal + admin roster + Chen redacted profile · voice as canned playback (rung ③).
- **P1:** live Claude runs · live voice loop (rungs ①②) · escalation-email send → admin inbox live flow · Patel + Okafor full pages · verify beat (Jul 25) · Okafor historic email.
- **P2:** ElevenLabs TTS polish · utterances 1–2 live · animations/transitions · evidence chips · EMA garnish.

## 5. Risk register

| Risk | Mitigation |
|---|---|
| API latency/outage mid-demo | canned cache + `DEMO_MODE=cached`; decided before walking on stage |
| Mic/STT fails in a loud room | fallback ladder; typed input styled identically; rung ③ playback indistinguishable |
| Recharts time sink | dataviz skill first; precomputed fixed-size series; no responsive containers on demo screen |
| Claude JSON drift | tool-use forced schemas; canned regeneration at freeze |
| Scope creep (the killer) | feature freeze T+3:15 is absolute; P2 needs orchestrator sign-off |
| Key leak in public repo | key only in `.env.local`; `git grep sk-ant` before every push |
| Anchor drift between streams | `check-anchors.ts` in CI-of-one: run before every merge |
| Demo-machine surprises | rehearse on the actual laptop, Chrome, zoom set, notifications off, power connected |

## 6. Builder-agent ground rules

1. Read SPEC.md before writing anything. The demo script (§10) outranks all other considerations.
2. Stay in your workstream's directories; contracts in `types.ts` are frozen — propose changes to the orchestrator, don't edit.
3. UI agents: invoke the dataviz skill before chart code. Match the health-app design language (SPEC §7).
4. Determinism: fixed seeds, no `Date.now()`, "today" from the store.
5. All copy obeys the honesty guardrails (SPEC §0): risk pattern, not diagnosis; "synthetic data" footer.
6. Commit small and often with conventional messages; never commit `.env.local`.
7. If blocked >10 min, ship the canned/mocked version and flag it — the demo must never depend on your unfinished piece.

## 7. Checklists

**Setup (before T0):** Anthropic credits claimed · `ANTHROPIC_API_KEY` in `.env.local` · Node 20+ · `gh` authed · public repo created · Chrome on demo laptop.
**Pre-demo:** `DEMO_MODE` decision · voice ladder rung decision · audio output tested at venue volume · zoom 125% · notifications off · backup video on desktop · timeline reset to Jul 18, persona Chen, landing page.
**Submission:** repo public + pushed · README run steps verified from clean clone · submission form complete **before** 10pm PT.
