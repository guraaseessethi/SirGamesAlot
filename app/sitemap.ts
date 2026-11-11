import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/content/store';
import { getRepository } from '@/lib/data';
import { isUpcoming } from '@/lib/events/events';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const events = (await getRepository().listEvents()).filter((e) => isUpcoming(e, now));
  const pages = ['', '/stock', '/events', '/visit', '/special-order'].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: p === '' || p === '/stock' || p === '/events' ? ('daily' as const) : ('monthly' as const),
    priority: p === '' ? 1 : 0.7,
  }));
  return [
    ...pages,
    ...events.map((e) => ({ url: `${SITE_URL}/events/${e.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.5 })),
  ];
}
