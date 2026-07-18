# Sentinel

**The clinician is the patient.** Sentinel is an agentic system that watches the data a hospital already generates (EHR activity, scheduling) plus the clinician's own private signals (wearable, personal health record), detects burnout **before it lands** — the record leads, the body confirms — then **acts**: drafts the note backlog, triages the inbox, renegotiates the schedule by voice, escalates with consent behind a hard privacy wall, and verifies the load actually dropped.

Built in one day at the Abridge × Anthropic × Lightspeed hackathon (July 18, 2026). **All data is synthetic**, seeded to published occupational-stress effect sizes; integrations are mocked interfaces mirroring real products (Epic Signal, QGenda, Apple HealthKit, pharmacy fill feeds).

## Run it

```bash
npm install
npm run dev        # → http://localhost:3000
```

Works fully offline out of the box (curated agent outputs). To run the agents live on Claude:

```bash
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
```

`DEMO_MODE=cached` forces offline mode even with a key.

## The demo

- `/` — the clinician's view: Load Index, top drivers, "Tell me more," talk to Sentinel (voice)
- `/insights` — full trajectory, drivers by privacy tier, live agent feed (Reasoner vs. Skeptic), sign-off actions, the Care Plan
- `/admin` — the CMO's view: roster risk, escalation inbox — and everything private locked away
- Press **`d`** to toggle the demo timeline (scrub Jun 28 → Jul 25, jump to Trigger / Catch / Verified, switch personas)

Three cases ship in the data: **Dr. Chen** (lapsed personal prescription caught mid-crisis — intervention fires today), **Dr. Patel** (beta-blocker masking his wearable's strain signal — caught yesterday), **Dr. Okafor** (pure workload catch — loop already closed and verified, with zero personal records connected).

## Honest claims

Sentinel flags "a pattern consistent with elevated burnout risk" — never a diagnosis. See `docs/SPEC.md` for the full product spec and `docs/PLAN.md` for how it was built.
