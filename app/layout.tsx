import type { Metadata, Viewport } from 'next';
import { Archivo, Archivo_Black, Bangers } from 'next/font/google';
import { headers } from 'next/headers';
import { ToastProvider } from '@/components/ui/Toast';
import { ALLOW_INDEXING, SITE_URL, STORE } from '@/lib/content/store';
import './globals.css';

const archivoBlack = Archivo_Black({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo-black',
});
const archivo = Archivo({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
});
// Decorative display accents only. Never body text.
const bangers = Bangers({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-bangers',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${STORE.name} | Board games, D&D, Warhammer and hobby paints in Barrie, ON`,
    template: `%s | ${STORE.name}`,
  },
  description:
    "Barrie's independent game and hobby store since 2005: board games, D&D and RPGs, Warhammer and Citadel paints, StarCraft minis, trading card games and a free in-store playspace. Lower level of the Bayfield Mall.",
  applicationName: STORE.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    siteName: STORE.name,
    title: `${STORE.name} | Barrie's game and hobby store`,
    description:
      'Check stock, hold an item, save a seat at an event. Lower level, Bayfield Mall, Barrie.',
  },
  // While the site shows sample data it must never be indexed as the real store. See docs/SECURITY.md.
  robots: ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1f3f99',
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading headers makes every page dynamic, which the per-request CSP nonce requires.
  const h = await headers();
  const review = h.get('x-review') === '1';
  return (
    <html
      lang="en-CA"
      className={`${archivoBlack.variable} ${archivo.variable} ${bangers.variable}`}
    >
      <body data-review={review ? '' : undefined}>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
