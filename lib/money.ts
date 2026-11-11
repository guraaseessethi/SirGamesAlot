/** All money is integer cents. Ontario HST is 13%. */
export const HST_RATE_PERCENT = 13;

export function hstCents(cents: number): number {
  return Math.round((cents * HST_RATE_PERCENT) / 100);
}

export function withHstCents(cents: number): number {
  return cents + hstCents(cents);
}

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** "Ask" for items without a shelf price, otherwise "$7.25". */
export function formatPrice(cents: number): string {
  return cents > 0 ? formatCents(cents) : 'Ask';
}

export function formatFee(cents: number): string {
  return cents > 0 ? formatCents(cents) : 'Free';
}
