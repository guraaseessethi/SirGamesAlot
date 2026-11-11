'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { getInventorySource, getRepository } from '@/lib/data';
import { useRepoData } from '@/lib/data/hooks';
import { CATEGORIES, type Category, type Product, type StockStatus } from '@/lib/domain/types';
import { formatPrice } from '@/lib/money';
import { filterProducts } from '@/lib/stock/search';
import { loadProducts } from '@/lib/stock/catalog';
import { STATUS_META } from '@/lib/stock/status';
import { Badge, PageTitle, Panel, ago } from './AdminUi';
import styles from './Admin.module.css';

type StatusValue = StockStatus | 'auto';

export function StockPage() {
  const toast = useToast();
  const products = useRepoData<Product[] | null>((r) => loadProducts(getInventorySource(), r), null);
  const synced = useRepoData<Date | null>(() => getInventorySource().lastSyncedAt(), null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Category | 'All'>('All');
  const list = useMemo(() => filterProducts(products ?? [], { q, category: cat, sort: 'name' }), [products, q, cat]);

  if (!products) return <p>Loading…</p>;

  async function save(sku: string, patch: { status?: StatusValue; shelf?: string; lowThreshold?: number | null }, name: string) {
    const body: Record<string, unknown> = { sku };
    if (patch.status !== undefined) body.status = patch.status === 'auto' ? undefined : patch.status;
    if (patch.shelf !== undefined) body.shelf = patch.shelf;
    if (patch.lowThreshold !== undefined) body.lowThreshold = patch.lowThreshold === null ? undefined : patch.lowThreshold;
    await getRepository().setOverride(body as never);
    toast(`Saved ${name}.`);
  }

  return (
    <>
      <PageTitle title="Stock">
        Counts come from the POS and cannot be edited here, so there is only one place to update stock. You can override how an item is shown, fix its shelf location, or set its low-stock level.
      </PageTitle>

      <Panel
        id="sync"
        title="Sync status"
        action={<Badge tone="ok">{synced ? `Synced from POS ${ago(synced)}` : 'Not synced yet'}</Badge>}
      >
        <p className={styles.note}>Demo: this simulates the 15-minute sync from the store&apos;s POS. In the full build a failed sync keeps the old time and shows a warning here.</p>
      </Panel>

      <Panel id="items" title={`Items (${list.length})`}>
        <div className={styles.row} style={{ marginBottom: 12 }}>
          <label className="sr-only" htmlFor="admin-stock-q">
            Search items
          </label>
          <input id="admin-stock-q" className={styles.inline} style={{ maxWidth: 280 }} type="search" placeholder="Search items" value={q} onChange={(e) => setQ(e.target.value)} />
          <label className="sr-only" htmlFor="admin-stock-cat">
            Category
          </label>
          <select id="admin-stock-cat" className={styles.inline} style={{ maxWidth: 200 }} value={cat} onChange={(e) => setCat(e.target.value as Category | 'All')}>
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th>POS count</th>
                <th>Shown as</th>
                <th>Shelf location</th>
                <th>Low at or under</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.sku}>
                  <td>
                    {p.name}
                    <small>
                      {p.sku} · {p.category}
                    </small>
                  </td>
                  <td>{formatPrice(p.priceCents)}</td>
                  <td className="num" style={{ textAlign: 'right' }}>
                    {p.count}
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`st-${p.sku}`}>
                      Status for {p.name}
                    </label>
                    <select
                      id={`st-${p.sku}`}
                      className={styles.inline}
                      value={p.statusOverridden ? p.status : 'auto'}
                      onChange={(e) => save(p.sku, { status: e.target.value as StatusValue }, p.name)}
                    >
                      <option value="auto">Auto ({STATUS_META[autoStatus(p)].label})</option>
                      {(Object.keys(STATUS_META) as StockStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                    {p.overridden && <Badge tone="warn">Manual</Badge>}
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`sh-${p.sku}`}>
                      Shelf for {p.name}
                    </label>
                    <input
                      id={`sh-${p.sku}`}
                      className={styles.inline}
                      key={`${p.sku}-${p.shelf}`}
                      defaultValue={p.shelf}
                      onBlur={(e) => e.target.value.trim() !== p.shelf && save(p.sku, { shelf: e.target.value }, p.name)}
                    />
                  </td>
                  <td>
                    <label className="sr-only" htmlFor={`lt-${p.sku}`}>
                      Low-stock threshold for {p.name}
                    </label>
                    <input
                      id={`lt-${p.sku}`}
                      className={styles.inlineNarrow}
                      type="number"
                      min={0}
                      max={999}
                      key={`${p.sku}-${p.lowThreshold}`}
                      defaultValue={p.lowThreshold}
                      onBlur={(e) => {
                        const v = e.target.value === '' ? null : Number(e.target.value);
                        if (v !== p.lowThreshold) save(p.sku, { lowThreshold: v }, p.name);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

/** What the status would be with no manual override. */
function autoStatus(p: Product): StockStatus {
  if (p.count <= 0) return p.orderable ? 'order' : 'out';
  return p.count <= p.lowThreshold ? 'low' : 'in';
}
