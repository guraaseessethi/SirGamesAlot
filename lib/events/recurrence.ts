import type { RecurrenceRule, Weekday } from '@/lib/domain/types';

/**
 * Recurrence works on calendar dates ("yyyy-MM-dd") using UTC arithmetic only, so the
 * result never depends on the machine's time zone or on daylight saving changes.
 */

const DAY_MS = 86_400_000;
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDINALS = ['', '1st', '2nd', '3rd', '4th'];

const fmt = (d: Date) => d.toISOString().slice(0, 10);
const parse = (s: string) => new Date(`${s}T00:00:00Z`);

/** Date of the nth (1-based) given weekday in a month. month is 0-based. */
export function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: Weekday,
  nth: number,
): string {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (weekday - first.getUTCDay() + 7) % 7;
  return fmt(new Date(Date.UTC(year, month, 1 + offset + (nth - 1) * 7)));
}

/** Date of the last given weekday in a month. month is 0-based. */
export function lastWeekdayOfMonth(year: number, month: number, weekday: Weekday): string {
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const offset = (lastDay.getUTCDay() - weekday + 7) % 7;
  return fmt(new Date(Date.UTC(year, month + 1, 0 - offset)));
}

/** All dates matching the rule between two dates, both inclusive, oldest first. */
export function occurrencesBetween(rule: RecurrenceRule, from: string, to: string): string[] {
  if (from > to) return [];
  const out: string[] = [];

  if (rule.kind === 'weekly') {
    const start = parse(from);
    const offset = (rule.weekday - start.getUTCDay() + 7) % 7;
    for (let t = start.getTime() + offset * DAY_MS; fmt(new Date(t)) <= to; t += 7 * DAY_MS) {
      out.push(fmt(new Date(t)));
    }
    return out;
  }

  const a = parse(from);
  const b = parse(to);
  let y = a.getUTCFullYear();
  let m = a.getUTCMonth();
  while (y < b.getUTCFullYear() || (y === b.getUTCFullYear() && m <= b.getUTCMonth())) {
    const date =
      rule.kind === 'nth-weekday'
        ? nthWeekdayOfMonth(y, m, rule.weekday, rule.nth)
        : lastWeekdayOfMonth(y, m, rule.weekday);
    if (date >= from && date <= to) out.push(date);
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return out;
}

export function describeRule(rule: RecurrenceRule): string {
  const day = WEEKDAYS[rule.weekday] ?? '';
  if (rule.kind === 'weekly') return `Every ${day}`;
  if (rule.kind === 'nth-weekday') return `${ORDINALS[rule.nth]} ${day} of the month`;
  return `Last ${day} of the month`;
}
