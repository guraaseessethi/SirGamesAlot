'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { useToast } from '@/components/ui/Toast';
import { getRepository } from '@/lib/data';
import { useNow, useRepoData } from '@/lib/data/hooks';
import type {
  BackInStockRequest,
  EventSignup,
  Hold,
  Product,
  SpecialOrder,
  StoreEvent,
} from '@/lib/domain/types';
import { seatSummary } from '@/lib/events/seats';
import { STORE_TZ, formatTime } from '@/lib/hours/hours';
import { loadProducts } from '@/lib/stock/catalog';
import { STATUS_META } from '@/lib/stock/status';
import { ABtn, Badge, Empty, PageTitle, Panel, Stat, ago, contactOf, when } from './AdminUi';
import styles from './Admin.module.css';

export function TodayPage() {
  const toast = useToast();
  const now = useNow(new Date().toISOString(), 30_000);
  const holds = useRepoData<Hold[] | null>((r) => r.listHolds(), null);
  const orders = useRepoData<SpecialOrder[] | null>((r) => r.listSpecialOrders(), null);
  const waitlists = useRepoData<BackInStockRequest[] | null>((r) => r.listBackInStock(), null);
  const events = useRepoData<StoreEvent[] | null>((r) => r.listEvents(), null);
  const signups = useRepoData<EventSignup[] | null>((r) => r.listSignups(), null);
  const products = useRepoData<Product[] | null>((r, source) => loadProducts(source, r), null);

  const today = formatInTimeZone(now, STORE_TZ, 'yyyy-MM-dd');
  const toPull = useMemo(
    () =>
      (holds ?? [])
        .filter((h) => h.status === 'active')
        .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt)),
    [holds],
  );
  const toCall = useMemo(() => (orders ?? []).filter((o) => o.stage === 'arrived'), [orders]);
  const toOrder = useMemo(() => (orders ?? []).filter((o) => o.stage === 'requested'), [orders]);
  const todaysEvents = useMemo(
    () => (events ?? []).filter((e) => e.date === today),
    [events, today],
  );
  const lowStock = useMemo(() => (products ?? []).filter((p) => p.status !== 'in'), [products]);
  const waiting = useMemo(() => (waitlists ?? []).filter((w) => !w.notifiedAt), [waitlists]);

  if (!holds || !orders || !events || !signups || !products || !waitlists) return <p>Loading…</p>;

  return (
    <>
      <PageTitle title="Today">
        What needs doing at the counter right now. Everything here is sample data in this demo.
      </PageTitle>

      <div className={styles.stats}>
        <Stat
          label="Holds to pull"
          value={toPull.length}
          tone={toPull.length ? 'warn' : undefined}
        />
        <Stat
          label="Orders to call about"
          value={toCall.length}
          tone={toCall.length ? 'info' : undefined}
        />
        <Stat label="Orders to place" value={toOrder.length} />
        <Stat label="Events today" value={todaysEvents.length} />
        <Stat label="Low or out of stock" value={lowStock.length} />
      </div>

      <div className={styles.grid2}>
        <Panel id="pull" title="Holds to pull" action={<Link href="/admin/holds">All holds</Link>}>
          {toPull.length === 0 ? (
            <Empty>No active holds.</Empty>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Customer</th>
                    <th>Expires</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {toPull.map((h) => (
                    <tr key={h.id}>
                      <td>{h.productName}</td>
                      <td>
                        {h.name}
                        <small>{contactOf(h)}</small>
                      </td>
                      <td>
                        {ago(h.expiresAt).replace('in ', '')} left
                        <small>{when(h.expiresAt)}</small>
                      </td>
                      <td>
                        <ABtn
                          onClick={async () => {
                            await getRepository().setHoldStatus(h.id, 'picked-up');
                            toast(`${h.productName} marked as picked up.`);
                          }}
                          aria-label={`Mark ${h.productName} picked up by ${h.name}`}
                        >
                          Picked up
                        </ABtn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          id="call"
          title="Special orders to call"
          action={<Link href="/admin/holds#orders">Pipeline</Link>}
        >
          {toCall.length === 0 && toOrder.length === 0 ? (
            <Empty>Nothing waiting.</Empty>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {toCall.map((o) => (
                <li key={o.id}>
                  <Badge tone="info">Arrived: call</Badge> <b>{o.productName}</b>
                  <br />
                  <span className={styles.note}>
                    {o.name} · {contactOf(o)}
                  </span>
                </li>
              ))}
              {toOrder.map((o) => (
                <li key={o.id}>
                  <Badge tone="warn">To order</Badge> <b>{o.productName}</b>
                  <br />
                  <span className={styles.note}>
                    {o.name} · requested {ago(o.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          id="events-today"
          title="Today's events"
          action={<Link href="/admin/events">Manage events</Link>}
        >
          {todaysEvents.length === 0 ? (
            <Empty>No events today.</Empty>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {todaysEvents.map((e) => {
                const s = seatSummary(
                  e.capacity,
                  signups.filter((x) => x.eventId === e.id),
                );
                return (
                  <li key={e.id}>
                    <b>{e.title}</b> · {formatTime(e.startTime)} – {formatTime(e.endTime)}
                    <br />
                    <span className={styles.note}>
                      {s.hasSeats
                        ? `${s.taken} of ${s.capacity} seats taken · ${s.waitlist} on waitlist`
                        : 'Open to everyone'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel id="low" title="Low stock" action={<Link href="/admin/stock">Stock</Link>}>
          {lowStock.length === 0 ? (
            <Empty>Everything is in stock.</Empty>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Status</th>
                    <th>On hand</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.sku}>
                      <td>{p.name}</td>
                      <td>
                        <Badge
                          tone={p.status === 'low' ? 'warn' : p.status === 'order' ? 'info' : 'bad'}
                        >
                          {STATUS_META[p.status].label}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>{p.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {waiting.length > 0 && (
        <Panel
          id="waiting"
          title="People waiting for restocks"
          action={<Link href="/admin/holds#waitlists">Notify</Link>}
        >
          <p>
            {waiting.length} {waiting.length === 1 ? 'person is' : 'people are'} waiting to hear
            when sold-out items are back.
          </p>
        </Panel>
      )}
    </>
  );
}
