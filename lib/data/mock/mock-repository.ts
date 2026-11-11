import { addHours } from 'date-fns';
import { z } from 'zod';
import {
  backInStockSchema,
  eventFormSchema,
  fieldErrors,
  holdRequestSchema,
  orderRequestSchema,
  productOverrideSchema,
  signupSchema,
  type EventFormInput,
} from '@/lib/domain/schemas';
import { interestForEvent } from '@/lib/domain/interests';
import type {
  BackInStockRequest,
  Customer,
  EventSeries,
  EventSignup,
  Hold,
  HoldStatus,
  Interest,
  OneOffEvent,
  OrderStage,
  OutboxMessage,
  ProductOverride,
  Settings,
  SignupStatus,
  SpecialOrder,
  StoreEvent,
} from '@/lib/domain/types';
import { buildEventList, slugify } from '@/lib/events/events';
import { canPromote, decideSignup, seatSummary } from '@/lib/events/seats';
import { formatFee } from '@/lib/money';
import {
  RepositoryError,
  type BackInStockCreate,
  type DataRepository,
  type HoldInput,
  type OrderInput,
  type SignupResult,
} from '../repository';
import { SAMPLE_NAMES, buildSeed, hash01, type DemoState } from './seed';

export const STATE_KEY = 'sgal-demo-state-v1';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface MockRepositoryOptions {
  /** localStorage in the browser. null keeps everything in memory (server render, tests). */
  storage?: StorageLike | null;
  now?: () => Date;
}

const digits = (s: string) => s.replace(/\D/g, '');

export class MockRepository implements DataRepository {
  private state: DemoState | null = null;
  private readonly listeners = new Set<() => void>();
  private readonly storage: StorageLike | null;
  private readonly now: () => Date;
  private seq = 0;

  constructor(options: MockRepositoryOptions = {}) {
    this.storage = options.storage ?? null;
    this.now = options.now ?? (() => new Date());
  }

  // ---------- plumbing ----------

  private id(prefix: string): string {
    this.seq += 1;
    const rand =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);
    return `${prefix}-${rand}${this.seq}`;
  }

  private load(): DemoState {
    if (this.state) return this.state;
    let loaded: DemoState | null = null;
    if (this.storage) {
      try {
        const raw = this.storage.getItem(STATE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as DemoState;
          if (parsed.version === 1) loaded = parsed;
        }
      } catch {
        loaded = null;
      }
    }
    this.state = loaded ?? buildSeed(this.now());
    this.ensureSeedSignups(this.state);
    if (!loaded) this.persist();
    return this.state;
  }

  private persist(): void {
    if (!this.storage || !this.state) return;
    try {
      this.storage.setItem(STATE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage full or blocked: the demo keeps working in memory.
    }
  }

  private commit(): void {
    this.persist();
    for (const l of this.listeners) l();
  }

  /** Called when another tab changed storage. */
  reloadFromStorage(): void {
    this.state = null;
    for (const l of this.listeners) l();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private allEvents(s: DemoState): StoreEvent[] {
    return buildEventList({ oneOffs: s.oneOffs, series: s.series }, this.now());
  }

  /**
   * Give every upcoming event some sample sign-ups the first time we see it, so the demo
   * always looks lived-in. Sample people use reserved example.invalid addresses.
   */
  private ensureSeedSignups(s: DemoState): void {
    const now = this.now().toISOString();
    const firstOfSeries = new Set<string>();
    for (const e of this.allEvents(s)) {
      if (e.capacity <= 0 || e.endsAt <= now || s.seededEvents.includes(e.id)) continue;
      const isFirstOfSeries = e.seriesId !== undefined && !firstOfSeries.has(e.seriesId);
      if (e.seriesId) firstOfSeries.add(e.seriesId);
      // The first D&D one-shot is full, so the waitlist flow is visible in the demo.
      const full = isFirstOfSeries && e.seriesId === 'ser-dnd';
      const taken = full ? e.capacity : Math.min(e.capacity - 1, Math.round(e.capacity * (0.25 + 0.65 * hash01(e.id))));
      for (let i = 0; i < taken; i += 1) {
        s.signups.push({
          id: this.id('sup'),
          eventId: e.id,
          name: `${SAMPLE_NAMES[(i + Math.floor(hash01(e.id) * 20)) % SAMPLE_NAMES.length]} (sample)`,
          email: `sample-${slugify(e.id)}-${i + 1}@example.invalid`,
          status: 'seated',
          createdAt: new Date(this.now().getTime() - (taken - i) * 3_600_000).toISOString(),
          marketingConsent: false,
        });
      }
      s.seededEvents.push(e.id);
    }
  }

  private upsertCustomer(
    s: DemoState,
    who: { name: string; phone?: string; email?: string; marketingConsent: boolean },
    source: string,
    interest?: Interest,
  ): void {
    const email = who.email?.trim().toLowerCase() || undefined;
    const phone = who.phone?.trim() ? digits(who.phone) : undefined;
    const existing = s.customers.find(
      (c) => (email && c.email?.toLowerCase() === email) || (phone && c.phone && digits(c.phone) === phone),
    );
    const nowIso = this.now().toISOString();
    if (existing) {
      if (interest && !existing.interests.includes(interest)) existing.interests.push(interest);
      if (who.marketingConsent && !existing.marketingConsent) {
        existing.marketingConsent = true;
        existing.consentAt = nowIso;
        existing.consentSource = source;
      }
      return;
    }
    s.customers.push({
      id: this.id('cus'),
      name: who.name,
      email: who.email?.trim() || undefined,
      phone: who.phone?.trim() || undefined,
      interests: interest ? [interest] : [],
      marketingConsent: who.marketingConsent,
      consentAt: who.marketingConsent ? nowIso : undefined,
      consentSource: who.marketingConsent ? source : undefined,
      createdAt: nowIso,
    });
  }

  private parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
    const result = schema.safeParse(input);
    if (!result.success) {
      throw new RepositoryError('validation', 'Please check the highlighted fields.', fieldErrors(result.error));
    }
    return result.data;
  }

  // ---------- settings ----------

  async getSettings(): Promise<Settings> {
    return structuredClone(this.load().settings);
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const s = this.load();
    s.settings = { ...s.settings, ...patch };
    this.commit();
    return structuredClone(s.settings);
  }

  // ---------- stock overrides ----------

  async listOverrides(): Promise<ProductOverride[]> {
    return structuredClone(this.load().overrides);
  }

  async setOverride(override: ProductOverride): Promise<void> {
    const valid = this.parse(productOverrideSchema, override) as ProductOverride;
    const s = this.load();
    const i = s.overrides.findIndex((o) => o.sku === valid.sku);
    if (i >= 0) s.overrides[i] = { ...s.overrides[i], ...valid };
    else s.overrides.push(valid);
    this.commit();
  }

  async clearOverride(sku: string): Promise<void> {
    const s = this.load();
    s.overrides = s.overrides.filter((o) => o.sku !== sku);
    this.commit();
  }

  // ---------- holds ----------

  async listHolds(): Promise<Hold[]> {
    const now = this.now().toISOString();
    return structuredClone(this.load().holds)
      .map((h) => (h.status === 'active' && h.expiresAt < now ? { ...h, status: 'expired' as const } : h))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createHold(input: HoldInput): Promise<Hold> {
    const data = this.parse(holdRequestSchema, input);
    const s = this.load();
    const created = this.now();
    const hold: Hold = {
      id: this.id('hold'),
      sku: data.sku,
      productName: input.productName,
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      createdAt: created.toISOString(),
      expiresAt: addHours(created, s.settings.holdHours).toISOString(),
      status: 'active',
    };
    s.holds.push(hold);
    this.upsertCustomer(s, data, 'website hold form', input.interest);
    if (hold.email) {
      this.pushOutbox(s, {
        kind: 'hold-confirmation',
        to: hold.email,
        subject: `Your hold at Sir Games-A-Lot: ${hold.productName}`,
        body: `Hi ${hold.name}, we're holding ${hold.productName} at the counter for ${s.settings.holdHours} hours.`,
      });
    }
    this.commit();
    return structuredClone(hold);
  }

  async setHoldStatus(id: string, status: HoldStatus): Promise<void> {
    const s = this.load();
    const hold = s.holds.find((h) => h.id === id);
    if (!hold) throw new RepositoryError('not-found', 'Hold not found.');
    hold.status = status;
    this.commit();
  }

  // ---------- special orders ----------

  async listSpecialOrders(): Promise<SpecialOrder[]> {
    return structuredClone(this.load().orders).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createSpecialOrder(input: OrderInput): Promise<SpecialOrder> {
    const data = this.parse(orderRequestSchema, input);
    const s = this.load();
    const order: SpecialOrder = {
      id: this.id('ord'),
      sku: data.sku,
      productName: data.productName,
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      note: data.note || undefined,
      createdAt: this.now().toISOString(),
      stage: 'requested',
    };
    s.orders.push(order);
    this.upsertCustomer(s, data, 'website order form', input.interest);
    this.commit();
    return structuredClone(order);
  }

  async setOrderStage(id: string, stage: OrderStage): Promise<void> {
    const s = this.load();
    const order = s.orders.find((o) => o.id === id);
    if (!order) throw new RepositoryError('not-found', 'Order not found.');
    order.stage = stage;
    if (stage === 'arrived' && order.email) {
      this.pushOutbox(s, {
        kind: 'order-arrived',
        to: order.email,
        subject: `Your order is in: ${order.productName}`,
        body: `Hi ${order.name}, ${order.productName} has arrived at Sir Games-A-Lot.`,
      });
    }
    this.commit();
  }

  // ---------- back in stock ----------

  async listBackInStock(): Promise<BackInStockRequest[]> {
    return structuredClone(this.load().backInStock).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createBackInStock(input: BackInStockCreate): Promise<BackInStockRequest> {
    const data = this.parse(backInStockSchema, input);
    const s = this.load();
    const req: BackInStockRequest = {
      id: this.id('bis'),
      sku: data.sku,
      productName: input.productName,
      name: data.name,
      phone: data.phone || undefined,
      email: data.email || undefined,
      createdAt: this.now().toISOString(),
    };
    s.backInStock.push(req);
    this.upsertCustomer(s, data, 'website back-in-stock form', input.interest);
    this.commit();
    return structuredClone(req);
  }

  async notifyBackInStock(id: string): Promise<void> {
    const s = this.load();
    const req = s.backInStock.find((r) => r.id === id);
    if (!req) throw new RepositoryError('not-found', 'Request not found.');
    req.notifiedAt = this.now().toISOString();
    if (req.email) {
      this.pushOutbox(s, {
        kind: 'back-in-stock',
        to: req.email,
        subject: `${req.productName} is back at Sir Games-A-Lot`,
        body: `Hi ${req.name}, good news: ${req.productName} is back on the shelf.`,
      });
    }
    this.commit();
  }

  // ---------- events ----------

  async listEvents(): Promise<StoreEvent[]> {
    return this.allEvents(this.load());
  }

  async getEventBySlug(slug: string): Promise<StoreEvent | null> {
    return this.allEvents(this.load()).find((e) => e.slug === slug) ?? null;
  }

  async listSeries(): Promise<EventSeries[]> {
    return structuredClone(this.load().series);
  }

  private fieldsFrom(data: EventFormInput) {
    return {
      title: data.title,
      type: data.type,
      startTime: data.startTime,
      endTime: data.endTime,
      capacity: data.capacity,
      feeCents: data.feeCents,
      note: data.note,
      description: data.description,
    };
  }

  async createEvent(input: EventFormInput): Promise<void> {
    const data = this.parse(eventFormSchema, input);
    const s = this.load();
    if (data.schedule.mode === 'one-off') {
      const id = this.id('evt');
      s.oneOffs.push({
        ...this.fieldsFrom(data),
        id,
        slug: `${slugify(data.title)}-${data.schedule.date}`,
        date: data.schedule.date,
      });
    } else {
      s.series.push({ ...this.fieldsFrom(data), id: this.id('ser'), rule: data.schedule.rule as EventSeries['rule'] });
    }
    this.ensureSeedSignups(s);
    this.commit();
  }

  async updateEvent(eventId: string, input: EventFormInput): Promise<void> {
    const data = this.parse(eventFormSchema, input);
    const s = this.load();
    const seriesId = eventId.includes('__') ? eventId.split('__')[0] : eventId;
    const series = s.series.find((x) => x.id === seriesId);
    if (series) {
      if (data.schedule.mode !== 'recurring') {
        throw new RepositoryError('conflict', 'A recurring event stays recurring. Create a one-off event instead.');
      }
      Object.assign(series, this.fieldsFrom(data), { rule: data.schedule.rule as EventSeries['rule'] });
      this.commit();
      return;
    }
    const one = s.oneOffs.find((x) => x.id === eventId);
    if (!one) throw new RepositoryError('not-found', 'Event not found.');
    if (data.schedule.mode !== 'one-off') {
      throw new RepositoryError('conflict', 'A one-off event stays one-off. Create a recurring event instead.');
    }
    Object.assign(one, this.fieldsFrom(data), {
      date: data.schedule.date,
      slug: `${slugify(data.title)}-${data.schedule.date}`,
    } satisfies Partial<OneOffEvent>);
    this.commit();
  }

  async deleteEvent(eventId: string): Promise<void> {
    const s = this.load();
    const seriesId = eventId.includes('__') ? eventId.split('__')[0] : eventId;
    s.series = s.series.filter((x) => x.id !== seriesId);
    s.oneOffs = s.oneOffs.filter((x) => x.id !== eventId);
    s.signups = s.signups.filter((x) => x.eventId !== eventId && !x.eventId.startsWith(`${seriesId}__`));
    this.commit();
  }

  // ---------- signups ----------

  async listSignups(eventId?: string): Promise<EventSignup[]> {
    const all = structuredClone(this.load().signups);
    return (eventId ? all.filter((x) => x.eventId === eventId) : all).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  }

  async createSignup(input: z.input<typeof signupSchema>): Promise<SignupResult> {
    const data = this.parse(signupSchema, input);
    const s = this.load();
    const event = this.allEvents(s).find((e) => e.id === data.eventId);
    if (!event) throw new RepositoryError('not-found', 'We could not find that event.');
    if (event.capacity <= 0) throw new RepositoryError('conflict', 'This event is open to everyone. No seat needed.');
    if (event.endsAt <= this.now().toISOString()) throw new RepositoryError('conflict', 'That event has already happened.');
    const forEvent = s.signups.filter((x) => x.eventId === event.id);
    const decision = decideSignup(event.capacity, forEvent, data.email);
    if (decision === 'duplicate') {
      throw new RepositoryError('duplicate', 'That email already has a seat or a spot on the waitlist.', {
        email: 'That email already has a seat or a spot on the waitlist.',
      });
    }
    const signup: EventSignup = {
      id: this.id('sup'),
      eventId: event.id,
      name: data.name,
      email: data.email,
      status: decision,
      createdAt: this.now().toISOString(),
      marketingConsent: data.marketingConsent,
    };
    s.signups.push(signup);
    this.upsertCustomer(s, { name: data.name, email: data.email, marketingConsent: data.marketingConsent }, 'website event sign-up', interestForEvent(event.type));
    this.pushOutbox(s, {
      kind: 'event-confirmation',
      to: data.email,
      subject: decision === 'seated' ? `You're in: ${event.title}` : `You're on the waitlist: ${event.title}`,
      body:
        decision === 'seated'
          ? `Hi ${data.name}, your seat is saved for ${event.title}. Fee ${formatFee(event.feeCents)}, paid at the counter.`
          : `Hi ${data.name}, ${event.title} is full. You're on the waitlist and we'll email if a seat opens.`,
    });
    this.commit();
    return { signup: structuredClone(signup), outcome: decision };
  }

  async setSignupStatus(id: string, status: SignupStatus): Promise<void> {
    const s = this.load();
    const signup = s.signups.find((x) => x.id === id);
    if (!signup) throw new RepositoryError('not-found', 'Sign-up not found.');
    signup.status = status;
    this.commit();
  }

  async promoteSignup(id: string): Promise<void> {
    const s = this.load();
    const signup = s.signups.find((x) => x.id === id);
    if (!signup) throw new RepositoryError('not-found', 'Sign-up not found.');
    if (signup.status !== 'waitlist') throw new RepositoryError('conflict', 'Only someone on the waitlist can be promoted.');
    const event = this.allEvents(s).find((e) => e.id === signup.eventId);
    const forEvent = s.signups.filter((x) => x.eventId === signup.eventId);
    if (!event || !canPromote(event.capacity, forEvent)) {
      throw new RepositoryError('conflict', 'No open seat. Mark someone as cancelled or no-show first.');
    }
    signup.status = 'seated';
    this.pushOutbox(s, {
      kind: 'event-promoted',
      to: signup.email,
      subject: `A seat opened up: ${event.title}`,
      body: `Hi ${signup.name}, good news: you're off the waitlist for ${event.title}.`,
    });
    this.commit();
  }

  /** Seats left for an event, used by tests and the public pages. */
  async seatsFor(eventId: string, capacity: number) {
    return seatSummary(capacity, await this.listSignups(eventId));
  }

  // ---------- customers ----------

  async listCustomers(): Promise<Customer[]> {
    return structuredClone(this.load().customers).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // ---------- outbox ----------

  private pushOutbox(s: DemoState, msg: Omit<OutboxMessage, 'id' | 'createdAt'>): OutboxMessage {
    const message: OutboxMessage = { ...msg, id: this.id('out'), createdAt: this.now().toISOString() };
    s.outbox.unshift(message);
    return message;
  }

  async listOutbox(): Promise<OutboxMessage[]> {
    return structuredClone(this.load().outbox);
  }

  async queueEmail(message: Omit<OutboxMessage, 'id' | 'createdAt'>): Promise<OutboxMessage> {
    const s = this.load();
    const m = this.pushOutbox(s, message);
    this.commit();
    return structuredClone(m);
  }

  // ---------- demo ----------

  async resetDemo(): Promise<void> {
    if (this.storage) {
      try {
        this.storage.removeItem(STATE_KEY);
      } catch {
        // ignore
      }
    }
    this.state = buildSeed(this.now());
    this.ensureSeedSignups(this.state);
    this.commit();
  }
}
