// lib/data/dates.ts — pure date-string arithmetic. No Date.now(); "today" always
// comes from the caller (the demo timeline). All dates are 'YYYY-MM-DD', UTC-based
// so day math never drifts across local timezones.

const MS_PER_DAY = 86_400_000;

function parts(dateStr: string): [number, number, number] {
  const [y, m, d] = dateStr.split('-').map(Number);
  return [y, m, d];
}

export function toEpochDay(dateStr: string): number {
  const [y, m, d] = parts(dateStr);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

export function fromEpochDay(epochDay: number): string {
  return new Date(epochDay * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(dateStr: string, n: number): string {
  return fromEpochDay(toEpochDay(dateStr) + n);
}

export function daysBetween(a: string, b: string): number {
  return toEpochDay(b) - toEpochDay(a);
}

/** Inclusive [start, end] list of 'YYYY-MM-DD' strings. */
export function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = toEpochDay(start); d <= toEpochDay(end); d++) out.push(fromEpochDay(d));
  return out;
}

/** 0 = Sunday .. 6 = Saturday */
export function dayOfWeek(dateStr: string): number {
  const [y, m, d] = parts(dateStr);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isWeekend(dateStr: string): boolean {
  const dow = dayOfWeek(dateStr);
  return dow === 0 || dow === 6;
}
