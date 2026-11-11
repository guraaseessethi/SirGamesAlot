import { addDays } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import type { EventSeries, OneOffEvent, StoreEvent } from '@/lib/domain/types';
import { STORE_TZ } from '@/lib/hours/hours';
import { occurrencesBetween } from './recurrence';

export const EVENT_HORIZON_DAYS = 90;

export function toInstant(date: string, time: string): Date {
  return fromZonedTime(`${date}T${time}:00`, STORE_TZ);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function occurrenceId(seriesId: string, date: string): string {
  return `${seriesId}__${date}`;
}

function shared(e: OneOffEvent | EventSeries) {
  return {
    title: e.title,
    type: e.type,
    startTime: e.startTime,
    endTime: e.endTime,
    capacity: e.capacity,
    feeCents: e.feeCents,
    note: e.note,
    description: e.description,
  };
}

export function oneOffToEvent(e: OneOffEvent): StoreEvent {
  return {
    ...shared(e),
    id: e.id,
    slug: e.slug,
    date: e.date,
    startsAt: toInstant(e.date, e.startTime).toISOString(),
    endsAt: toInstant(e.date, e.endTime).toISOString(),
  };
}

export function expandSeries(series: EventSeries, from: string, to: string): StoreEvent[] {
  return occurrencesBetween(series.rule, from, to).map((date) => ({
    ...shared(series),
    id: occurrenceId(series.id, date),
    slug: `${slugify(series.title)}-${date}`,
    seriesId: series.id,
    date,
    startsAt: toInstant(date, series.startTime).toISOString(),
    endsAt: toInstant(date, series.endTime).toISOString(),
  }));
}

export function todayInStore(now: Date): string {
  return formatInTimeZone(now, STORE_TZ, 'yyyy-MM-dd');
}

/** Every event we can show: stored one-offs plus generated series occurrences. */
export function buildEventList(
  input: { oneOffs: OneOffEvent[]; series: EventSeries[] },
  now: Date,
  horizonDays = EVENT_HORIZON_DAYS,
): StoreEvent[] {
  const from = todayInStore(now);
  const to = todayInStore(addDays(now, horizonDays));
  const generated = input.series.flatMap((s) => expandSeries(s, from, to));
  const stored = input.oneOffs.map(oneOffToEvent);
  return [...stored, ...generated].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** An event is upcoming until it has ended. Past events can never show up here. */
export function isUpcoming(event: Pick<StoreEvent, 'endsAt'>, now: Date): boolean {
  return new Date(event.endsAt).getTime() > now.getTime();
}

export function splitEvents(events: StoreEvent[], now: Date) {
  const upcoming = events.filter((e) => isUpcoming(e, now));
  const past = events
    .filter((e) => !isUpcoming(e, now))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  return { upcoming, past };
}

export function formatEventDate(
  event: Pick<StoreEvent, 'startsAt'>,
  pattern = 'EEEE, MMMM d, yyyy',
): string {
  return formatInTimeZone(new Date(event.startsAt), STORE_TZ, pattern);
}
