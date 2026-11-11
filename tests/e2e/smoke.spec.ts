import { expect, test } from '@playwright/test';
import { expectNoSeriousA11yIssues, signInAs, trackErrors } from './helpers';

const PUBLIC_PAGES = ['/', '/stock', '/events', '/visit', '/special-order'];

for (const path of PUBLIC_PAGES) {
  test(`public page ${path}: loads, has landmarks, one h1, no console/CSP errors, axe clean`, async ({
    page,
  }) => {
    const errors = trackErrors(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.locator('main#main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeAttached();
    await page.waitForLoadState('networkidle');
    await expectNoSeriousA11yIssues(page);
    expect(errors).toEqual([]);
  });
}

test('an event page: JSON-LD, one h1, axe clean', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('/events');
  const href = await page
    .getByTestId('event-card')
    .first()
    .getByRole('link')
    .first()
    .getAttribute('href');
  expect(href).toMatch(/^\/events\//);
  await page.goto(href!);
  await expect(page.locator('h1')).toHaveCount(1);
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  const json = JSON.parse(ld!);
  expect(json['@type']).toBe('Event');
  expect(json.location.address.addressLocality).toBe('Barrie');
  expect(json.offers.priceCurrency).toBe('CAD');
  await page.waitForLoadState('networkidle');
  await expectNoSeriousA11yIssues(page);
  expect(errors).toEqual([]);
});

test('home has Store JSON-LD with address, phone, hours and sameAs', async ({ page }) => {
  await page.goto('/');
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  const json = JSON.parse(ld!);
  expect(json['@type']).toBe('Store');
  expect(json.address.streetAddress).toBe('320 Bayfield Street');
  expect(json.telephone).toBe('+1-705-719-1291');
  expect(json.openingHoursSpecification).toHaveLength(7);
  expect(json.sameAs).toHaveLength(2);
});

test('unknown event shows a friendly message', async ({ page }) => {
  await page.goto('/events/does-not-exist');
  await expect(page.getByRole('heading', { name: /couldn't find that event/i })).toBeVisible();
});

test('404 page works', async ({ page }) => {
  const res = await page.goto('/nope');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test.describe('admin pages', () => {
  for (const path of [
    '/admin/today',
    '/admin/stock',
    '/admin/holds',
    '/admin/events',
    '/admin/customers',
    '/admin/outbox',
    '/admin/settings',
  ]) {
    test(`${path} loads and is axe clean`, async ({ page }) => {
      const errors = trackErrors(page);
      await signInAs(page, 'Owner', path);
      await expect(page.locator('h1')).toHaveCount(1);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('Loading…')).toHaveCount(0);
      await expectNoSeriousA11yIssues(page);
      expect(errors).toEqual([]);
    });
  }

  test('the role picker is axe clean and says it is a demo', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Real staff login comes in the full build.').first()).toBeVisible();
    await expectNoSeriousA11yIssues(page);
  });
});

test('security headers, CSP nonce and noindex on admin', async ({ request }) => {
  const home = await request.get('/');
  const h = home.headers();
  expect(h['strict-transport-security']).toContain('max-age=');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['permissions-policy']).toContain('camera=()');
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['content-security-policy']).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/);
  expect(h['content-security-policy']).not.toContain("script-src 'self' 'unsafe-inline'");
  const a = (await request.get('/')).headers()['content-security-policy'];
  expect(a).not.toBe(h['content-security-policy']); // a fresh nonce per request
  const admin = await request.get('/admin/today');
  expect(admin.headers()['x-robots-tag']).toContain('noindex');
});

test('robots and sitemap', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Disallow: /');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/events/');
  expect(sitemap).toContain('/stock');
  expect(sitemap).not.toContain('/admin');
});
