import type { MetadataRoute } from 'next';
import { ALLOW_INDEXING, SITE_URL } from '@/lib/content/store';

/**
 * The mockup shows sample stock and prices, so by default nothing is indexed.
 * Set NEXT_PUBLIC_ALLOW_INDEXING=true for the real launch. /admin is never indexed.
 */
export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEXING) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/admin/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
