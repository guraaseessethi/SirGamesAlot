import { describe, expect, it } from 'vitest';
import { SAMPLE_ITEMS } from '@/lib/inventory-source/mock';
import { filterProducts } from './search';
import { canHold, mergeProducts, statusFromCount, summarize, toProduct } from './status';

describe('statusFromCount', () => {
  it('is in stock above the low threshold', () => {
    expect(statusFromCount(10, true)).toBe('in');
    expect(statusFromCount(3, true, 2)).toBe('in');
  });
  it('is low at or under the threshold but above zero', () => {
    expect(statusFromCount(2, true, 2)).toBe('low');
    expect(statusFromCount(1, false, 2)).toBe('low');
    expect(statusFromCount(5, true, 5)).toBe('low');
  });
  it('is "order in" at zero when the store can order it', () => {
    expect(statusFromCount(0, true)).toBe('order');
  });
  it('is out at zero when it cannot be ordered', () => {
    expect(statusFromCount(0, false)).toBe('out');
  });
  it('treats negative counts like zero', () => {
    expect(statusFromCount(-1, true)).toBe('order');
  });
});

describe('overrides', () => {
  const item = SAMPLE_ITEMS.find((i) => i.sku === 'PT-LEADBELCHER')!;
  it('a manual status beats the POS count', () => {
    const p = toProduct(item, { sku: item.sku, status: 'out' });
    expect(p.status).toBe('out');
    expect(p.overridden).toBe(true);
  });
  it('a per-item threshold changes the computed status', () => {
    expect(toProduct(item).status).toBe('in');
    expect(toProduct(item, { sku: item.sku, lowThreshold: 30 }).status).toBe('low');
  });
  it('a shelf override replaces the POS shelf', () => {
    const p = toProduct(item, { sku: item.sku, shelf: 'Front display' });
    expect(p.shelf).toBe('Front display');
    expect(p.overridden).toBe(true);
  });
  it('is not flagged as overridden when nothing was changed', () => {
    expect(toProduct(item).overridden).toBe(false);
    expect(toProduct(item, { sku: item.sku, shelf: item.shelf }).overridden).toBe(false);
  });
  it('only in-stock and low items can be held', () => {
    expect(canHold('in')).toBe(true);
    expect(canHold('low')).toBe(true);
    expect(canHold('order')).toBe(false);
    expect(canHold('out')).toBe(false);
  });
  it('summarizes counts per status', () => {
    const s = summarize(mergeProducts(SAMPLE_ITEMS, []));
    expect(s.in + s.low + s.order + s.out).toBe(SAMPLE_ITEMS.length);
    expect(s.order).toBe(1);
    expect(s.out).toBe(2);
  });
});

describe('filterProducts', () => {
  const all = mergeProducts(SAMPLE_ITEMS, []);
  const base = { q: '', category: 'All', sort: 'name' } as const;

  it('finds by name, ignoring case', () => {
    expect(filterProducts(all, { ...base, q: 'leadbelcher' }).map((p) => p.sku)).toEqual(['PT-LEADBELCHER']);
  });
  it('needs every word to match', () => {
    expect(filterProducts(all, { ...base, q: 'citadel base' }).length).toBe(3);
    expect(filterProducts(all, { ...base, q: 'citadel nonsense' })).toHaveLength(0);
  });
  it('matches the category and shelf text', () => {
    expect(filterProducts(all, { ...base, q: 'paint wall' }).length).toBe(4);
  });
  it('finds D&D when someone types dnd', () => {
    expect(filterProducts(all, { ...base, q: 'dnd' }).length).toBeGreaterThanOrEqual(3);
  });
  it('filters by category', () => {
    expect(filterProducts(all, { ...base, category: 'Board games' })).toHaveLength(3);
  });
  it('sorts A to Z', () => {
    const names = filterProducts(all, base).map((p) => p.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en-CA')));
  });
  it('sorts in-stock first', () => {
    const list = filterProducts(all, { ...base, sort: 'status' });
    expect(list[0]!.status).toBe('in');
    expect(list.at(-1)!.status).toBe('out');
  });
  it('sorts by price with "Ask" items last', () => {
    const list = filterProducts(all, { ...base, sort: 'price' });
    expect(list[0]!.priceCents).toBe(725);
    expect(list.at(-1)!.priceCents).toBe(0);
  });
});
