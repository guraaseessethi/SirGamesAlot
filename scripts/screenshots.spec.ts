import { test } from '@playwright/test';

/** Saves screenshots at the three breakpoints we design for. Run with: pnpm screenshots */
const WIDTHS = [
  { w: 360, h: 800 },
  { w: 768, h: 1024 },
  { w: 1280, h: 900 },
];

const PUBLIC: [string, string][] = [
  ['home', '/'],
  ['stock', '/stock'],
  ['events', '/events'],
  ['visit', '/visit'],
  ['special-order', '/special-order'],
];
const ADMIN: [string, string][] = [
  ['admin-today', '/admin/today'],
  ['admin-stock', '/admin/stock'],
  ['admin-holds', '/admin/holds'],
  ['admin-events', '/admin/events'],
  ['admin-customers', '/admin/customers'],
  ['admin-settings', '/admin/settings'],
];

for (const { w, h } of WIDTHS) {
  test(`screenshots at ${w}px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: w, height: h },
      timezoneId: 'America/Toronto',
      locale: 'en-CA',
    });
    const page = await context.newPage();
    for (const [name, path] of PUBLIC) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `docs/screenshots/${name}-${w}.png`, fullPage: true });
    }
    await page.goto('/admin');
    await page.getByRole('button', { name: /^Owner/ }).click();
    for (const [name, path] of ADMIN) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.getByText('Loading…').waitFor({ state: 'detached' });
      await page.screenshot({ path: `docs/screenshots/${name}-${w}.png`, fullPage: true });
    }
    await context.close();
  });
}
