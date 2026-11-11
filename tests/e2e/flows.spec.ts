import { expect, test } from '@playwright/test';
import { signInAs } from './helpers';

test('a hold from the public stock checker shows up in admin Holds', async ({ page }) => {
  await page.goto('/stock');
  await page.getByRole('searchbox', { name: 'Search stock' }).fill('leadbelcher');
  await page.getByRole('button', { name: /^Hold it: Leadbelcher/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Your name').fill('Test Shopper');
  await dialog.getByLabel('Phone').fill('705-555-0199');
  await dialog.getByRole('button', { name: 'Hold it', exact: true }).click();
  await expect(dialog.getByText(/set Leadbelcher aside at the counter/)).toBeVisible();
  await expect(page.getByTestId('toast')).toContainText('set Leadbelcher aside');
  await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();
  await expect(page.getByRole('button', { name: /^Held 24 h ✓: Leadbelcher/ })).toBeVisible();

  await signInAs(page, 'Staff', '/admin/holds');
  const row = page.getByTestId('hold-row').filter({ hasText: 'Test Shopper' });
  await expect(row).toContainText('Leadbelcher');
  await expect(row).toContainText('705-555-0199');
  await expect(row).toContainText('Active');
  await row.getByRole('button', { name: /Mark Leadbelcher picked up/ }).click();
  await expect(row).toContainText('Picked up');
});

test('hold form validates: needs a name and a way to reach you', async ({ page }) => {
  await page.goto('/stock');
  await page.getByRole('button', { name: /^Hold it: Codex: Space Marines/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Hold it', exact: true }).click();
  await expect(dialog.getByText('Please enter your name.')).toBeVisible();
  await expect(
    dialog.getByText('Add a phone number or an email so we can reach you.'),
  ).toBeVisible();
  await expect(dialog.getByLabel('Your name')).toBeFocused();
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(dialog).toBeHidden();
});

test('order-in and tell-me-when-back requests land in admin Holds & orders', async ({ page }) => {
  await page.goto('/stock');
  await page.getByRole('button', { name: /^Order it in: Kill Team starter set/ }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Your name').fill('Order Person');
  await dialog.getByLabel('Email').fill('order@example.test');
  await dialog.getByRole('button', { name: 'Send order request' }).click();
  await expect(dialog.getByText(/Order request sent/)).toBeVisible();
  await expect(
    dialog.getByText(/confirmation email would be sent in the full build/),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();

  await page.getByRole('searchbox', { name: 'Search stock' }).fill('codenames');
  await page.getByRole('button', { name: /^Tell me when it's back: Codenames/ }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Your name').fill('Waiting Person');
  await dialog.getByLabel('Phone').fill('705-555-0150');
  await dialog.getByRole('button', { name: 'Tell me', exact: true }).click();
  await expect(dialog.getByText(/let you know when Codenames is back/)).toBeVisible();

  await signInAs(page, 'Owner', '/admin/holds');
  await expect(page.getByTestId('order-card').filter({ hasText: 'Order Person' })).toContainText(
    'Kill Team starter set',
  );
  await expect(page.getByText('Waiting Person')).toBeVisible();
  await page.getByRole('button', { name: /Notify Waiting Person about Codenames/ }).click();
  await expect(page.getByTestId('toast')).toContainText(/Marked as notified|Would send/);
});

test('a seat saved on an event appears in admin Events sign-ups', async ({ page }) => {
  await page.goto('/events');
  const card = page.getByTestId('event-card').filter({ hasText: 'Paint night' }).first();
  const before = await card.getByTestId('seat-text').textContent();
  await card.getByRole('button', { name: /^Save a seat: Paint night/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Your name').fill('Seat Saver');
  await dialog.getByLabel('Email').fill('seat@example.test');
  await dialog.getByRole('button', { name: 'Save my seat' }).click();
  await expect(dialog.getByText(/Your seat for Paint night is saved/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();
  await expect(card.getByTestId('seat-text')).not.toHaveText(before!);

  await signInAs(page, 'Staff', '/admin/events');
  await page
    .getByRole('button', { name: /Manage sign-ups for Paint night/ })
    .first()
    .click();
  const row = page.getByTestId('attendee-row').filter({ hasText: 'Seat Saver' });
  await expect(row).toContainText('seat@example.test');
  await row.getByRole('button', { name: 'Check in Seat Saver' }).click();
  await expect(row).toContainText('Checked in');
});

test('a full event offers the waitlist, and admin can promote when a seat opens', async ({
  page,
}) => {
  await page.goto('/events');
  const card = page.getByTestId('event-card').filter({ hasText: 'D&D one-shot' }).first();
  await expect(card.getByTestId('seat-text')).toContainText('Full');
  await card.getByRole('button', { name: /^Join the waitlist: D&D one-shot/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Your name').fill('Wait Lister');
  await dialog.getByLabel('Email').fill('wait@example.test');
  await dialog.getByRole('button', { name: 'Save my seat' }).click();
  await expect(dialog.getByText(/you're on the waitlist/i)).toBeVisible();
  await dialog.getByRole('button', { name: 'Close', exact: true }).last().click();

  // The same email cannot take a second spot.
  await card.getByRole('button', { name: /^Join the waitlist: D&D one-shot/ }).click();
  await dialog.getByLabel('Your name').fill('Wait Lister');
  await dialog.getByLabel('Email').fill('WAIT@example.test');
  await dialog.getByRole('button', { name: 'Save my seat' }).click();
  await expect(
    dialog.getByText('That email already has a seat or a spot on the waitlist.').first(),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel' }).click();

  await signInAs(page, 'Owner', '/admin/events');
  await page
    .getByRole('button', { name: /Manage sign-ups for D&D one-shot/ })
    .first()
    .click();
  const waitRow = page.getByTestId('attendee-row').filter({ hasText: 'Wait Lister' });
  await expect(waitRow).toContainText('Waitlist');
  await expect(waitRow.getByRole('button', { name: /Promote Wait Lister/ })).toBeDisabled();
  await page
    .getByTestId('attendee-row')
    .filter({ hasText: 'Seat saved' })
    .first()
    .getByRole('button', { name: /^Cancel .* seat$/ })
    .click();
  await waitRow.getByRole('button', { name: /Promote Wait Lister/ }).click();
  await expect(waitRow).toContainText('Seat saved');
});

test('past events never show as upcoming; they are in the history strip', async ({ page }) => {
  await page.goto('/events');
  const cards = page.getByTestId('event-card');
  await expect(cards.first()).toBeVisible();
  const all = await cards.allTextContents();
  expect(all.join(' ')).not.toMatch(/21st Anniversary|Nightmare Before Christmas|20th Anniversary/);
  const history = page.getByRole('region', { name: 'Event history' });
  await expect(history).toContainText('21st Anniversary Event');
  await expect(history).toContainText('Nightmare Before Christmas Event');
  await expect(page.getByText(/Next: May 2027 · date TBA/)).toBeVisible();
});

test('turning the construction banner off in Settings hides it on the site', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('construction-banner')).toBeVisible();
  await signInAs(page, 'Owner', '/admin/settings');
  await page.getByLabel('Show the banner on the public site').uncheck();
  await expect(page.getByTestId('toast')).toContainText('Banner is off');
  await page.goto('/');
  await expect(page.getByTestId('construction-banner')).toHaveCount(0);
  await page.goto('/visit');
  await expect(page.getByTestId('construction-banner')).toHaveCount(0);

  await page.goto('/admin/settings');
  await page.getByLabel('Show the banner on the public site').check();
  await page.goto('/');
  await expect(page.getByTestId('construction-banner')).toBeVisible();
});

test('staff cannot see Settings or export; owner can', async ({ page }) => {
  await signInAs(page, 'Staff', '/admin/customers');
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Export CSV/ })).toBeDisabled();
  await page.goto('/admin/settings');
  await expect(page.getByText(/Settings are owner-only/)).toBeVisible();
  await page.getByRole('button', { name: 'Switch role' }).click();
  await page.getByRole('button', { name: /^Owner/ }).click();
  await expect(
    page
      .getByRole('button', { name: /Export CSV/ })
      .or(page.getByRole('heading', { name: 'Settings' })),
  ).toBeVisible();
});

test('stock overrides in admin change what the public sees', async ({ page }) => {
  await signInAs(page, 'Staff', '/admin/stock');
  await page.getByLabel('Status for Leadbelcher').selectOption('out');
  await expect(page.getByTestId('toast')).toContainText('Saved Leadbelcher');
  await page.goto('/stock');
  await page.getByRole('searchbox', { name: 'Search stock' }).fill('leadbelcher');
  await expect(page.getByText('Out of stock')).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^Tell me when it's back: Leadbelcher/ }),
  ).toBeVisible();
});

test('stock filters, sorting and status pills', async ({ page }) => {
  await page.goto('/stock');
  const chip = page.getByRole('button', { name: 'Board games', exact: true });
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await chip.click();
  await expect(chip).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(3);
  await page.getByLabel('Sort by').selectOption('price');
  await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText('Codenames');
  await page.getByRole('searchbox', { name: 'Search stock' }).fill('zzzz');
  await expect(page.getByText(/Nothing matches that/)).toBeVisible();
  await expect(page.getByText('📍').first()).toHaveCount(0);
});

test('d20 roll shows a result and announces it in a live region', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('die').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('roll-number')).toHaveText('?');
  await page.getByRole('button', { name: 'Roll the twenty-sided die' }).click();
  await expect(page.getByTestId('roll-number')).toHaveText(/^\d{1,2}%$/);
  await expect(page.getByTestId('roll-live')).toContainText(/^You rolled \d+\./);
  await expect(page.getByText('Just for fun here.')).toBeVisible();
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('d20 shows the result immediately without spinning', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Roll the twenty-sided die' }).click();
    // No 380 ms spin delay: the result is there straight away, and no animation class was applied.
    await expect(page.getByTestId('roll-number')).toHaveText(/^\d{1,2}%$/, { timeout: 150 });
    const animated = await page
      .getByTestId('die')
      .locator('span')
      .nth(1)
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(animated).toBe('none');
  });
});

test('d20 promo off in Settings pauses the discount copy', async ({ page }) => {
  await signInAs(page, 'Owner', '/admin/settings');
  await page.getByLabel(/is running/).uncheck();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'The d20 is resting.' })).toBeVisible();
});

test('hours: open-now indicator and weekly table', async ({ page }) => {
  await page.goto('/visit');
  await expect(page.getByTestId('hours-open')).toContainText(/Open now until|Closed/);
  const rows = page.getByRole('table', { name: 'Weekly opening hours' }).getByRole('row');
  await expect(rows).toHaveCount(7);
  await expect(page.getByRole('row', { name: /Monday.*9:30 am – 9 pm/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Sunday.*11 am – 5 pm/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /how to reach Sir Games-A-Lot/ })).toBeVisible();
});

test('?review=1 shows [verify] tags and ?review=0 hides them', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/\[verify/).first()).toBeHidden();
  await page.goto('/?review=1');
  await expect(page.getByText(/\[verify/).first()).toBeVisible();
  await page.goto('/visit');
  await expect(page.getByText(/\[verify/).first()).toBeVisible();
  await page.goto('/?review=0');
  await expect(page.getByText(/\[verify/).first()).toBeHidden();
});

test('special order form works and validates', async ({ page }) => {
  await page.goto('/special-order');
  await page.getByRole('button', { name: 'Send special order' }).click();
  await expect(
    page
      .getByText('Too small: expected string to have >=2 characters')
      .or(page.getByText(/Too small|at least|Invalid/))
      .first(),
  ).toBeVisible();
  await page.getByLabel('What are you looking for?').fill('Gloomhaven: Jaws of the Lion');
  await page.getByLabel('Your name').fill('Special Person');
  await page.getByLabel('Email').fill('special@example.test');
  await page.getByRole('button', { name: 'Send special order' }).click();
  await expect(page.getByRole('heading', { name: 'Request sent' })).toBeVisible();
  await signInAs(page, 'Owner', '/admin/holds');
  await expect(
    page.getByTestId('order-card').filter({ hasText: 'Jaws of the Lion' }),
  ).toBeVisible();
});

test('.ics download', async ({ page }) => {
  await page.goto('/events');
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: /^Add to calendar: Paint night/ })
    .first()
    .click();
  const d = await download;
  expect(d.suggestedFilename()).toMatch(/^paint-night-.*\.ics$/);
});

test('reset demo data restores the samples', async ({ page }) => {
  await signInAs(page, 'Owner', '/admin/holds');
  await page.getByRole('button', { name: 'Reset demo data' }).click();
  await page.getByRole('button', { name: 'Yes, reset all demo data' }).click();
  await expect(page.getByTestId('toast')).toContainText('Demo data reset');
  await expect(page.getByTestId('hold-row').filter({ hasText: 'Sample: Jordan' })).toBeVisible();
});

test('layout has no horizontal scroll at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const path of ['/', '/stock', '/events', '/visit']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow on ${path}`).toBeLessThanOrEqual(0);
  }
});
