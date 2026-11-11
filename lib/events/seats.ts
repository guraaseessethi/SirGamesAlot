import type { EventSignup } from '@/lib/domain/types';

const HOLDING_SEAT = new Set<EventSignup['status']>(['seated', 'checked-in']);

export interface SeatSummary {
  /** Events with capacity 0 are open to everyone and have no seats to manage. */
  hasSeats: boolean;
  capacity: number;
  taken: number;
  left: number;
  waitlist: number;
  full: boolean;
  percentTaken: number;
}

export function seatSummary(capacity: number, signups: EventSignup[]): SeatSummary {
  const taken = signups.filter((s) => HOLDING_SEAT.has(s.status)).length;
  const waitlist = signups.filter((s) => s.status === 'waitlist').length;
  const hasSeats = capacity > 0;
  const left = Math.max(0, capacity - taken);
  return {
    hasSeats,
    capacity,
    taken,
    left,
    waitlist,
    full: hasSeats && left === 0,
    percentTaken: hasSeats
      ? Math.min(100, Math.round((Math.min(taken, capacity) / capacity) * 100))
      : 0,
  };
}

/** Text equivalent of the seats bar, for screen readers and the visible label. */
export function seatText(s: SeatSummary): string {
  if (!s.hasSeats) return 'Open to everyone';
  if (s.full)
    return s.waitlist > 0 ? `Full · ${s.waitlist} on the waitlist` : 'Full · join the waitlist';
  return `${s.left} of ${s.capacity} seats left`;
}

export type SignupDecision = 'seated' | 'waitlist' | 'duplicate';

const norm = (e: string) => e.trim().toLowerCase();
const ACTIVE = new Set<EventSignup['status']>(['seated', 'waitlist', 'checked-in']);

/** Decide what happens when someone asks for a seat. Never double-books one email. */
export function decideSignup(
  capacity: number,
  signups: EventSignup[],
  email: string,
): SignupDecision {
  if (signups.some((s) => ACTIVE.has(s.status) && norm(s.email) === norm(email)))
    return 'duplicate';
  return seatSummary(capacity, signups).left > 0 ? 'seated' : 'waitlist';
}

/** The person who has waited longest. */
export function nextToPromote(signups: EventSignup[]): EventSignup | undefined {
  return signups
    .filter((s) => s.status === 'waitlist')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
}

export function canPromote(capacity: number, signups: EventSignup[]): boolean {
  return seatSummary(capacity, signups).left > 0 && nextToPromote(signups) !== undefined;
}
