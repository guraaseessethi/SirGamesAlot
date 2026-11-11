import type { Category, Product } from '@/lib/domain/types';
import { STATUS_META } from './status';

export type SortKey = 'name' | 'status' | 'price';
export interface StockQuery {
  q: string;
  category: Category | 'All';
  sort: SortKey;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Every word the shopper typed has to appear somewhere in the item's text. */
export function matchesQuery(product: Product, q: string): boolean {
  const tokens = normalize(q).split(' ').filter(Boolean);
  if (tokens.length === 0) return true;
  const hay = normalize(`${product.name} ${product.description} ${product.category} ${product.shelf}`);
  return tokens.every((t) => hay.includes(t) || (t === 'dnd' && hay.includes('d and d')));
}

export function filterProducts(products: Product[], query: StockQuery): Product[] {
  const list = products.filter(
    (p) => (query.category === 'All' || p.category === query.category) && matchesQuery(p, query.q),
  );
  const byName = (a: Product, b: Product) => a.name.localeCompare(b.name, 'en-CA');
  return list.sort((a, b) => {
    if (query.sort === 'price') {
      // "Ask" items (price 0) go last.
      const pa = a.priceCents || Number.MAX_SAFE_INTEGER;
      const pb = b.priceCents || Number.MAX_SAFE_INTEGER;
      return pa - pb || byName(a, b);
    }
    if (query.sort === 'status') {
      return STATUS_META[a.status].rank - STATUS_META[b.status].rank || byName(a, b);
    }
    return byName(a, b);
  });
}
