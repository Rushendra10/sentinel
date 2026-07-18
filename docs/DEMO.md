# Sentinel — Demo Runbook (2:45)

Pre-flight: `npm run dev` → http://localhost:3000 · Chrome · zoom 125% · sound ON · notifications OFF · timeline visible (`d` toggles) · persona **Chen**, date **Jul 18**. Refresh = full demo reset.

| Clock | Beat | Do | Say |
|---|---|---|---|
| 0:00 | Open | Landing: hero = score 81 CRITICAL + ONE action ("11 notes drafted — sign them and go home"); rails = data sources & the agent's loop | "Every patient in this hospital has someone watching their vitals. Except the doctors. This is Sentinel — today, Dr. Maya Chen is the patient. Notice it doesn't lead with a chart — it leads with the one thing that would help her most right now." |
| 0:20 | The record leads | Jump **Baseline**, then scrub → **Trigger (Jul 7)** → **Body confirms (Jul 9)** | "Burnout shows up in the record before it shows up in the body. The record saw it Tuesday — before the two deaths. Her body confirmed it Thursday." |
| 0:50 | Agents visible | Jump **Today**, open **Tell me more** → agent feed | "Sentinel's Reasoner names the drivers — and its Skeptic pushes back, live. It sustains only after killing the alternatives." |
| 1:05 | **THE CATCH** | Point at the catch event + personal driver | "Cross-referencing her own record: her thyroid prescription lapsed 19 days ago — exactly when this began. Renewal needed a PCP visit she hasn't had in 29 months. She's been treating patients for three weeks while her own prescription sat unfilled. Nothing else in this hospital is allowed to see that. Her agent is — and only she sees why." |
| 1:25 | Voice | Mic → chip 3 (email the chief) → show redaction manifest → Send. (Time permitting: chip 1, Alvarez) | "She can negotiate her day with it. And watch what leaves: workload facts only — the redaction happens before consent." |
| 1:50 | Agent acts | Actions: open a drafted note → Sign. Approve recovery block. Show **Care Plan** | "Eleven notes drafted for sign-off — two hours a night back. And a care plan whose patient is a doctor." |
| 2:05 | Privacy flip | `/admin`: roster (Chen 81 top), her email in inbox, open her profile → locked stubs. Point at Patel 62 + Okafor 31 | "The chief sees enough to act — never what only Dr. Chen should see. Patel: his watch said fine — his own beta-blocker was masking it; that insight exists only on his phone. Okafor: caught, escalated, verified recovered — with zero personal records connected." (If time: flip to Okafor's home — her loop card shows all four steps green and 'Loop closed Jul 9', and her data rail nudges her to wear her watch again.) |
| 2:35 | Verify + close | Back to insights, jump **Verified (Jul 25)**: 81→44, verifier log | "Shiv Rao says clinicians need 27 to 30 hours in a day. We can't give Dr. Chen 30 — but Sentinel gave her back two a night and caught the thing she was too busy to catch for herself. Sentinel — it watches over the people who watch over everyone else." |

## Fallbacks
- Wifi/API dead → app is already offline-first; nothing changes.
- Mic fails → click the suggestion chips (identical outcome); text input as last resort.
- Sound blocked → skip announce line; chips still work silently.
- Catastrophe → backup screen recording on the desktop.

## Q&A cheat sheet — see SPEC.md §11
Top three: privacy-of-the-score (consent contract — hospital already owns Tier 1, Epic sells it as Signal) · "isn't note-drafting Abridge's?" (one intervention arm — we'd integrate Abridge, not compete) · "diagnosis?" (risk pattern, never a diagnosis).
