// app/api/agent/run/route.ts — POST { clinicianId } → tries the live Claude pipeline
// (reasoner → skeptic → advocate), falls back to the canned run on any failure or
// missing key, and returns { events, artifacts, mode: 'live' | 'cached' }.
// See docs/SPEC.md §9 (API surface) and §5 (agent architecture).

import { NextResponse } from 'next/server';
import { getCannedRun } from '../../../../lib/agents/canned';
import { run as runLive } from '../../../../lib/agents/live';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const clinicianId = (body as { clinicianId?: unknown } | null)?.clinicianId;
  if (typeof clinicianId !== 'string' || clinicianId.length === 0) {
    return NextResponse.json({ error: 'clinicianId is required' }, { status: 400 });
  }

  const live = await runLive(clinicianId);
  if (live) {
    return NextResponse.json({ events: live.events, artifacts: live.artifacts, mode: 'live' });
  }

  const canned = getCannedRun(clinicianId);
  return NextResponse.json({ events: canned.events, artifacts: canned.artifacts, mode: 'cached' });
}
