// components/lib/format.ts — small UI-side formatting helpers.
// No lib/** internals here; pure presentation utilities owned by the UI workstream.

import type { RiskTier } from '@/lib/types';

/** Load Index -> tier, per SPEC §4 (0-34 Stable, 35-54 Elevated, 55-69 High, 70+ Critical). */
export function tierForLoadIndex(n: number): RiskTier {
  if (n >= 70) return 'critical';
  if (n >= 55) return 'high';
  if (n >= 35) return 'elevated';
  return 'stable';
}

/** 'YYYY-MM-DD' -> Date at UTC midnight (never uses Date.now()). */
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** 'YYYY-MM-DD' -> 'Saturday, July 18, 2026' */
export function formatDateLong(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

/** 'YYYY-MM-DD' -> 'Jul 18' */
export function formatDateShort(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

/** 'YYYY-MM-DD' -> 'Jul 18, 2026' */
export function formatDateMedium(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

/** Whole-day difference between two 'YYYY-MM-DD' strings (b - a). */
export function dayDiff(a: string, b: string): number {
  const ms = parseDate(b).getTime() - parseDate(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Inclusive list of 'YYYY-MM-DD' dates from start to end. */
export function buildDateRange(start: string, end: string): string[] {
  const n = dayDiff(start, end);
  if (n < 0) return [start];
  return Array.from({ length: n + 1 }, (_, i) => addDays(start, i));
}

/** ISO datetime (e.g. '2026-07-07T18:40:00-07:00') on/before a 'YYYY-MM-DD' cutoff. */
export function isOnOrBeforeDate(ts: string, date: string): boolean {
  return ts.slice(0, 10) <= date;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** 'Maya Chen' -> 'MC' */
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

/** 'Maya Chen' -> 'Chen' */
export function lastName(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  return parts[parts.length - 1] ?? name;
}

export function pluralize(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
