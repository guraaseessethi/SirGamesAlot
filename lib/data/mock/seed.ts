import { addDays } from 'date-fns';
import { DEFAULT_HOURS } from '@/lib/hours/hours';
import { nthWeekdayOfMonth } from '@/lib/events/recurrence';
import type {
  BackInStockRequest,
  Customer,
  EventSeries,
  EventSignup,
  Hold,
  OneOffEvent,
  Settings,
  SpecialOrder,
} from '@/lib/domain/types';

export interface DemoState {
  version: 1;
  settings: Settings;
  series: EventSeries[];
  oneOffs: OneOffEvent[];
  signups: EventSignup[];
  /** Event ids that already have their sample sign-ups, so re-seeding never duplicates. */
  seededEvents: string[];
  holds: Hold[];
  orders: SpecialOrder[];
  backInStock: BackInStockRequest[];
  customers: Customer[];
  overrides: import('@/lib/domain/types').ProductOverride[];
  outbox: import('@/lib/domain/types').OutboxMessage[];
}

export function defaultSettings(): Settings {
  return {
    banner: {
      enabled: true,
      headline: "YES, WE'RE OPEN!",
      body: 'Mall construction has closed the main doors. Use the Coulter Street entrance and head to the lower level.',
      linkLabel: 'Entrance map →',
      linkHref: '/visit#entrance',
    },
    weeklyHours: structuredClone(DEFAULT_HOURS),
    holidayOverrides: [
      {
        id: 'hol-1',
        date: '2026-12-24',
        label: 'Christmas Eve (sample)',
        hours: { open: '09:30', close: '17:00' },
      },
      { id: 'hol-2', date: '2026-12-25', label: 'Christmas Day (sample)', hours: null },
      { id: 'hol-3', date: '2027-01-01', label: "New Year's Day (sample)", hours: null },
    ],
    holdHours: 24,
    d20PromoEnabled: true,
    nextAnniversaryLabel: 'May 2027 · date TBA',
  };
}

const series = (): EventSeries[] => [
  {
    id: 'ser-40k',
    title: 'Warhammer 40K tournament',
    type: 'warhammer',
    rule: { kind: 'nth-weekday', weekday: 6, nth: 3 },
    startTime: '10:00',
    endTime: '18:00',
    capacity: 16,
    feeCents: 2500,
    note: '2,000 points · 3 rounds',
    description:
      'A friendly three-round tournament at 2,000 points. Bring your painted (or not yet painted) army, your codex and your dice. Lunch break between rounds two and three.',
  },
  {
    id: 'ser-paint',
    title: 'Paint night',
    type: 'paint',
    rule: { kind: 'last-weekday', weekday: 4 },
    startTime: '18:00',
    endTime: '21:00',
    capacity: 12,
    feeCents: 1500,
    note: 'Paints and a mini included',
    description:
      'Pull up a stool at the playspace. Staff show you the basics, you paint a mini from the box and take it home. Great first night for new painters.',
  },
  {
    id: 'ser-riftbound',
    title: 'Riftbound league night',
    type: 'cards',
    rule: { kind: 'nth-weekday', weekday: 5, nth: 2 },
    startTime: '18:00',
    endTime: '22:00',
    capacity: 24,
    feeCents: 1000,
    note: 'League of Legends TCG · prize support',
    description:
      'Monthly league play for the Riftbound trading card game, with prize support. New players are welcome; ask staff for a learn-to-play deck.',
  },
  {
    id: 'ser-dnd',
    title: 'D&D one-shot',
    type: 'dnd',
    rule: { kind: 'weekly', weekday: 5 },
    startTime: '18:30',
    endTime: '22:00',
    capacity: 6,
    feeCents: 1000,
    note: 'New players welcome',
    description:
      'A self-contained Dungeons & Dragons adventure run by a store DM. Characters and dice are provided, so you can just show up and play.',
  },
];

/** Third Saturday of November, or first Saturday of December if that has passed. */
function holidayEventDate(now: Date): string {
  const y = now.getUTCFullYear();
  const today = now.toISOString().slice(0, 10);
  const nov = nthWeekdayOfMonth(y, 10, 6, 3);
  if (nov >= today) return nov;
  const dec = nthWeekdayOfMonth(y, 11, 6, 1);
  if (dec >= today) return dec;
  return nthWeekdayOfMonth(y + 1, 10, 6, 3);
}

const oneOffs = (now: Date): OneOffEvent[] => [
  {
    id: 'evt-holiday',
    slug: 'holiday-shopping-event',
    date: holidayEventDate(now),
    title: 'Holiday shopping event',
    type: 'store',
    startTime: '10:00',
    endTime: '17:00',
    capacity: 0,
    feeCents: 0,
    note: 'Sales, vendors, cosplay contest · d20 discounts',
    description:
      'Our holiday shopping day: sales, vendors, snacks, a cosplay contest, and the d20 "take 10% or roll for it" discounts. Drop in any time.',
  },
  {
    id: 'evt-past-21',
    slug: '21st-anniversary-event-2026-05-16',
    date: '2026-05-16',
    title: '21st Anniversary Event',
    type: 'store',
    startTime: '10:00',
    endTime: '17:00',
    capacity: 0,
    feeCents: 0,
    note: 'Cosplay contest at 2 pm',
    description: 'Sales, vendors, gaming, snacks and a cosplay contest.',
  },
  {
    id: 'evt-past-nbc',
    slug: 'nightmare-before-christmas-event-2025-11-15',
    date: '2025-11-15',
    title: 'Nightmare Before Christmas Event',
    type: 'store',
    startTime: '10:00',
    endTime: '17:00',
    capacity: 0,
    feeCents: 0,
    note: '10 am to 5 pm',
    description: 'A seasonal in-store event.',
  },
  {
    id: 'evt-past-20',
    slug: '20th-anniversary-event-2025-05-03',
    date: '2025-05-03',
    title: '20th Anniversary Event',
    type: 'store',
    startTime: '10:00',
    endTime: '17:00',
    capacity: 0,
    feeCents: 0,
    note: 'Cosplay contest at 3:30 pm',
    description: 'Sales, vendors, gaming, snacks and a cosplay contest.',
  },
];

const mins = (now: Date, m: number) => new Date(now.getTime() + m * 60_000).toISOString();

export function buildSeed(now: Date): DemoState {
  const holds: Hold[] = [
    {
      id: 'hold-seed-1',
      sku: 'PT-NULN',
      productName: 'Nuln Oil',
      name: 'Sample: Jordan',
      phone: '705-555-0123',
      createdAt: mins(now, -22 * 60),
      expiresAt: mins(now, 2 * 60),
      status: 'active',
    },
    {
      id: 'hold-seed-2',
      sku: 'WH-CODEX-SM',
      productName: 'Codex: Space Marines',
      name: 'Sample: Priya',
      email: 'sample-priya@example.invalid',
      createdAt: mins(now, -3 * 60),
      expiresAt: mins(now, 21 * 60),
      status: 'active',
    },
    {
      id: 'hold-seed-3',
      sku: 'BG-WINGSPAN',
      productName: 'Wingspan',
      name: 'Sample: Sam',
      phone: '705-555-0188',
      createdAt: mins(now, -50 * 60),
      expiresAt: mins(now, -26 * 60),
      status: 'active',
    },
  ];
  const orders: SpecialOrder[] = [
    {
      id: 'ord-seed-1',
      sku: 'WH-KT-START',
      productName: 'Kill Team starter set',
      name: 'Sample: Alex',
      email: 'sample-alex@example.invalid',
      note: '',
      createdAt: mins(now, -26 * 60),
      stage: 'requested',
    },
    {
      id: 'ord-seed-2',
      productName: 'Gloomhaven (second printing)',
      name: 'Sample: Morgan',
      phone: '705-555-0147',
      note: 'Birthday gift, needed by the 20th.',
      createdAt: mins(now, -4 * 24 * 60),
      stage: 'ordered',
    },
    {
      id: 'ord-seed-3',
      sku: 'DD-EBERRON',
      productName: 'Eberron setting book',
      name: 'Sample: Riley',
      email: 'sample-riley@example.invalid',
      note: '',
      createdAt: mins(now, -6 * 24 * 60),
      stage: 'arrived',
    },
  ];
  const backInStock: BackInStockRequest[] = [
    {
      id: 'bis-seed-1',
      sku: 'PT-MACRAGGE',
      productName: 'Macragge Blue',
      name: 'Sample: Taylor',
      email: 'sample-taylor@example.invalid',
      createdAt: mins(now, -2 * 24 * 60),
    },
    {
      id: 'bis-seed-2',
      sku: 'PT-MACRAGGE',
      productName: 'Macragge Blue',
      name: 'Sample: Devon',
      phone: '705-555-0166',
      createdAt: mins(now, -24 * 60),
    },
    {
      id: 'bis-seed-3',
      sku: 'BG-CODENAMES',
      productName: 'Codenames',
      name: 'Sample: Quinn',
      email: 'sample-quinn@example.invalid',
      createdAt: mins(now, -5 * 60),
    },
  ];
  const created = mins(now, -7 * 24 * 60);
  const customers: Customer[] = [
    {
      id: 'cus-seed-1',
      name: 'Sample: Jordan',
      phone: '705-555-0123',
      interests: ['Paints', 'Warhammer'],
      marketingConsent: true,
      consentAt: created,
      consentSource: 'website hold form',
      createdAt: created,
    },
    {
      id: 'cus-seed-2',
      name: 'Sample: Priya',
      email: 'sample-priya@example.invalid',
      interests: ['Warhammer'],
      marketingConsent: false,
      createdAt: created,
    },
    {
      id: 'cus-seed-3',
      name: 'Sample: Sam',
      phone: '705-555-0188',
      interests: ['Board games'],
      marketingConsent: false,
      createdAt: created,
    },
    {
      id: 'cus-seed-4',
      name: 'Sample: Alex',
      email: 'sample-alex@example.invalid',
      interests: ['Warhammer'],
      marketingConsent: true,
      consentAt: created,
      consentSource: 'website order form',
      createdAt: created,
    },
    {
      id: 'cus-seed-5',
      name: 'Sample: Morgan',
      phone: '705-555-0147',
      interests: ['Board games'],
      marketingConsent: false,
      createdAt: created,
    },
    {
      id: 'cus-seed-6',
      name: 'Sample: Riley',
      email: 'sample-riley@example.invalid',
      interests: ['D&D'],
      marketingConsent: true,
      consentAt: created,
      consentSource: 'website order form',
      createdAt: created,
    },
    {
      id: 'cus-seed-7',
      name: 'Sample: Taylor',
      email: 'sample-taylor@example.invalid',
      interests: ['Paints'],
      marketingConsent: false,
      createdAt: created,
    },
    {
      id: 'cus-seed-8',
      name: 'Sample: Devon',
      phone: '705-555-0166',
      interests: ['Paints'],
      marketingConsent: false,
      createdAt: created,
    },
    {
      id: 'cus-seed-9',
      name: 'Sample: Quinn',
      email: 'sample-quinn@example.invalid',
      interests: ['Board games'],
      marketingConsent: true,
      consentAt: created,
      consentSource: 'website back-in-stock form',
      createdAt: created,
    },
  ];
  return {
    version: 1,
    settings: defaultSettings(),
    series: series(),
    oneOffs: oneOffs(now),
    signups: [],
    seededEvents: [],
    holds,
    orders,
    backInStock,
    customers,
    overrides: [],
    outbox: [],
  };
}

export const SAMPLE_NAMES = [
  'Ranger Rae',
  'Captain Cass',
  'Dice Dan',
  'Paladin Pat',
  'Wizard Wren',
  'Rogue Robin',
  'Bard Blake',
  'Cleric Casey',
  'Druid Drew',
  'Monk Max',
  'Warlock Wes',
  'Sorcerer Sky',
  'Tinker Tess',
  'Scout Sid',
  'Knight Kai',
  'Alchemist Ash',
  'Brawler Bo',
  'Minis Mel',
  'Painter Pru',
  'Tactician Tom',
  'Healer Hal',
  'Smith Sol',
  'Hunter Hue',
  'Sage Sam',
];

/** Small deterministic hash so demo sign-up counts are stable for a given event. */
export function hash01(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

export function horizonDate(now: Date, days: number): Date {
  return addDays(now, days);
}
