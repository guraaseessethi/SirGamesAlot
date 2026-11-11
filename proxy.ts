import { NextResponse, type NextRequest } from 'next/server';

/**
 * Runs before every page request:
 *  1. Builds a Content-Security-Policy with a fresh nonce (scripts need it; no 'unsafe-inline' for scripts).
 *  2. Marks /admin as noindex.
 *  3. Handles ?review=1 / ?review=0, which turns on [verify] tags for the owner's content review.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // Styles come from our own CSS files; React inline style attributes need 'unsafe-inline'.
    // Style injection is a much smaller risk than script injection and cannot run code.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ');

  const reviewParam = request.nextUrl.searchParams.get('review');
  const review =
    reviewParam === '1' ||
    (reviewParam !== '0' && request.cookies.get('sgal-review')?.value === '1');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-review', review ? '1' : '0');
  requestHeaders.set('content-security-policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  if (request.nextUrl.pathname.startsWith('/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.headers.set('Cache-Control', 'no-store');
  }
  if (reviewParam === '1') {
    response.cookies.set('sgal-review', '1', { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 8 });
  } else if (reviewParam === '0') {
    response.cookies.delete('sgal-review');
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|icon.svg|images/).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
