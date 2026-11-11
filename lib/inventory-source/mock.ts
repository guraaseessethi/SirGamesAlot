import type { InventoryItem } from '@/lib/domain/types';
import type { InventorySource } from './source';

/** Sample stock only. Names are plain product names; there are no publisher logos or box art. */
export const SAMPLE_ITEMS: InventoryItem[] = [
  {
    sku: 'WH-ARMAGEDDON',
    name: 'Warhammer 40,000: Armageddon',
    description: 'Launch box, two armies and rules',
    category: 'Warhammer',
    priceCents: 0,
    count: 1,
    orderable: true,
    shelf: 'Front display',
  },
  {
    sku: 'WH-CODEX-SM',
    name: 'Codex: Space Marines',
    description: 'Warhammer 40,000 rules book',
    category: 'Warhammer',
    priceCents: 7500,
    count: 6,
    orderable: true,
    shelf: 'Warhammer wall · Codexes',
  },
  {
    sku: 'WH-CP-SM',
    name: 'Combat Patrol: Space Marines',
    description: 'Starter army',
    category: 'Warhammer',
    priceCents: 17000,
    count: 4,
    orderable: true,
    shelf: 'Warhammer wall · Armies',
  },
  {
    sku: 'WH-KT-START',
    name: 'Kill Team starter set',
    description: 'Two squads, terrain and rules',
    category: 'Warhammer',
    priceCents: 10000,
    count: 0,
    orderable: true,
    shelf: 'Warhammer wall',
  },
  {
    sku: 'PT-LEADBELCHER',
    name: 'Leadbelcher',
    description: 'Citadel Base paint, 12 ml',
    category: 'Paints',
    priceCents: 725,
    count: 24,
    orderable: true,
    shelf: 'Paint wall · Base',
  },
  {
    sku: 'PT-ABADDON',
    name: 'Abaddon Black',
    description: 'Citadel Base paint, 12 ml',
    category: 'Paints',
    priceCents: 725,
    count: 18,
    orderable: true,
    shelf: 'Paint wall · Base',
  },
  {
    sku: 'PT-MACRAGGE',
    name: 'Macragge Blue',
    description: 'Citadel Base paint, 12 ml',
    category: 'Paints',
    priceCents: 725,
    count: 0,
    orderable: false,
    shelf: 'Paint wall · Base',
  },
  {
    sku: 'PT-NULN',
    name: 'Nuln Oil',
    description: 'Citadel Shade, 18 ml',
    category: 'Paints',
    priceCents: 1075,
    count: 2,
    orderable: true,
    shelf: 'Paint wall · Shade',
  },
  {
    sku: 'SC-TERRAN',
    name: 'StarCraft Terran starter',
    description: 'Tabletop miniatures game',
    category: 'StarCraft',
    priceCents: 0,
    count: 5,
    orderable: true,
    shelf: 'Minis aisle · just restocked',
  },
  {
    sku: 'SC-ZERG',
    name: 'StarCraft Zerg starter',
    description: 'Tabletop miniatures game',
    category: 'StarCraft',
    priceCents: 0,
    count: 4,
    orderable: true,
    shelf: 'Minis aisle · just restocked',
  },
  {
    sku: 'DD-PHB',
    name: "D&D Player's Handbook",
    description: '2024 core rulebook',
    category: 'D&D',
    priceCents: 6999,
    count: 8,
    orderable: true,
    shelf: 'RPG shelf',
  },
  {
    sku: 'DD-EBERRON',
    name: 'Eberron setting book',
    description: 'D&D campaign setting',
    category: 'D&D',
    priceCents: 0,
    count: 3,
    orderable: true,
    shelf: 'RPG shelf · new arrivals',
  },
  {
    sku: 'DD-DICE7',
    name: 'Polyhedral dice set',
    description: '7 dice, d4 to d20',
    category: 'D&D',
    priceCents: 1299,
    count: 20,
    orderable: true,
    shelf: 'Dice bins by the till',
  },
  {
    sku: 'CG-RIFT-BOOSTER',
    name: 'Riftbound: Origins booster',
    description: 'League of Legends TCG',
    category: 'Cards',
    priceCents: 0,
    count: 2,
    orderable: true,
    shelf: 'Front counter',
  },
  {
    sku: 'CG-SLEEVES-100',
    name: 'Matte card sleeves, 100 ct',
    description: 'Standard size',
    category: 'Cards',
    priceCents: 1499,
    count: 12,
    orderable: true,
    shelf: 'Card wall',
  },
  {
    sku: 'BG-CATAN',
    name: 'Catan',
    description: 'Base game, 3 to 4 players',
    category: 'Board games',
    priceCents: 6499,
    count: 5,
    orderable: true,
    shelf: 'Board game wall · Strategy',
  },
  {
    sku: 'BG-WINGSPAN',
    name: 'Wingspan',
    description: 'Engine-builder, 1 to 5 players',
    category: 'Board games',
    priceCents: 7999,
    count: 2,
    orderable: true,
    shelf: 'Board game wall · Strategy',
  },
  {
    sku: 'BG-CODENAMES',
    name: 'Codenames',
    description: 'Party game, 2 to 8+ players',
    category: 'Board games',
    priceCents: 2999,
    count: 0,
    orderable: false,
    shelf: 'Board game wall · Party',
  },
];

export const SYNC_STORAGE_KEY = 'sgal-demo-synced-at';
const DEMO_SYNC_AGE_MINUTES = 40;

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Phase 1 stand-in for the POS. The "last synced" time is recorded once per demo session
 * (about 40 minutes before the first visit) and then stays put, so the admin can show
 * "Synced from POS 40 min ago" without the timestamp moving on every page load.
 */
export class MockInventorySource implements InventorySource {
  constructor(
    private readonly storage: StorageLike | null = null,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async listItems(): Promise<InventoryItem[]> {
    return SAMPLE_ITEMS.map((i) => ({ ...i }));
  }

  async getCounts(): Promise<Record<string, number>> {
    return Object.fromEntries(SAMPLE_ITEMS.map((i) => [i.sku, i.count]));
  }

  async lastSyncedAt(): Promise<Date | null> {
    if (!this.storage) return null;
    try {
      const stored = this.storage.getItem(SYNC_STORAGE_KEY);
      if (stored) {
        const d = new Date(stored);
        if (!Number.isNaN(d.getTime())) return d;
      }
      const synced = new Date(this.now().getTime() - DEMO_SYNC_AGE_MINUTES * 60_000);
      this.storage.setItem(SYNC_STORAGE_KEY, synced.toISOString());
      return synced;
    } catch {
      return null;
    }
  }
}
