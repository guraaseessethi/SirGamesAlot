import { describe, expect, it } from 'vitest';
import type { EventSignup, SignupStatus } from '@/lib/domain/types';
import { canPromote, decideSignup, nextToPromote, seatSummary, seatText } from './seats';

let n = 0;
const s = (status: SignupStatus, email = `p${(n += 1)}@x.test`, createdAt = `2026-11-0${(n % 9) + 1}T10:00:00Z`): EventSignup => ({
  id: `s${n}`,
  eventId: 'e1',
  name: 'P',
  email,
  status,
  createdAt,
  marketingConsent: false,
});

describe('seat summary', () => {
  it('counts seated and checked-in people as taking a seat', () => {
    const sum = seatSummary(4, [s('seated'), s('checked-in'), s('waitlist'), s('cancelled'), s('no-show')]);
    expect(sum).toMatchObject({ taken: 2, left: 2, waitlist: 1, full: false, percentTaken: 50 });
  });
  it('is full exactly at capacity and never negative', () => {
    expect(seatSummary(2, [s('seated'), s('seated')]).full).toBe(true);
    expect(seatSummary(1, [s('seated'), s('seated')])).toMatchObject({ left: 0, percentTaken: 100 });
  });
  it('treats capacity 0 as open to everyone', () => {
    const sum = seatSummary(0, []);
    expect(sum.hasSeats).toBe(false);
    expect(sum.full).toBe(false);
    expect(seatText(sum)).toBe('Open to everyone');
  });
  it('has a plain-text equivalent of the bar', () => {
    expect(seatText(seatSummary(16, Array.from({ length: 13 }, () => s('seated'))))).toBe('3 of 16 seats left');
    expect(seatText(seatSummary(1, [s('seated')]))).toBe('Full · join the waitlist');
    expect(seatText(seatSummary(1, [s('seated'), s('waitlist')]))).toBe('Full · 1 on the waitlist');
  });
});

describe('signup decisions', () => {
  it('seats people while there is room, then waitlists', () => {
    expect(decideSignup(2, [s('seated')], 'new@x.test')).toBe('seated');
    expect(decideSignup(1, [s('seated')], 'new@x.test')).toBe('waitlist');
  });
  it('never lets the same email take two spots, ignoring case and spaces', () => {
    expect(decideSignup(5, [s('seated', 'a@x.test')], ' A@X.test ')).toBe('duplicate');
    expect(decideSignup(5, [s('waitlist', 'a@x.test')], 'a@x.test')).toBe('duplicate');
  });
  it('lets someone who cancelled sign up again', () => {
    expect(decideSignup(5, [s('cancelled', 'a@x.test')], 'a@x.test')).toBe('seated');
  });
});

describe('waitlist promotion', () => {
  it('promotes whoever has waited longest', () => {
    const late = s('waitlist', 'late@x.test', '2026-11-05T10:00:00Z');
    const early = s('waitlist', 'early@x.test', '2026-11-02T10:00:00Z');
    expect(nextToPromote([late, early])?.email).toBe('early@x.test');
  });
  it('only promotes when a seat is open', () => {
    expect(canPromote(1, [s('seated'), s('waitlist')])).toBe(false);
    expect(canPromote(1, [s('cancelled'), s('waitlist')])).toBe(true);
    expect(canPromote(2, [s('seated')])).toBe(false);
  });
});
