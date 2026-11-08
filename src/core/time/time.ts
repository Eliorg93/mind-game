/** Local-calendar day key, e.g. "2026-11-09". Days follow the device's time zone. */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** The last `n` local days, oldest first, ending today. */
export function lastDays(n: number, now: number): number[] {
  const out: number[] = [];
  const today = startOfDay(now);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d.getTime());
  }
  return out;
}

export type DayPart = 'morning' | 'noon' | 'evening' | 'night';

export function dayPart(ts: number): DayPart {
  const h = new Date(ts).getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'noon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

/** Hebrew long date, e.g. "יום שני, 9 בנובמבר". Uses the platform's Intl data. */
export function formatHebrewDate(ts: number, locale = 'he-IL'): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(ts));
}

/** Short weekday letter for a day, e.g. "ב׳". */
export function formatWeekdayShort(ts: number, locale = 'he-IL'): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(ts));
}
