# SENTINEL — Product & System Spec
### Abridge × Anthropic × Lightspeed Hackathon — July 18, 2026
**This file is the single source of truth. Builder agents: read it fully before writing code. PLAN.md has your task assignments. The demo script (§10) is the product's north star — judging is demo-only.**

---

## 0. One-liner & punchline

**Sentinel** — an agentic system that treats the clinician as the patient. It watches the data a hospital already generates plus the clinician's own private health signals, detects burnout **before it lands** (the record leads, the body confirms), and then **acts**: clears work, renegotiates the schedule, escalates with consent — and verifies the load actually dropped.

- **Punchline (first 10 seconds of demo):** "Every patient in this hospital has someone watching their vitals. Except the doctors. Today, Dr. Maya Chen is the patient."
- **Close (last line):** "Sentinel — it watches over the people who watch over everyone else."
- Branding: product name **Sentinel** everywhere (UI header, repo, care plan signature "— Sentinel, your agent"). Keep name in one config constant (`lib/branding.ts`) so it's a 1-minute rename.

### Why this wins (judge alignment — do not drift from these)
| Judge | What they reward | How Sentinel hits it |
|---|---|---|
| Abridge | Agents that **act on** clinical data, not transcribe; multi-agent w/ auditor agents (they run these in prod); clinician empowerment ("27–30 hours in a day") | Agent clears note backlog, triages inbox, changes schedules; visible Reasoner-vs-Skeptic disagree→resolve; the whole product is FOR the clinician |
| Anthropic | Claude visibly doing the agentic work; consumer health-data connectors (Apple Health) are their stated roadmap; longitudinal record moonshot | Claude-badged agents in a live feed; wearable + personal-record fusion IS a patient-facing agent over personal records — where the patient is the clinician |
| Lightspeed | AI that fills labor gaps / fights burnout economics, autonomous clinical & voice agents | Burnout = $4.6B/yr + turnover commonly cited at $500K–$1M per physician; voice copilot the clinician negotiates their day with |
| Prior winners' pattern | Voice-first, real-time, clinically consequential, visible multi-step autonomy | Voice conversation w/ real actions; live agent feed; a named clinical consequence in the catch |

**Anti-patterns to never resemble:** ambient note-taking product (note-drafting is one *intervention arm*, framed as "the agent clears the backlog"), vanilla prior-auth, admin-first tooling, mental-health chatbot, "chat with your PDF," a dashboard that only *reports*.

**Honesty guardrails (all copy, all prompts):** Sentinel flags "a pattern consistent with elevated burnout risk" — never a diagnosis. Data is synthetic, seeded to published occupational-stress effect sizes (HRV suppression 30–50% under sustained stress). Integrations are mocked interfaces mirroring real products (Epic Signal, QGenda, Apple HealthKit, pharmacy fill feeds) — say so plainly if asked.

---

## 1. The three cases (comprehensive, not staged)

The system ships with **14 clinicians**. Three are fully-developed cases, each with a **different catch type** and each at a **different stage of the agent loop** — so the product reads as *deployed and living*, not built around one scripted path. Eleven more form a realistic roster. Demo "today" = **Sat Jul 18, 2026**. Data window: **Jun 28 – Jul 18**, plus a **Jul 19–25 verification extension** reachable via the demo timeline.

### Case 1 — Dr. Maya Chen, 38, Emergency Medicine attending
**Catch: lapsed personal prescription (personal tier). Loop stage: intervention fires TODAY — this is the live demo spine.**

Story: A colleague went on leave Jul 5; Chen absorbed shifts. 14 consecutive days by Jul 18. After-hours charting 40→140 min/night; backlog 2→11 notes. Two patient deaths (Jul 8 sepsis arrest, Jul 9 failed resuscitation). Jul 14: dosing-order near-miss caught by pharmacist (no harm — fatigue's leading indicator). Body: HRV 45→27 ms (−40% vs baseline), resting HR 62→71, sleep 7.4→5.1h.

**The catch:** Her own record (Tier 3) shows hypothyroidism (dx 2021), levothyroxine 88 mcg daily, adherent 18 months. **Last fill May 30 → supply exhausted ~Jun 29 → 19 days unmedicated by Jul 18.** Why it lapsed: the renewal required an annual PCP visit — **last PCP visit Feb 2024 (29 months ago)**; she canceled her March renewal appointment for a shift swap and never rebooked. Last TSH: Feb 2024. The fill gap opens exactly where the 21-day chart begins — untreated hypothyroid fatigue compounding occupational load, invisible to any system not allowed to see her own chart.

Anchor values (data + score engines MUST hit these; interpolate with noise between):

| Date | AfterHrs min | Backlog | Consec. days | HRV ms | RHR | Sleep h | Events | **Load Index** |
|---|---|---|---|---|---|---|---|---|
| Jul 1 | 45 | 2 | 2 | 44 | 62 | 7.4 | — | **24 Stable** |
| Jul 5 | 60 | 4 | 1 | 42 | 63 | 7.0 | coverage starts | 30 |
| Jul 7 | 85 | 6 | 3 | 38 | 64 | 6.4 | **Sentinel trigger (Tue)** | **41 Elevated** |
| Jul 9 | 95 | 7 | 5 | 33 | 66 | 6.1 | death ×2 (Jul 8, 9); **body confirm (Thu)** | **52 Elevated** |
| Jul 12 | 110 | 8 | 8 | 31 | 68 | 5.8 | — | **58 High** |
| Jul 14 | 125 | 9 | 10 | 29 | 69 | 5.4 | near-miss caught | 66 |
| Jul 16 | 135 | 10 | 12 | 28 | 70 | 5.2 | — | **74 Critical** |
| **Jul 18** | 140 | 11 | 14 | 27 | 71 | 5.1 | **catch + intervention (demo)** | **81 Critical** |
| Jul 25 | 55 | 3 | — | 36 | 66 | 6.9 | verified; refill filled Jul 19; PCP booked Aug 3; recovery days Jul 20 & 24 | **44 Elevated ↓** |

Interventions generated today: 11 note drafts for sign-off · inbox triage (14 routine drafts, 3 escalated to her) · protected recovery block + shift-relief proposal · levothyroxine refill request + PCP appointment draft (Aug 3) · consent-gated escalation email to department chief · Care Plan artifact.

### Case 2 — Dr. Anand Patel, 51, hospitalist (Internal Medicine)
**Catch: medication-masked vitals (personal tier reinterprets body tier). Loop stage: detected YESTERDAY (Jul 17) — contextualized, monitoring.**

Story: Unit short-staffed; census 14→22 patients/day over 3 weeks; after-hours 35→85 min; inbox latency doubling; sleep 6.9→6.0h. He's on **metoprolol 50 mg** (hypertension, dx 2019) — beta-blockade caps heart-rate response, so his consumer wearable reads resting HR 58–62, "excellent," all month. Raw HR-derived strain: ~40th percentile. **Sentinel, knowing his med list, recalibrates against his medicated baseline → 88th percentile.** HRV vs his own medicated baseline (38 ms): 38→29 (−24%).

- Naive score would read ~38 (Stable/Elevated border). **Medication-adjusted Load Index: 62 (High), rising.**
- Landing insight card (his view only): *"Your watch says you're fine. Adjusted for your beta-blocker, you're not — heart-rate response is capped by metoprolol, so Sentinel recalibrates your strain against your medicated baseline."*
- Status: two census-relief actions proposed and pending; monitoring active.
- Clinical phrasing rule: only claim "beta-blockade blunts heart-rate response; HR-derived strain is recalibrated." Do NOT make strong claims about HRV direction under beta-blockade (cardiologists may be in the room).
- Privacy: admin sees 62 + workload drivers + "1 private factor contributing 🔒". Never the word metoprolol.

### Case 3 — Dr. Sarah Okafor, 44, ICU intensivist
**Catch: pure workload (no personal-health data at all). Loop stage: CLOSED — verified recovery, the proof the loop works.**

Story (Jun 28–Jul 10): two patient deaths in 48h (Jun 30, Jul 1), 11 consecutive days, after-hours 120 min, HRV −38%, sleep 5.3h. Sentinel fired Jun 30 → with her consent, escalation email sent Jul 2 (sits in admin inbox, timestamped) → chief adjusted coverage Jul 3 → 11 notes drafted & signed Jul 2 → recovery days Jul 4–5 → **Verifier closed the loop Jul 9: score 78→39, all metrics recovered.** Today: **31, Stable.**

- **Consent granularity showcase:** Okafor connected workload + wearable but **declined to connect personal records** — Sentinel still caught her. Tiers are optional; the system degrades gracefully. (Line for judges: "Sentinel never needed her chart. It needed permission to care.")
- Her insights view renders the *completed* loop timeline with the Verifier's log — the artifact proving interventions actually reduce load.

### Roster (11 more — admin-view realism)
Named, varied: ~7 physicians, 2 NPs, 2 RNs across ED / ICU / Med-Surg / Oncology / Hospitalist. Load Index 18–56, mixed trajectories, 2–3 showing "🔒 private factors contributing" chips, **nobody else Critical** (Chen must be unambiguous). Generator produces plausible series from archetype params — no hand-tuning needed beyond ranges.

---

## 2. Data sources (practical US-healthcare shapes; all mocked, elegantly)

Every source mirrors a **real, named** product/API category so clinicians recognize it instantly. Mock generators must produce weekday texture, realistic noise, internal causality (backlog↑ ⇒ after-hours↑ next day; death ⇒ HRV dip with 1–2 day lag), and NO suspiciously round numbers. Deterministic seed (fixed, checked in) — same data every run.

**Tier 1 — Workload & system (hospital-owned; visible to clinician AND admin):**
1. **EHR activity telemetry** (mirrors *Epic Signal* — a real Epic product measuring exactly this): time-in-system, after-hours documentation ("pajama time," note-authored timestamp vs schedule), note backlog, In Basket volume + response latency, orders volume.
2. **EHR clinical/ops events** (FHIR-shaped): encounters/census per day, case-mix acuity, critical events attributed to the clinician (codes, deaths, ICU transfers), safety near-misses (pharmacy-caught corrections).
3. **Scheduling system** (mirrors QGenda/Amion): shifts, on-call blocks, consecutive-day runs, PTO taken/deferred, open coverage gaps + colleagues' open slots (needed by voice tools).

**Tier 2 — Body (clinician's own devices; PRIVATE):**
4. **Wearable via Apple Health / Health Connect export**: daily HRV (RMSSD), resting HR, sleep duration + efficiency, steps/active minutes. 28-day personal baselines per clinician.

**Tier 3 — The clinician's own healthcare record (patient-access APIs; MOST PRIVATE):**
5. **Personal health record** (mirrors Apple Health Records / Blue Button-style patient-access FHIR): conditions, medication list, **pharmacy fill history** (adherence gaps are computed from fill dates — this is how adherence is really measured), last PCP visit, key labs with dates.

(P2 garnish only: one-tap energy check-ins / EMA. Skip unless ahead of schedule.)

**Justification line for judges:** "Everything in Tier 1 the hospital already collects — Epic literally sells it as Signal. Tiers 2 and 3 are what only the clinician can consent to connect — and the privacy wall is why they would."

---

## 3. Privacy architecture (core feature — must be VISIBLE, not just absent data)

- **Consent contract:** the clinician opts in per tier. The **composite Load Index + tier + Tier-1 drivers are shareable** with the hospital; **Tier 2/3 data and any driver derived from them never leave the clinician's view.** Admin sees only "N private factors contributing 🔒".
- **Rationale (Q&A):** sharing the composite while sealing the drivers is the deal that makes clinicians willing to connect private data at all; the hospital already owns Tier 1. The wall protects what's newly connected.
- **Escalation email = privacy performing on camera:** every outbound escalation renders with a **redaction manifest**: "Includes: consecutive days (14), after-hours trend, backlog. Excludes: all health data." The audience watches private data get stripped *before* consent.
- **Admin redacted profile:** identical layout to the clinician's insights page, but Tier-2/3 rows render as locked stubs ("2 private factors — visible only to Dr. Chen"). The side-by-side is the visceral beat.
- **Okafor = granular consent proof** (no Tier 3 connected; system still worked).
- Wearable + PHR data never appear in any admin payload — enforce in code by splitting the API response by role, not by hiding in the UI (say this if asked: "the admin response never contains the fields").

---

## 4. Load Index (scoring model — deterministic code, zero LLM)

Per clinician, per day. Every metric normalized against the clinician's **own 28-day baseline** (never population), deviations clamped [0, 3].

```
W (workload, leads)  = 1.5·afterHoursDev + 1.2·backlogDev + 1.0·volumeDev
                     + 2.0·acuityLoad + 1.0·recoveryDeficit
B (body, confirms)   = 2.0·hrvSuppression + 1.2·rhrElevation + 1.2·sleepDeficit

LoadIndex = round( 100 · (1 − e^(−k·(W+B))) )      // calibrate k to hit §1 anchors ±3
```

- `afterHoursDev` etc. = (value − baseline)/baseline, clamped. `acuityLoad` = weighted event count (death=1.0, code/ICU-transfer=0.6, near-miss=0.4) with 7-day exponential decay, cap 3. `recoveryDeficit` = consecutiveDays/7 + 1 if no low-load day in trailing 7d. `hrvSuppression` = max(0, 1 − rmssd/μ28)·3.
- **Tiers:** 0–34 **Stable** (emerald) · 35–54 **Elevated** (amber) · 55–69 **High** (orange) · 70+ **Critical** (red).
- **Trajectory > absolute.** Triggers:
  - **Lead trigger (Sentinel fires):** 3-day rising EMA of W AND W > 1.5× personal W-baseline. (Chen: Tue Jul 7 — before the deaths.)
  - **Body confirmation (severity escalates):** HRV ≤ −20% vs baseline sustained 3d OR sleep <6.5h ×3d, while lead active. (Chen: Thu Jul 9.)
  - **Personal-context catch (Tier 3 rules, evaluated only clinician-side):** medication fill gap ≥14 days overlapping an active elevated episode (Chen) · med-class recalibration shifting the index ≥15 points (Patel: beta-blocker → HR-derived inputs recomputed against medicated baseline) · overdue own-care markers (no PCP ≥24 months) surfaced as context, never as score points.
- **Tier-3 data NEVER adds score points.** It *modifies interpretation* (recalibration, compounding-context flags, intervention urgency). This keeps the shared composite defensible while making the private tier the source of the catch.

---

## 5. Agent architecture (make the agents VISIBLE)

Five named pipeline agents + one conversational copilot. All LLM agents are **Claude, model-badged in the feed** (Anthropic visibility = free points). Numeric detection is plain code — never LLM (§4).

| Agent | Engine | Role | Output |
|---|---|---|---|
| **Sentinel** | code | scores, trends, triggers | structured findings w/ metric refs |
| **Reasoner** | Claude | primary driver, compounders, Tier-3 context integration, plain-language risk summary | JSON (forced via tool-use) |
| **Skeptic** | Claude | adversarial audit: tries to REFUTE (normal variation? on-service month? single outlier? data artifact?) | verdict sustain/overturn + strongest alternative rejected |
| **Advocate** | Claude | drafts interventions sized to drivers | artifact array (below) |
| **Verifier** | code + Claude one-liner | re-reads data at +7d, logs deltas, closes or escalates | verification log |

**The disagree→resolve beat is required** (Abridge runs auditor agents in production): Skeptic must visibly challenge before sustaining. Prompt it: *"If evidence is genuinely strong, sustain — but name the strongest alternative explanation you rejected and why."*

**Artifacts** (Advocate output; rendered as sign-off cards): `note_draft` (from mock ambient encounter vignettes; system prompt: *"accurate to the encounter; invent nothing; flag uncertain items for review"*) · `inbox_triage_plan` · `schedule_proposal` (recovery block / shift relief) · `refill_request` · `pcp_appointment_draft` · `escalation_email` (with redaction manifest) · `care_plan` (the punchline artifact — patient-style care plan for the doctor, signed "— Sentinel, your agent").

**Converse (voice/chat copilot)** — Claude with tools; compact context: today's schedule, score state, consent flags, load budget. Tools (mock side effects mutate in-memory state so the UI visibly changes):
```
get_today_schedule()                      → encounters w/ acuity, times, flexibility flags
compute_load_budget()                     → { booked: 19, recommended: 14, rationale }
propose_reschedule(encounter_ids, target) → updated schedule (colleague open slots / telehealth)
draft_escalation_email(recipient)         → draft + redaction manifest (Tier-1 facts only)
send_escalation_email(draft_id)           → requires explicit user confirm; lands in admin inbox
get_score_state()                         → index, tier, top drivers (tier-tagged)
```

**Cost & reliability rules:** pre-aggregate to compact JSON — never send raw day-series or FHIR bundles. Default model `claude-sonnet-5` everywhere (latency); optionally `claude-fable-5` for Reasoner only. **Canned-response cache is mandatory:** every call keyed `(agent, clinicianId, day)`; pre-generated JSON checked into repo; runtime = live-with-fallback (timeout ~6s → canned) + `DEMO_MODE=cached` env for guaranteed-offline demo. Feed renders canned content with the same typewriter stream — visually identical.

---

## 6. Voice interaction (the wow — with an unsinkable fallback ladder)

**Announce moment:** when the timeline reaches Critical (Jul 18), a pre-rendered voice line plays:
> "Dr. Chen — your load index has crossed into critical. I've prepared some options. Talk to me when you have thirty seconds."

**Conversation loop:** push-to-talk (hold mic button / spacebar) → Web Speech API STT (Chrome) with live transcript → `/api/converse` (Claude + tools, streaming) → reply streams into overlay → TTS speaks the first sentence ASAP (browser `speechSynthesis`; ElevenLabs only if key present and tested). Show a "thinking" waveform so the ~2s pause reads as intentional. Latency budget: first spoken word <2.5s after release.

**Three rehearsed utterances (exact expected behavior — these also define the canned fallback):**
1. *"Mrs. Alvarez has been waiting weeks to see me and she's important to me — can I see her and still get out on time?"* → checks schedule + budget: "Yes — keep her 4:30. I can move your two low-acuity follow-ups into Dr. Kim's open slots tomorrow; you'd be out by 6:15. Want me to?" → confirm → schedule visibly updates.
2. *"How many patients can I actually take today?"* → "You're booked for 19. Your recovery-adjusted budget is 14. Here are five safe deferrals — two already agreed to telehealth follow-up." → deferral chips render.
3. *"Send an email to the department chief — let them know I'm close to burnout so they can adjust my shifts."* → draft renders **with redaction manifest** → "Only your workload data is included — your health data stays here. Send?" → confirm → email lands in admin inbox (shown later in demo).

**Fallback ladder (ship all three, decide morning-of):** ① live mic → ② typed input with spoken reply → ③ hotkey-triggered canned playback (pre-recorded audio + scripted transcript, indistinguishable to the audience). The demo must never die on a microphone.

---

## 7. UI spec (health-app aesthetic; landing stays CLEAN)

**Design language:** calm consumer-health (Apple Health / Whoop energy), light theme, generous whitespace, Inter font. Tier colors: Stable emerald · Elevated amber · High orange · Critical red. Tier icons: 🏥 shared (building, lucide) · 🔒♥ body · 🔒🛡 personal. Builder MUST invoke the **dataviz skill** before writing any chart code; charts via Recharts, precomputed fixed-size data.

### Pages
**`/` — Clinician home (defaults to Dr. Chen).** Uncrowded, score-first:
- Greeting + date. Big **score ring** (81 · CRITICAL · ▲ rising) with 21-day sparkline beneath.
- **Top 3 danger factors** as cards, one line each, tier-chip on every card: "After-hours charting 140 min 🏥" · "HRV 40% below your baseline 🔒♥" · "Levothyroxine gap — 19 days 🔒🛡".
- Primary CTA: **Tell me more** → `/insights`. Secondary: **mic button** ("Talk to Sentinel").
- Footer link: "Private by design — see what your hospital sees" → privacy-flip modal (renders the admin-redacted version of this page in place).
- Nothing else on this screen.

**`/insights` — the comprehensive view (behind Tell me more):**
(a) Score trajectory chart, tier bands shaded, event pins (coverage starts, deaths, trigger Jul 7, confirmation Jul 9, near-miss, catch/today) · (b) all drivers grouped by tier with lock chips + per-driver sparklines · (c) **Agent activity feed** — Sentinel→Reasoner→Skeptic→Advocate→Verifier timeline, Claude model badges, Skeptic challenge rendered as visible disagree→resolve, typewriter streaming · (d) **Actions panel** — sign-off cards: 11 note drafts (open one → sign), inbox triage, recovery-block proposal, refill request, escalation email (send flow w/ redaction manifest) · (e) **Care Plan** artifact — patient-style document for Dr. Chen, the metaphor moment · (f) Verification card (scheduled Jul 25 → after time-travel: Verifier's logged results).

**Voice overlay:** full-screen glass panel — waveform, live transcript bubbles, action chips appearing as tools fire, dismiss returns to page.

**`/admin` — Chief/CMO view:**
- Unit strip (avg index by unit) + roster table: name, unit, tier pill, 21-day sparkline, trajectory arrow, visible (Tier-1) driver preview, "🔒 N private factors" chip count.
- **Escalation inbox:** Okafor's Jul 2 email (historic, timestamped) + Chen's arriving live when sent during the demo.
- Click a clinician → **redacted profile** (same layout as `/insights`, Tier-2/3 rows as locked stubs). Patel shows 62 High with "1 private factor 🔒" — the admin can act, but can't see why.

**Demo timeline bar (the time machine):** slim bottom bar, toggled with `d`. Date slider Jun 28 → Jul 25 with jump chips: [Baseline] [Trigger Jul 7] [Body confirm Jul 9] [Today / Catch Jul 18] [Verify Jul 25], plus persona switcher [Chen] [Patel] [Okafor]. All page state derives from the selected date (single Zustand store). Frame it openly as the simulation timeline — judges like seeing the time machine.

---

## 8. Mock-data engineering notes (elegance = credibility)

- Deterministic seeded RNG (fixed seed constant). No `Date.now()` — "today" comes from the timeline store (defaults to Jul 18, 2026).
- All 14 clinicians get full 21-day series; Chen/Patel/Okafor must pass through their §1 anchor tables (generator interpolates between anchors with bounded noise; assert anchors in a check script).
- Names/units/patients: realistic and diverse; no "Test User," no Alice/Bob. Patient names in schedules & note drafts are synthetic but plausible; mark UI footer "All data synthetic."
- Two **ambient encounter vignettes** (structured transcript-summary objects) for Chen so the Advocate's note drafts are grounded — the note content must trace to vignette facts (judges may read the note).
- Schedules must include colleagues' open slots + two patients pre-flagged "agreed to telehealth follow-up" (so voice tool results are grounded, not magical).

---

## 9. API surface (Next.js route handlers)

```
GET  /api/state?clinicianId&date          → scores, drivers (role-split server-side), artifacts, feed events
POST /api/agent/run {clinicianId, date}   → SSE/staged stream of AgentEvents (live Claude w/ canned fallback)
POST /api/converse {clinicianId, message} → streamed reply + tool-call events + side effects
POST /api/actions/:id {approve|sign|send} → mutates in-memory state (schedule, inbox, admin inbox)
GET  /api/admin/roster?date               → Tier-1-only payloads + composite scores (privacy enforced here)
```
Privacy is enforced at the API layer: admin endpoints are built from a projection that never includes Tier-2/3 fields.

---

## 10. Demo script (2:45 — rehearse ×3; the catch is the 20 seconds everything serves)

- **0:00 — Open on Chen's landing.** "Every patient in this hospital has someone watching their vitals. Except the doctors. This is Sentinel — today, Dr. Maya Chen is the patient." Score ring: 81, Critical.
- **0:20 — Time-travel from baseline.** "Burnout shows up in the record before it shows up in the body." Scrub: index climbs, **Sentinel trigger Jul 7** (workload trend — before the deaths), **body confirmation Jul 9** (HRV/sleep). "The record saw it Tuesday. Her body confirmed it Thursday."
- **0:50 — Insights → agent feed.** Reasoner names drivers; **Skeptic challenges** ("could be a normal on-service stretch") → overruled with evidence → resolved on screen.
- **1:05 — THE CATCH (20s, cold rehearsed).** Reasoner cross-references her own record: **levothyroxine gap, 19 days — opened exactly when the crunch began; renewal blocked on a PCP visit she hasn't had in 29 months.** "She's spent three weeks treating patients while her own prescription sat unfilled. No manager, no survey, no wearable app could catch that — they're not allowed to see it. Her agent is. And only she sees why."
- **1:25 — Voice.** Announce line plays → push-to-talk, utterance 3 (email the chief) → draft with **redaction manifest** → send. (If time: utterance 1, the Mrs. Alvarez negotiation → schedule visibly updates.)
- **1:50 — Actions.** Sign one of 11 drafted notes; approve recovery block; refill request sent. **Care Plan renders** — a care plan whose patient is a doctor.
- **2:05 — Privacy flip.** `/admin`: roster heat, Chen's email in the inbox (workload facts only), her profile redacted with locked stubs. "The chief sees enough to act — never what only Dr. Chen should see." Gesture at **Patel** (62 High — "his watch said he was fine; his own medication was masking the strain — that insight exists only on his phone") and **Okafor** (31 Stable — "two weeks ago she was 78; Sentinel escalated with her consent, coverage changed, and it *verified* her recovery — and she never connected her personal records at all").
- **2:35 — Verify.** Scrub to Jul 25: 81→44, Verifier log on screen ("after-hours −61%, backlog cleared, physiological recovery underway"). **Close:** "Shiv Rao says clinicians need 27 to 30 hours in a day. We can't give Dr. Chen 30 — but Sentinel gave her back two hours a night, and caught the thing she was too busy to catch for herself. Sentinel — it watches over the people who watch over everyone else."

**Fallbacks:** `DEMO_MODE=cached` if wifi flakes · voice ladder §6 · backup screen recording of the full path recorded at T+4:00.

---

## 11. Judge Q&A prep (say these confidently)

- **"Isn't the shared score itself a privacy leak?"** — It's the consent contract: the clinician chooses to share the composite *because* the drivers stay sealed. The hospital already owns Tier 1 — Epic sells it as Signal. The wall protects what's newly connected, and it's why clinicians would connect it at all.
- **"Why would clinicians opt in?"** — The agent works for *them*: it clears their backlog, defends their schedule, catches their own lapsed care. The hospital gets a risk signal; the clinician gets two hours a night. Okafor shows tiers are optional.
- **"Isn't note-drafting Abridge's product?"** — It's one intervention arm, and deliberately so — in production we'd integrate Abridge for it, not compete. Sentinel decides *when and why* to deploy relief; the drafting engine is pluggable.
- **"Is this diagnosing burnout?"** — No. It flags "a pattern consistent with elevated burnout risk" against the clinician's own baseline, prompts self-management, and routes consented, redacted signals to staffing. Never a diagnosis.
- **"Is the data real?"** — Synthetic, seeded to published effect sizes (occupational-stress literature ties sustained stress to 30–50% RMSSD suppression; validated burnout metrics like after-hours documentation). Interfaces mirror Epic Signal, QGenda, HealthKit, pharmacy fills — the architecture is source-agnostic.
- **"Beta-blocker physiology?"** — We claim only that beta-blockade caps heart-rate response, so HR-derived strain must be recalibrated against the medicated baseline — the point is medication context changes interpretation, and only a system with consented access to the med list can do that.
- **"Business case?"** — Burnout costs $4.6B/yr; replacing one physician is commonly cited at $500K–$1M. Retention economics fund it; the privacy wall makes adoption possible.
- **"What's real vs. roadmap?"** — Real today: full agent loop on mocked-but-faithful data shapes, live Claude reasoning, working privacy projection. Roadmap: live HealthKit/Signal/QGenda connectors, Abridge integration for drafting, IRB-grade validation.
