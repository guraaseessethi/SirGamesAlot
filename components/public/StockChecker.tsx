'use client';

import dynamic from 'next/dynamic';
import { useId, useMemo, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useIdlePrefetch, useRepoData } from '@/lib/data/hooks';
import { CATEGORIES, type Category, type Product, type Settings } from '@/lib/domain/types';
import { STORE_TZ } from '@/lib/hours/hours';
import { formatPrice } from '@/lib/money';
import { filterProducts, type SortKey } from '@/lib/stock/search';
import { STATUS_META, summarize } from '@/lib/stock/status';
import { loadProducts } from '@/lib/stock/catalog';
import { Button } from '@/components/ui/Button';
import { CategoryIcon, categoryColor } from './CategoryIcon';
import { requestDoneLabel, requestIdleLabel, type RequestMode } from './requestLabels';
import styles from './StockChecker.module.css';

// Loaded on demand: the form, validation and repository are not needed until someone taps a button.
const loadDialog = () => import('./RequestDialog');
const RequestDialog = dynamic(() => loadDialog().then((m) => m.RequestDialog), { ssr: false });

const STATUS_CLASS = {
  in: styles.sIn,
  low: styles.sLow,
  order: styles.sOrder,
  out: styles.sOut,
} as const;

function syncedLabel(synced: Date | null, now: Date): string {
  if (!synced) return '';
  const day = (d: Date) => formatInTimeZone(d, STORE_TZ, 'yyyy-MM-dd');
  const time = formatInTimeZone(synced, STORE_TZ, 'h:mm a').toLowerCase();
  if (day(synced) === day(now)) return `Counts updated today at ${time}`;
  return `Counts updated ${formatInTimeZone(synced, STORE_TZ, 'MMM d')} at ${time}`;
}

export function StockChecker({
  initialProducts,
  initialSettings,
  idPrefix = 'stock',
  initialCategory = 'All',
  previewCount,
}: {
  initialProducts: Product[];
  initialSettings: Settings;
  idPrefix?: string;
  initialCategory?: Category | 'All';
  /** On the home page, show this many items until the shopper searches, filters or taps "show all". */
  previewCount?: number;
}) {
  const products = useRepoData((repo, source) => loadProducts(source, repo), initialProducts);
  const settings = useRepoData((repo) => repo.getSettings(), initialSettings);
  const synced = useRepoData((_repo, source) => source.lastSyncedAt(), null as Date | null);

  const [q, setQ] = useState('');
  const [category, setCategory] = useState<Category | 'All'>(initialCategory);
  const [sort, setSort] = useState<SortKey>('name');
  const [showAll, setShowAll] = useState(false);
  const [dialog, setDialog] = useState<{ mode: RequestMode; product: Product } | null>(null);
  const [done, setDone] = useState<Record<string, RequestMode>>({});
  const uid = useId().replace(/:/g, '');

  useIdlePrefetch(loadDialog);
  const all = useMemo(
    () => filterProducts(products, { q, category, sort }),
    [products, q, category, sort],
  );
  const trimmed =
    previewCount !== undefined &&
    !showAll &&
    q === '' &&
    category === 'All' &&
    all.length > previewCount;
  const list = trimmed ? all.slice(0, previewCount) : all;
  const counts = useMemo(() => summarize(products), [products]);

  return (
    <div>
      <div className={styles.top}>
        <div className={styles.searchWrap}>
          <label htmlFor={`${idPrefix}-q`} className="sr-only">
            Search stock
          </label>
          <input
            id={`${idPrefix}-q`}
            className={styles.search}
            type="search"
            placeholder="Try: Leadbelcher, Armageddon, Riftbound, Eberron…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-sort`} className="sr-only">
            Sort by
          </label>
          <select
            id={`${idPrefix}-sort`}
            className={styles.sel}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="name">A to Z</option>
            <option value="status">In stock first</option>
            <option value="price">Price, low to high</option>
          </select>
        </div>
      </div>

      <div className={styles.chips} role="group" aria-label="Category">
        {(['All', ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className={styles.meta}>
        <span role="status" aria-live="polite">
          {all.length === products.length
            ? `${counts.in} in stock · ${counts.low} low · ${counts.order + counts.out} to order`
            : `Showing ${all.length} of ${products.length} items`}
        </span>
        <span className={styles.synced}>{syncedLabel(synced, new Date())}</span>
      </div>

      {list.length === 0 ? (
        <div className={styles.empty}>
          Nothing matches that. Call 705-719-1291 and we&apos;ll check the back room.
        </div>
      ) : (
        <ul className={styles.items}>
          {list.map((p) => {
            const meta = STATUS_META[p.status];
            const doneMode = done[p.sku];
            return (
              <li key={p.sku} className={styles.item}>
                <div className={styles.ico} style={{ background: categoryColor(p.category) }}>
                  <CategoryIcon category={p.category} />
                </div>
                <div>
                  <h3 className={styles.name}>{p.name}</h3>
                  <div className={styles.ln}>{p.description}</div>
                </div>
                <div className={styles.row}>
                  <span className={styles.price}>{formatPrice(p.priceCents)}</span>
                  <span className={`${styles.pill} ${STATUS_CLASS[p.status]}`}>{meta.label}</span>
                  <Button
                    size="sm"
                    variant={doneMode ? 'done' : 'white'}
                    onClick={() => setDialog({ mode: meta.action, product: p })}
                    aria-label={`${doneMode ? requestDoneLabel(doneMode, settings.holdHours) : requestIdleLabel(meta.action)}: ${p.name}`}
                    aria-describedby={`${uid}-${p.sku}`}
                  >
                    {doneMode
                      ? requestDoneLabel(doneMode, settings.holdHours)
                      : requestIdleLabel(meta.action)}
                  </Button>
                </div>
                <div className={styles.where} id={`${uid}-${p.sku}`}>
                  <span aria-hidden="true">📍 </span>
                  <span className="sr-only">Shelf: </span>
                  {p.shelf}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {trimmed && (
        <p className={styles.more}>
          <Button variant="blue" onClick={() => setShowAll(true)}>
            Show all {all.length} items
          </Button>
        </p>
      )}
      <p className={styles.note}>
        <span className="sample">
          Demo shows sample stock and prices. The live version syncs with the store&apos;s real
          counts.
        </span>
      </p>
      <p className={styles.fine}>
        Prices are before HST (13%). Holds are kept for {settings.holdHours} hours. No online
        payment; you pay at the counter.
      </p>

      {dialog && (
        <RequestDialog
          mode={dialog.mode}
          product={dialog.product}
          onClose={() => setDialog(null)}
          onDone={(mode, product) => setDone((d) => ({ ...d, [product.sku]: mode }))}
        />
      )}
    </div>
  );
}
