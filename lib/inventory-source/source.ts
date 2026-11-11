import type { InventoryItem } from '@/lib/domain/types';

/**
 * Where stock counts come from. The POS is the single source of truth for counts; the website
 * only reads them. Staff overrides (status, shelf, low threshold) live in DataRepository.
 *
 * Phase 2 swaps MockInventorySource for an adapter (Square, Lightspeed, Shopify POS, or CSV).
 * See ./README.md.
 */
export interface InventorySource {
  listItems(): Promise<InventoryItem[]>;
  /** sku → units on hand. */
  getCounts(): Promise<Record<string, number>>;
  /** When the counts were last pulled from the real system. null when never. */
  lastSyncedAt(): Promise<Date | null>;
}
