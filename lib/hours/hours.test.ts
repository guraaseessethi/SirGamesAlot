import { describe, expect, it } from 'vitest';
import { defaultSettings } from '@/lib/data/mock/seed';
import {
  formatRange,
  formatTime,
  getOpenStatus,
  openingHoursSpecification,
  resolveDay,
  upcomingHolidays,
} from './hours';

const settings = defaultSettings();
// Instants are written in UTC; Toronto is UTC-5 in winter (EST) and UTC-4 in summer (EDT).
const at = (iso: string) => new Date(iso);

describe('formatting', () => {
  it('formats times the way the sign does', () => {
    expect(formatTime('09:30')).toBe('9:30 am');
    expect(formatTime('21:00')).toBe('9 pm');
    expect(formatTime('12:00')).toBe('12 pm');
    expect(formatTime('00:15')).toBe('12:15 am');
    expect(formatRange(null)).toBe('Closed');
  });
});

describe('open now', () => {
  it('is open mid-afternoon on a weekday', () => {
    const s = getOpenStatus(settings, at('2026-11-11T17:00:00Z')); // Wed 12:00 EST
    expect(s.open).toBe(true);
    expect(s.text).toBe('Open now until 9 pm');
  });
  it('is closed before opening and says when it opens today', () => {
    const s = getOpenStatus(settings, at('2026-11-11T13:00:00Z')); // Wed 8:00 EST
    expect(s).toMatchObject({ open: false, text: 'Closed now · opens 9:30 am today' });
  });
  it('opens exactly at opening time and closes exactly at closing time', () => {
    expect(getOpenStatus(settings, at('2026-11-11T14:30:00Z')).open).toBe(true); // 9:30
    expect(getOpenStatus(settings, at('2026-11-11T14:29:00Z')).open).toBe(false);
    expect(getOpenStatus(settings, at('2026-11-12T01:59:00Z')).open).toBe(true); // 8:59 pm
    expect(getOpenStatus(settings, at('2026-11-12T02:00:00Z')).open).toBe(false); // 9:00 pm
  });
  it('after closing, points to tomorrow', () => {
    const s = getOpenStatus(settings, at('2026-11-12T03:00:00Z')); // Wed 10 pm
    expect(s.text).toBe('Closed now · opens 9:30 am tomorrow');
  });
  it('uses Saturday and Sunday hours', () => {
    expect(getOpenStatus(settings, at('2026-11-14T23:30:00Z'))).toMatchObject({ open: false }); // Sat 6:30 pm
    expect(getOpenStatus(settings, at('2026-11-14T23:30:00Z')).text).toBe(
      'Closed now · opens 11 am tomorrow',
    );
    expect(getOpenStatus(settings, at('2026-11-15T16:00:00Z')).text).toBe('Open now until 5 pm'); // Sun 11 am
  });
  it('is based on Toronto time, not the viewer’s time zone', () => {
    // 02:30 UTC Thursday is still Wednesday evening in Toronto.
    expect(getOpenStatus(settings, at('2026-11-12T02:30:00Z')).open).toBe(false);
    expect(getOpenStatus(settings, at('2026-11-12T01:30:00Z')).open).toBe(true);
  });
  it('handles daylight saving time (EDT in July)', () => {
    expect(getOpenStatus(settings, at('2026-07-15T13:30:00Z')).open).toBe(true); // 9:30 EDT
    expect(getOpenStatus(settings, at('2026-07-15T13:29:00Z')).open).toBe(false);
  });
});

describe('holiday overrides', () => {
  it('a closed holiday beats the weekly pattern and names the holiday', () => {
    const s = getOpenStatus(settings, at('2026-12-25T17:00:00Z')); // Fri Dec 25, noon
    expect(s.open).toBe(false);
    expect(s.text).toContain('Closed today (Christmas Day (sample))');
    expect(s.text).toContain('opens 9:30 am');
  });
  it('shortened holiday hours apply', () => {
    expect(getOpenStatus(settings, at('2026-12-24T21:00:00Z')).text).toBe('Open now until 5 pm'); // 4 pm
    expect(getOpenStatus(settings, at('2026-12-24T22:30:00Z')).open).toBe(false); // 5:30 pm
  });
  it('resolves the day with its label', () => {
    expect(resolveDay(settings, '2026-12-25')).toMatchObject({
      hours: null,
      holidayLabel: 'Christmas Day (sample)',
    });
    expect(resolveDay(settings, '2026-12-23').holidayLabel).toBeUndefined();
  });
  it('looks ahead over several closed days', () => {
    const custom = {
      ...settings,
      holidayOverrides: [
        { id: 'a', date: '2026-11-12', label: 'Reno', hours: null },
        { id: 'b', date: '2026-11-13', label: 'Reno', hours: null },
      ],
    };
    expect(getOpenStatus(custom, at('2026-11-12T03:00:00Z')).text).toContain(
      'opens 9:30 am on Saturday',
    );
  });
  it('lists upcoming holidays soonest first', () => {
    const list = upcomingHolidays(settings, at('2026-12-01T12:00:00Z'), 60).map((h) => h.date);
    expect(list).toEqual(['2026-12-24', '2026-12-25', '2027-01-01']);
  });
});

describe('structured data', () => {
  it('emits one opening-hours entry per open day', () => {
    expect(openingHoursSpecification(settings.weeklyHours)).toHaveLength(7);
    const closedSunday = { ...settings.weeklyHours, '0': null };
    expect(openingHoursSpecification(closedSunday)).toHaveLength(6);
  });
});
