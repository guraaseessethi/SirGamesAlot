import type { DataRepository } from './repository';
import { MockRepository, STATE_KEY } from './mock/mock-repository';
import { MockInventorySource } from '@/lib/inventory-source/mock';
import type { InventorySource } from '@/lib/inventory-source/source';
import { RepositoryError } from './repository';

type Source = 'mock' | 'supabase';

function dataSource(): Source {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === 'supabase' ? 'supabase' : 'mock';
}

let browserRepo: MockRepository | null = null;
let browserSource: MockInventorySource | null = null;

function assertSupported(): void {
  if (dataSource() === 'supabase') {
    throw new RepositoryError(
      'not-implemented',
      'NEXT_PUBLIC_DATA_SOURCE=supabase is reserved for Phase 2. See docs/MIGRATION.md.',
    );
  }
}

/**
 * Browser: one shared MockRepository backed by localStorage, so the public site and the
 * admin demo see each other's changes. Server: a fresh, in-memory, seeded copy per call.
 */
export function getRepository(): DataRepository {
  assertSupported();
  if (typeof window === 'undefined') return new MockRepository();
  if (!browserRepo) {
    browserRepo = new MockRepository({ storage: window.localStorage });
    window.addEventListener('storage', (e) => {
      if (e.key === STATE_KEY || e.key === null) browserRepo?.reloadFromStorage();
    });
  }
  return browserRepo;
}

export function getInventorySource(): InventorySource {
  assertSupported();
  if (typeof window === 'undefined') return new MockInventorySource();
  if (!browserSource) browserSource = new MockInventorySource(window.localStorage);
  return browserSource;
}
