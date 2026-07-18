// lib/types.ts — FROZEN CONTRACTS. All workstreams import from here. Do not edit;
// if a contract blocks you, flag it to the orchestrator in your final report.

export type TierKey = 'workload' | 'body' | 'personal';
export type RiskTier = 'stable' | 'elevated' | 'high' | 'critical';

export interface Clinician {
  id: string; // 'chen' | 'patel' | 'okafor' | roster ids
  name: string; // 'Maya Chen'
  credentials: string; // 'MD'
  role: string; // 'Attending Physician'
  specialty: string; // 'Emergency Medicine'
  unit: string; // 'ED'
  consent: { workload: true; body: boolean; personal: boolean };
  baselines: {
    hrvRmssd: number; restingHr: number; sleepH: number;
    afterHoursMin: number; backlog: number; encounters: number;
  };
}

export interface AcuityEvent {
  kind: 'death' | 'code' | 'icu_transfer' | 'near_miss';
  note: string;
}

export interface DayMetrics {
  date: string; // 'YYYY-MM-DD'
  workload: {
    afterHoursMin: number; noteBacklog: number; inboxOpen: number; inboxLatencyH: number;
    encounters: number; ordersPlaced: number; consecutiveDays: number; scheduledH: number;
    ptoDay: boolean; acuityEvents: AcuityEvent[];
  };
  body?: { hrvRmssd: number; restingHr: number; sleepH: number; sleepEff: number; steps: number };
  personal?: {
    medications: {
      name: string; dose: string; lastFill: string; daysSupply: number;
      refillsRemaining: number; drugClass?: string;
    }[];
    conditions: string[];
    lastPcpVisit: string;
    labs: { name: string; value: string; date: string }[];
  };
}

export interface Driver {
  id: string;
  tier: TierKey;
  label: string; // 'After-hours charting: 140 min'
  detail: string; // one human sentence
  value: string; // '140 min'
  deltaVsBaseline: string; // '+250% vs your baseline'
  severity: 1 | 2 | 3;
  spark?: number[]; // ~last 14 daily values for a sparkline
}

export interface ScoreDay {
  date: string;
  loadIndex: number; // 0–100
  tier: RiskTier;
  trajectory: 'rising' | 'flat' | 'falling';
  drivers: Driver[]; // all tiers, severity-ranked
  triggers: { leadFired?: string; bodyConfirmed?: string; personalCatch?: string }; // dates
  adjustment?: { reason: string; naiveIndex: number }; // Patel med recalibration
}

export interface ScorePoint { date: string; loadIndex: number; tier: RiskTier }

export interface EventPin {
  date: string;
  label: string;
  kind: 'coverage' | 'death' | 'trigger' | 'confirm' | 'near_miss' | 'catch' | 'intervention' | 'verify' | 'recovery';
}

export type AgentName = 'sentinel' | 'reasoner' | 'skeptic' | 'advocate' | 'verifier' | 'converse';

export interface AgentEvent {
  id: string;
  ts: string; // ISO datetime — the feed is filtered by timeline date
  agent: AgentName;
  model?: string; // e.g. 'claude-sonnet-5' — shown as a badge on LLM agents
  kind: 'finding' | 'reasoning' | 'challenge' | 'resolution' | 'action' | 'verification';
  text: string;
  refs?: string[]; // metric reference chips, e.g. 'HRV −40%'
  artifactId?: string;
}

export type ArtifactType =
  | 'note_draft' | 'inbox_triage_plan' | 'schedule_proposal' | 'refill_request'
  | 'pcp_appointment_draft' | 'escalation_email' | 'care_plan';
export type ArtifactStatus = 'draft' | 'signed' | 'approved' | 'sent';

export interface Artifact {
  id: string;
  type: ArtifactType;
  title: string;
  bodyMd: string; // markdown
  status: ArtifactStatus;
  needsVerification?: string[]; // note_draft: items flagged for clinician review
  redactionManifest?: { included: string[]; excluded: string[] }; // escalation_email
  meta?: Record<string, string>; // e.g. { to: 'Dr. James Whitfield', queued: '9 more notes drafted' }
}

export interface CannedRun { events: AgentEvent[]; artifacts: Artifact[] }

export interface Encounter {
  id: string;
  time: string; // '16:30'
  patient: string;
  reason: string;
  acuity: 'low' | 'moderate' | 'high';
  flexible: boolean; // clinically safe to defer/move
  telehealthOk?: boolean;
  note?: string; // 'waited 3 weeks to see Dr. Chen'
}

export interface InboxEmail {
  id: string;
  from: string;
  to: string;
  sentAt: string; // ISO
  subject: string;
  bodyMd: string;
  redactionManifest: { included: string[]; excluded: string[] };
}

export type ConverseEffect =
  | { kind: 'reschedule'; encounterIds: string[]; summary: string }
  | { kind: 'budget'; booked: number; recommended: number; deferralIds: string[]; summary: string }
  | { kind: 'email'; email: InboxEmail };

export interface ConverseReply { reply: string; effect?: ConverseEffect }

export interface CannedConversation {
  key: 'alvarez' | 'budget' | 'email';
  utterance: string; // what the clinician says — chip label + transcript line
  response: ConverseReply;
}

// ——— Admin payloads are built by lib/privacy/projection.ts and NEVER contain body/personal fields ———

export interface AdminRosterRow {
  clinicianId: string; name: string; credentials: string; unit: string; specialty: string;
  loadIndex: number; tier: RiskTier; trajectory: 'rising' | 'flat' | 'falling';
  spark: number[]; // last 21 loadIndex values
  visibleDrivers: Driver[]; // tier === 'workload' ONLY
  lockedFactorCount: number; // count of private factors, never their content
}

export interface AdminProfile {
  clinician: { id: string; name: string; credentials: string; unit: string; specialty: string; role: string };
  scoreDay: ScoreDay; // drivers: workload only; adjustment stripped
  lockedFactorCount: number;
  spark: number[];
}
