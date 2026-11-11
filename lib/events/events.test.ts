import { describe, expect, it } from 'vitest';
import { buildSeed } from '@/lib/data/mock/seed';
import {
  lastWeekdayOfMonth,
  nthWeekdayOfMonth,
  occurrencesBetween,
  describeRule,
} from './recurrence';
import { buildEventList, isUpcoming, splitEvents, toInstant } from './events';
import { buildIcs } from './ics';

const NOW = new Date('2026-11-11T17:00:00Z'); // Wed Nov 11 2026, noon in Barrie

describe('recurrence rules', () => {
  it('finds the 3rd Saturday of a month', () => {
    expect(nthWeekdayOfMonth(2026, 10, 6, 3)).toBe('2026-11-21');
    expect(nthWeekdayOfMonth(2027, 4, 6, 3)).toBe('2027-05-15');
  });
  it('finds the last Thursday of a month, including months with 5 Thursdays', () => {
    expect(lastWeekdayOfMonth(2026, 10, 4)).toBe('2026-11-26');
    expect(lastWeekdayOfMonth(2026, 11, 4)).toBe('2026-12-31');
    expect(lastWeekdayOfMonth(2027, 1, 4)).toBe('2027-02-25');
  });
  it('lists every Friday in a range, inclusive of both ends', () => {
    expect(occurrencesBetween({ kind: 'weekly', weekday: 5 }, '2026-11-13', '2026-12-04')).toEqual([
      '2026-11-13',
      '2026-11-20',
      '2026-11-27',
      '2026-12-04',
    ]);
  });
  it('starts a weekly rule on the first matching day on or after the start', () => {
    expect(occurrencesBetween({ kind: 'weekly', weekday: 5 }, '2026-11-14', '2026-11-30')).toEqual([
      '2026-11-20',
      '2026-11-27',
    ]);
  });
  it('handles monthly rules across a year boundary', () => {
    expect(
      occurrencesBetween({ kind: 'last-weekday', weekday: 4 }, '2026-12-01', '2027-02-28'),
    ).toEqual(['2026-12-31', '2027-01-28', '2027-02-25']);
    expect(
      occurrencesBetween({ kind: 'nth-weekday', weekday: 6, nth: 3 }, '2026-11-22', '2027-01-31'),
    ).toEqual(['2026-12-19', '2027-01-16']);
  });
  it('does not return dates outside the range', () => {
    expect(
      occurrencesBetween({ kind: 'nth-weekday', weekday: 6, nth: 3 }, '2026-11-22', '2026-12-18'),
    ).toEqual([]);
    expect(occurrencesBetween({ kind: 'weekly', weekday: 1 }, '2026-12-01', '2026-11-01')).toEqual(
      [],
    );
  });
  it('describes rules in plain words', () => {
    expect(describeRule({ kind: 'weekly', weekday: 5 })).toBe('Every Friday');
    expect(describeRule({ kind: 'nth-weekday', weekday: 6, nth: 3 })).toBe(
      '3rd Saturday of the month',
    );
    expect(describeRule({ kind: 'last-weekday', weekday: 4 })).toBe('Last Thursday of the month');
  });
});

describe('times in America/Toronto', () => {
  it('uses EST in winter and EDT in summer', () => {
    expect(toInstant('2026-11-21', '10:00').toISOString()).toBe('2026-11-21T15:00:00.000Z');
    expect(toInstant('2026-07-18', '10:00').toISOString()).toBe('2026-07-18T14:00:00.000Z');
  });
  it('gets the instant right on the days clocks change', () => {
    expect(toInstant('2026-11-01', '18:00').toISOString()).toBe('2026-11-01T23:00:00.000Z');
    expect(toInstant('2027-03-14', '18:00').toISOString()).toBe('2027-03-14T22:00:00.000Z');
  });
});

describe('event list and history', () => {
  const seed = buildSeed(NOW);
  const events = buildEventList({ oneOffs: seed.oneOffs, series: seed.series }, NOW);
  const { upcoming, past } = splitEvents(events, NOW);

  it('never shows a past event as upcoming', () => {
    expect(upcoming.every((e) => new Date(e.endsAt) > NOW)).toBe(true);
    const pastTitles = past.map((e) => `${e.title} ${e.date}`);
    expect(pastTitles).toContain('21st Anniversary Event 2026-05-16');
    expect(pastTitles).toContain('Nightmare Before Christmas Event 2025-11-15');
    expect(upcoming.map((e) => e.date)).not.toContain('2026-05-16');
    expect(upcoming.map((e) => e.date)).not.toContain('2025-11-15');
  });
  it('lists history newest first', () => {
    expect(past.map((e) => e.date)).toEqual(['2026-05-16', '2025-11-15', '2025-05-03']);
  });
  it('generates occurrences from series rules', () => {
    const tournaments = upcoming.filter((e) => e.seriesId === 'ser-40k').map((e) => e.date);
    expect(tournaments[0]).toBe('2026-11-21');
    expect(tournaments).toContain('2026-12-19');
    const paint = upcoming.filter((e) => e.seriesId === 'ser-paint').map((e) => e.date);
    expect(paint[0]).toBe('2026-11-26');
    const dnd = upcoming.filter((e) => e.seriesId === 'ser-dnd').map((e) => e.date);
    expect(dnd.slice(0, 3)).toEqual(['2026-11-13', '2026-11-20', '2026-11-27']);
  });
  it('keeps the holiday event on the third Saturday of November', () => {
    expect(upcoming.find((e) => e.id === 'evt-holiday')!.date).toBe('2026-11-21');
  });
  it('moves the holiday event to December once November has passed', () => {
    const later = new Date('2026-11-25T17:00:00Z');
    const s = buildSeed(later);
    expect(s.oneOffs.find((e) => e.id === 'evt-holiday')!.date).toBe('2026-12-05');
  });
  it('treats an event as upcoming until it ends', () => {
    const e = { endsAt: '2026-11-11T18:00:00.000Z' };
    expect(isUpcoming(e, new Date('2026-11-11T17:59:00Z'))).toBe(true);
    expect(isUpcoming(e, new Date('2026-11-11T18:00:00Z'))).toBe(false);
  });
  it('is sorted by start time with unique slugs', () => {
    const starts = events.map((e) => e.startsAt);
    expect(starts).toEqual([...starts].sort());
    expect(new Set(events.map((e) => e.slug)).size).toBe(events.length);
  });
});

describe('calendar download', () => {
  it('builds a valid .ics with UTC times and CRLF line endings', () => {
    const e = buildEventList({ oneOffs: buildSeed(NOW).oneOffs, series: [] }, NOW).find(
      (x) => x.id === 'evt-holiday',
    )!;
    const ics = buildIcs(e, NOW);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('DTSTART:20261121T150000Z');
    expect(ics).toContain('DTEND:20261121T220000Z');
    expect(ics).toContain('SUMMARY:Holiday shopping event');
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true);
  });
});
