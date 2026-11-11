import type { InventoryItem, Product, ProductOverride, StockStatus } from '@/lib/domain/types';

export const DEFAULT_LOW_THRESHOLD = 2;

export interface StatusMeta {
  label: string;
  /** Used to sort "in stock first". */
  rank: number;
  /** What the public can do about it. */
  action: 'hold' | 'order' | 'notify';
}

export const STATUS_META: Record<StockStatus, StatusMeta> = {
  in: { label: 'In stock', rank: 0, action: 'hold' },
  low: { label: 'Only a few left', rank: 1, action: 'hold' },
  order: { label: 'Order in · about 1 week', rank: 2, action: 'order' },
  out: { label: 'Out of stock', rank: 3, action: 'notify' },
};

/**
 * Status from a POS count:
 *  - count above the low threshold → in
 *  - count between 1 and the threshold → low
 *  - count 0 → "order in" when the store can order it, otherwise out.
 */
export function statusFromCount(
  count: number,
  orderable: boolean,
  lowThreshold: number = DEFAULT_LOW_THRESHOLD,
): StockStatus {
  if (count <= 0) return orderable ? 'order' : 'out';
  if (count <= lowThreshold) return 'low';
  return 'in';
}

/** Merge a POS row with staff overrides. A manual status always wins. */
export function toProduct(item: InventoryItem, override?: ProductOverride): Product {
  const lowThreshold = override?.lowThreshold ?? DEFAULT_LOW_THRESHOLD;
  const computed = statusFromCount(item.count, item.orderable, lowThreshold);
  const status = override?.status ?? computed;
  return {
    ...item,
    shelf: override?.shelf?.trim() ? override.shelf.trim() : item.shelf,
    status,
    lowThreshold,
    statusOverridden: override?.status !== undefined,
    overridden:
      override?.status !== undefined ||
      (override?.shelf !== undefined &&
        override.shelf.trim() !== '' &&
        override.shelf.trim() !== item.shelf) ||
      override?.lowThreshold !== undefined,
  };
}

export function mergeProducts(items: InventoryItem[], overrides: ProductOverride[]): Product[] {
  const bySku = new Map(overrides.map((o) => [o.sku, o]));
  return items.map((item) => toProduct(item, bySku.get(item.sku)));
}

export function canHold(status: StockStatus): boolean {
  return STATUS_META[status].action === 'hold';
}

export function summarize(products: Product[]) {
  const counts: Record<StockStatus, number> = { in: 0, low: 0, order: 0, out: 0 };
  for (const p of products) counts[p.status] += 1;
  return counts;
}
