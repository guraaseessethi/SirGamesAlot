import type { DataRepository } from '@/lib/data/repository';
import type { InventorySource } from '@/lib/inventory-source/source';
import type { Product } from '@/lib/domain/types';
import { mergeProducts } from './status';

/** Stock comes from the InventorySource; staff overrides come from the DataRepository. */
export async function loadProducts(source: InventorySource, repo: DataRepository): Promise<Product[]> {
  const [items, overrides] = await Promise.all([source.listItems(), repo.listOverrides()]);
  return mergeProducts(items, overrides);
}
