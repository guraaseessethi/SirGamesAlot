import { addDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import type { DayHours, Settings, WeeklyHours } from '@/lib/domain/types';

export const STORE_TZ = 'America/Toronto';

export const DEFAULT_HOURS: WeeklyHours = {
  '0': { open: '11:00', close: '17:00' },
  '1': { open: '09:30', close: '21:00' },
  '2': { open: '09:30', close: '21:00' },
  '3': { open: '09:30', close: '21:00' },
  '4': { open: '09:30', close: '21:00' },
  '5': { open: '09:30', close: '21:00' },
  '6': { open: '09:30', close: '18:00' },
};

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
/** Monday first, the way people read a shop's hours. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** "9:30 am", "9 pm" */
export function formatTime(hhmm: string): string {
  const mins = toMinutes(hhmm);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatRange(hours: DayHours | null): string {
  return hours ? `${formatTime(hours.open)} – ${formatTime(hours.close)}` : 'Closed';
}

export interface ResolvedDay {
  date: string; // yyyy-MM-dd in store tz
  weekday: number;
  hours: DayHours | null;
  /** Set when a holiday override applies. */
  holidayLabel?: string;
}

/** Hours for a calendar date: a holiday override wins over the weekly pattern. */
export function resolveDay(
  settings: Pick<Settings, 'weeklyHours' | 'holidayOverrides'>,
  date: string,
): ResolvedDay {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const holiday = settings.holidayOverrides.find((h) => h.date === date);
  if (holiday) return { date, weekday, hours: holiday.hours, holidayLabel: holiday.label };
  return { date, weekday, hours: settings.weeklyHours[String(weekday) as keyof WeeklyHours] };
}

export interface OpenStatus {
  open: boolean;
  /** "Open now until 9 pm" or "Closed now · opens 9:30 am tomorrow" */
  text: string;
  holidayLabel?: string;
}

export function getOpenStatus(
  settings: Pick<Settings, 'weeklyHours' | 'holidayOverrides'>,
  now: Date,
): OpenStatus {
  const zoned = toZonedTime(now, STORE_TZ);
  const today = formatInTimeZone(now, STORE_TZ, 'yyyy-MM-dd');
  const minutes = zoned.getHours() * 60 + zoned.getMinutes();
  const day = resolveDay(settings, today);

  if (day.hours) {
    const o = toMinutes(day.hours.open);
    const c = toMinutes(day.hours.close);
    if (minutes >= o && minutes < c) {
      return {
        open: true,
        text: `Open now until ${formatTime(day.hours.close)}`,
        holidayLabel: day.holidayLabel,
      };
    }
    if (minutes < o) {
      return {
        open: false,
        text: `Closed now · opens ${formatTime(day.hours.open)} today`,
        holidayLabel: day.holidayLabel,
      };
    }
  }

  // Look ahead for the next day with hours.
  const base = new Date(`${today}T12:00:00Z`);
  for (let i = 1; i <= 14; i += 1) {
    const date = formatInTimeZone(addDays(base, i), 'UTC', 'yyyy-MM-dd');
    const next = resolveDay(settings, date);
    if (next.hours) {
      const when = i === 1 ? 'tomorrow' : `on ${WEEKDAY_NAMES[next.weekday]}`;
      const closedToday = day.hours
        ? 'Closed now'
        : day.holidayLabel
          ? `Closed today (${day.holidayLabel})`
          : 'Closed today';
      return {
        open: false,
        text: `${closedToday} · opens ${formatTime(next.hours.open)} ${when}`,
        holidayLabel: day.holidayLabel,
      };
    }
  }
  return { open: false, text: 'Closed · call 705-719-1291 for hours' };
}

/** Upcoming holiday overrides within `days` days, soonest first. */
export function upcomingHolidays(
  settings: Pick<Settings, 'holidayOverrides'>,
  now: Date,
  days = 60,
) {
  const today = formatInTimeZone(now, STORE_TZ, 'yyyy-MM-dd');
  const limit = formatInTimeZone(addDays(now, days), STORE_TZ, 'yyyy-MM-dd');
  return settings.holidayOverrides
    .filter((h) => h.date >= today && h.date <= limit)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** schema.org openingHoursSpecification entries. */
export function openingHoursSpecification(weekly: WeeklyHours) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return WEEK_ORDER.flatMap((d) => {
    const h = weekly[String(d) as keyof WeeklyHours];
    if (!h) return [];
    return [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: days[d], opens: h.open, closes: h.close },
    ];
  });
}
