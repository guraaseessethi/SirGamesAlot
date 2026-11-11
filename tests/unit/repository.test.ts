import { beforeEach, describe, expect, it } from 'vitest';
import { MockRepository, STATE_KEY } from '@/lib/data/mock/mock-repository';
import { RepositoryError } from '@/lib/data/repository';
import { MockInventorySource, SYNC_STORAGE_KEY } from '@/lib/inventory-source/mock';
import { loadProducts } from '@/lib/stock/catalog';
import { splitEvents } from '@/lib/events/events';

class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const NOW = new Date('2026-11-11T17:00:00Z');
let storage: MemoryStorage;
let repo: MockRepository;
beforeEach(() => {
  storage = new MemoryStorage();
  repo = new MockRepository({ storage, now: () => NOW });
});

async function catchError(p: Promise<unknown>): Promise<RepositoryError> {
  try {
    await p;
  } catch (e) {
    return e as RepositoryError;
  }
  throw new Error('expected a RepositoryError');
}

describe('holds', () => {
  it('creates a hold that expires after the configured hold length', async () => {
    const hold = await repo.createHold({ sku: 'PT-NULN', productName: 'Nuln Oil', name: 'Casey', phone: '705-555-0100', email: '', marketingConsent: false });
    expect(hold.status).toBe('active');
    expect(new Date(hold.expiresAt).getTime() - new Date(hold.createdAt).getTime()).toBe(24 * 3_600_000);
    expect((await repo.listHolds()).some((h) => h.id === hold.id)).toBe(true);
  });
  it('uses the hold length from settings', async () => {
    await repo.updateSettings({ holdHours: 48 });
    const hold = await repo.createHold({ sku: 'PT-NULN', productName: 'Nuln Oil', name: 'Casey', email: 'c@x.test', phone: '', marketingConsent: false });
    expect(new Date(hold.expiresAt).getTime() - NOW.getTime()).toBe(48 * 3_600_000);
  });
  it('needs a name and a phone or email', async () => {
    const e = await catchError(repo.createHold({ sku: 'PT-NULN', productName: 'Nuln Oil', name: 'Casey', phone: '', email: '', marketingConsent: false }));
    expect(e.code).toBe('validation');
    expect(e.fields?.phone).toMatch(/phone number or an email/);
    const e2 = await catchError(repo.createHold({ sku: 'PT-NULN', productName: 'Nuln Oil', name: 'C', phone: '705-555-0100', email: '', marketingConsent: false }));
    expect(e2.fields?.name).toBeDefined();
  });
  it('rejects a bad email or short phone number', async () => {
    const e = await catchError(repo.createHold({ sku: 'x', productName: 'x', name: 'Casey', phone: '555', email: 'nope', marketingConsent: false }));
    expect(e.fields?.phone).toBeDefined();
    expect(e.fields?.email).toBeDefined();
  });
  it('reports a hold as expired once its time has passed, without changing stored data', async () => {
    const seeded = (await repo.listHolds()).find((h) => h.id === 'hold-seed-3')!;
    expect(seeded.status).toBe('expired');
    const fresh = (await repo.listHolds()).find((h) => h.id === 'hold-seed-2')!;
    expect(fresh.status).toBe('active');
  });
  it('lets staff mark a hold as picked up', async () => {
    await repo.setHoldStatus('hold-seed-2', 'picked-up');
    expect((await repo.listHolds()).find((h) => h.id === 'hold-seed-2')!.status).toBe('picked-up');
  });
  it('adds the person to customers and logs a confirmation email only when an email was given', async () => {
    await repo.createHold({ sku: 'PT-NULN', productName: 'Nuln Oil', name: 'Casey', email: 'casey@x.test', phone: '', marketingConsent: true, interest: 'Paints' });
    const c = (await repo.listCustomers()).find((x) => x.email === 'casey@x.test')!;
    expect(c).toMatchObject({ marketingConsent: true, interests: ['Paints'], consentSource: 'website hold form' });
    expect((await repo.listOutbox())[0]).toMatchObject({ kind: 'hold-confirmation', to: 'casey@x.test' });
    await repo.createHold({ sku: 'PT-NULN', productName: 'Nuln Oil', name: 'Dana', phone: '705-555-0111', email: '', marketingConsent: false });
    expect(await repo.listOutbox()).toHaveLength(1);
  });
  it('does not duplicate a returning customer and does not drop consent', async () => {
    const input = { sku: 'PT-NULN', productName: 'Nuln Oil', name: 'Casey', email: 'casey@x.test', phone: '', marketingConsent: false };
    await repo.createHold(input);
    await repo.createHold({ ...input, marketingConsent: true, interest: 'Warhammer' });
    const matches = (await repo.listCustomers()).filter((x) => x.email === 'casey@x.test');
    expect(matches).toHaveLength(1);
    expect(matches[0]!.marketingConsent).toBe(true);
  });
});

describe('special orders and back-in-stock', () => {
  it('moves an order through the pipeline and emails when it arrives', async () => {
    const o = await repo.createSpecialOrder({ productName: 'Gloomhaven', name: 'Pat', email: 'pat@x.test', phone: '', note: '', marketingConsent: false });
    expect(o.stage).toBe('requested');
    await repo.setOrderStage(o.id, 'ordered');
    await repo.setOrderStage(o.id, 'arrived');
    expect((await repo.listSpecialOrders()).find((x) => x.id === o.id)!.stage).toBe('arrived');
    expect((await repo.listOutbox())[0]!.kind).toBe('order-arrived');
  });
  it('creates a back-in-stock request and the notify button logs a demo email', async () => {
    const r = await repo.createBackInStock({ sku: 'BG-CODENAMES', productName: 'Codenames', name: 'Lee', email: 'lee@x.test', phone: '', marketingConsent: false });
    await repo.notifyBackInStock(r.id);
    const stored = (await repo.listBackInStock()).find((x) => x.id === r.id)!;
    expect(stored.notifiedAt).toBe(NOW.toISOString());
    expect((await repo.listOutbox())[0]).toMatchObject({ kind: 'back-in-stock', to: 'lee@x.test' });
  });
});

describe('events and seats', () => {
  const FULL_ID = 'ser-dnd__2026-11-13';

  it('seeds the first D&D one-shot as full so the waitlist flow is visible', async () => {
    expect((await repo.listSignups(FULL_ID)).filter((s) => s.status === 'seated')).toHaveLength(6);
  });
  it('seats someone when there is room', async () => {
    const evt = (await repo.listEvents()).find((e) => e.seriesId === 'ser-paint')!;
    const before = (await repo.listSignups(evt.id)).length;
    const res = await repo.createSignup({ eventId: evt.id, name: 'Sky', email: 'sky@x.test', marketingConsent: false });
    expect(res.outcome).toBe('seated');
    expect(await repo.listSignups(evt.id)).toHaveLength(before + 1);
  });
  it('waitlists when the event is full and refuses a second sign-up with the same email', async () => {
    const res = await repo.createSignup({ eventId: FULL_ID, name: 'Sky', email: 'sky@x.test', marketingConsent: false });
    expect(res.outcome).toBe('waitlist');
    const e = await catchError(repo.createSignup({ eventId: FULL_ID, name: 'Sky', email: 'SKY@x.test', marketingConsent: false }));
    expect(e.code).toBe('duplicate');
  });
  it('never over-fills: the last seat goes to the first request', async () => {
    const evt = (await repo.listEvents()).find((e) => e.seriesId === 'ser-paint')!;
    const taken = (await repo.listSignups(evt.id)).filter((s) => s.status === 'seated').length;
    const open = evt.capacity - taken;
    const results = [];
    for (let i = 0; i < open + 2; i += 1) {
      results.push(await repo.createSignup({ eventId: evt.id, name: `Guest ${i}`, email: `g${i}@x.test`, marketingConsent: false }));
    }
    expect(results.filter((r) => r.outcome === 'seated')).toHaveLength(open);
    expect(results.filter((r) => r.outcome === 'waitlist')).toHaveLength(2);
    expect((await repo.listSignups(evt.id)).filter((s) => s.status === 'seated')).toHaveLength(evt.capacity);
  });
  it('promotes from the waitlist only when a seat opens', async () => {
    const res = await repo.createSignup({ eventId: FULL_ID, name: 'Sky', email: 'sky@x.test', marketingConsent: false });
    const e = await catchError(repo.promoteSignup(res.signup.id));
    expect(e.code).toBe('conflict');
    const seated = (await repo.listSignups(FULL_ID)).find((s) => s.status === 'seated')!;
    await repo.setSignupStatus(seated.id, 'cancelled');
    await repo.promoteSignup(res.signup.id);
    expect((await repo.listSignups(FULL_ID)).find((s) => s.id === res.signup.id)!.status).toBe('seated');
    expect((await repo.listOutbox())[0]!.kind).toBe('event-promoted');
  });
  it('checks people in at the door', async () => {
    const seated = (await repo.listSignups(FULL_ID))[0]!;
    await repo.setSignupStatus(seated.id, 'checked-in');
    expect((await repo.listSignups(FULL_ID)).find((s) => s.id === seated.id)!.status).toBe('checked-in');
  });
  it('refuses sign-ups for open events, unknown events and past events', async () => {
    expect((await catchError(repo.createSignup({ eventId: 'evt-holiday', name: 'Sky', email: 'sky@x.test', marketingConsent: false }))).code).toBe('conflict');
    expect((await catchError(repo.createSignup({ eventId: 'nope', name: 'Sky', email: 'sky@x.test', marketingConsent: false }))).code).toBe('not-found');
  });
  it('keeps past events in history and out of the upcoming list', async () => {
    const { upcoming, past } = splitEvents(await repo.listEvents(), NOW);
    expect(upcoming.some((e) => e.date < '2026-11-11')).toBe(false);
    expect(past.map((e) => e.title)).toContain('21st Anniversary Event');
  });
  it('creates one-off and recurring events', async () => {
    await repo.createEvent({ title: 'Pokémon Prerelease', type: 'cards', startTime: '12:00', endTime: '16:00', capacity: 20, feeCents: 3000, note: '', description: '', schedule: { mode: 'one-off', date: '2026-12-12' } });
    await repo.createEvent({ title: 'Board game night', type: 'store', startTime: '18:00', endTime: '21:00', capacity: 30, feeCents: 0, note: '', description: '', schedule: { mode: 'recurring', rule: { kind: 'weekly', weekday: 3 } } });
    const events = await repo.listEvents();
    expect(events.some((e) => e.title === 'Pokémon Prerelease' && e.date === '2026-12-12')).toBe(true);
    const nights = events.filter((e) => e.title === 'Board game night');
    expect(nights.length).toBeGreaterThan(8);
    expect(nights.every((e) => e.startsAt > NOW.toISOString())).toBe(true);
    expect((await repo.listSignups(nights[0]!.id)).length).toBeGreaterThan(0);
  });
  it('validates event forms', async () => {
    const e = await catchError(repo.createEvent({ title: 'X', type: 'cards', startTime: '18:00', endTime: '17:00', capacity: 5, feeCents: 0, note: '', description: '', schedule: { mode: 'one-off', date: '2026-12-12' } }));
    expect(e.code).toBe('validation');
    expect(e.fields?.title).toBeDefined();
    expect(e.fields?.endTime).toBeDefined();
  });
  it('edits and deletes events', async () => {
    const evt = (await repo.listEvents()).find((e) => e.id === 'evt-holiday')!;
    await repo.updateEvent(evt.id, { title: 'Holiday sale', type: 'store', startTime: '09:00', endTime: '18:00', capacity: 0, feeCents: 0, note: '', description: '', schedule: { mode: 'one-off', date: '2026-11-21' } });
    expect((await repo.listEvents()).find((e) => e.id === 'evt-holiday')!.title).toBe('Holiday sale');
    await repo.deleteEvent('evt-holiday');
    expect((await repo.listEvents()).some((e) => e.id === 'evt-holiday')).toBe(false);
  });
});

describe('settings and persistence', () => {
  it('turning the banner off is saved and survives a reload', async () => {
    const s = await repo.getSettings();
    await repo.updateSettings({ banner: { ...s.banner, enabled: false } });
    const reloaded = new MockRepository({ storage, now: () => NOW });
    expect((await reloaded.getSettings()).banner.enabled).toBe(false);
  });
  it('a hold made on one page is visible to another repository instance on the same storage', async () => {
    const hold = await repo.createHold({ sku: 'PT-NULN', productName: 'Nuln Oil', name: 'Casey', phone: '705-555-0100', email: '', marketingConsent: false });
    const admin = new MockRepository({ storage, now: () => NOW });
    expect((await admin.listHolds()).some((h) => h.id === hold.id)).toBe(true);
  });
  it('notifies subscribers on change', async () => {
    let calls = 0;
    const off = repo.subscribe(() => { calls += 1; });
    await repo.updateSettings({ d20PromoEnabled: false });
    off();
    await repo.updateSettings({ d20PromoEnabled: true });
    expect(calls).toBe(1);
  });
  it('reset demo data brings back the sample data', async () => {
    await repo.createHold({ sku: 'PT-NULN', productName: 'Nuln Oil', name: 'Casey', phone: '705-555-0100', email: '', marketingConsent: false });
    await repo.updateSettings({ d20PromoEnabled: false });
    await repo.resetDemo();
    expect((await repo.getSettings()).d20PromoEnabled).toBe(true);
    expect((await repo.listHolds()).filter((h) => h.name === 'Casey')).toHaveLength(0);
    expect(storage.getItem(STATE_KEY)).not.toBeNull();
  });
  it('recovers from corrupted storage', async () => {
    storage.setItem(STATE_KEY, '{not json');
    const fresh = new MockRepository({ storage, now: () => NOW });
    expect((await fresh.listHolds()).length).toBeGreaterThan(0);
  });
});

describe('stock through the inventory source', () => {
  it('merges POS items with staff overrides', async () => {
    const source = new MockInventorySource(storage, () => NOW);
    await repo.setOverride({ sku: 'PT-LEADBELCHER', status: 'out', shelf: 'Back room' });
    const products = await loadProducts(source, repo);
    const p = products.find((x) => x.sku === 'PT-LEADBELCHER')!;
    expect(p).toMatchObject({ status: 'out', shelf: 'Back room', overridden: true });
    await repo.clearOverride('PT-LEADBELCHER');
    expect((await loadProducts(source, repo)).find((x) => x.sku === 'PT-LEADBELCHER')!.status).toBe('in');
  });
  it('records the sync time once and keeps it stable, about 40 minutes before first use', async () => {
    const source = new MockInventorySource(storage, () => NOW);
    const first = await source.lastSyncedAt();
    expect(NOW.getTime() - first!.getTime()).toBe(40 * 60_000);
    const later = new MockInventorySource(storage, () => new Date(NOW.getTime() + 3_600_000));
    expect((await later.lastSyncedAt())!.toISOString()).toBe(first!.toISOString());
    expect(storage.getItem(SYNC_STORAGE_KEY)).toBe(first!.toISOString());
  });
  it('reports no sync time when there is no storage (server render)', async () => {
    expect(await new MockInventorySource(null).lastSyncedAt()).toBeNull();
  });
});
