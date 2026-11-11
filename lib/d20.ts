/** The "take 10% off, or roll for it" tradition. Just-for-fun on the website. */

export const SURE_THING_PERCENT = 10;

export function rollD20(rng: () => number = Math.random): number {
  return 1 + Math.floor(rng() * 20);
}

export function rollMessage(n: number): string {
  if (n === 20) return "Natural 20! That's 20% off. The whole counter cheers.";
  if (n > SURE_THING_PERCENT) return `You rolled ${n}% off. Better than the sure 10%. The dice gods smile on you.`;
  if (n === SURE_THING_PERCENT) return 'Exactly 10%. Same as the safe pick, but way more fun.';
  if (n === 1) return 'A natural 1. 1% off. Legends are built on moments like this.';
  return `Only ${n}% off. The sure 10% would have won. Roll again next event?`;
}

/** What a screen reader hears. */
export function rollAnnouncement(n: number): string {
  return `You rolled ${n}. ${rollMessage(n)}`;
}
