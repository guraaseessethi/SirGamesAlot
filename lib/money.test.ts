import { describe, expect, it } from 'vitest';
import { formatCents, formatFee, formatPrice, hstCents, withHstCents } from './money';

describe('money', () => {
  it('works in integer cents with 13% HST', () => {
    expect(hstCents(10000)).toBe(1300);
    expect(withHstCents(725)).toBe(725 + 94); // 94.25 rounds to 94
    expect(Number.isInteger(hstCents(1075))).toBe(true);
  });
  it('formats dollars', () => {
    expect(formatCents(725)).toBe('$7.25');
    expect(formatCents(2500)).toBe('$25');
  });
  it('shows Ask for unpriced items and Free for no fee', () => {
    expect(formatPrice(0)).toBe('Ask');
    expect(formatFee(0)).toBe('Free');
    expect(formatFee(1000)).toBe('$10');
  });
});
