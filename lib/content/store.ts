/** Facts about the store. Items marked [verify] are tracked in docs/CONTENT_TODO.md. */
export const STORE = {
  name: 'Sir Games-A-Lot',
  tagline: "Barrie's independent game and hobby store",
  phone: '705-719-1291',
  phoneHref: 'tel:+17057191291',
  email: 'sirgamesalot@rogers.com',
  streetAddress: '320 Bayfield Street',
  locality: 'Barrie',
  region: 'ON',
  postalCode: 'L4M 3C1',
  country: 'CA',
  fullAddress: '320 Bayfield Street, Barrie, ON L4M 3C1',
  locationNote: 'Lower level, Bayfield Mall · next to Bowlerama and Service Ontario',
  facebook: 'https://www.facebook.com/profile.php?id=100057495547644',
  instagram: 'https://www.instagram.com/iamsirgamesalot/',
  foundedYear: 2005,
} as const;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sir-games-a-lot.vercel.app').replace(/\/$/, '');
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true';
