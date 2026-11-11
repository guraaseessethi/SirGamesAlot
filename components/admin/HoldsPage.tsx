'use client';

import { useMemo } from 'react';
import { useToast } from '@/components/ui/Toast';
import { getRepository } from '@/lib/data';
import { useRepoData } from '@/lib/data/hooks';
import { ORDER_STAGES, type BackInStockRequest, type Hold, type OrderStage, type SpecialOrder } from '@/lib/domain/types';
import { ABtn, Badge, Empty, PageTitle, Panel, ago, contactOf, when } from './AdminUi';
import styles from './Admin.module.css';

const STAGE_LABEL: Record<OrderStage, string> = {
  requested: 'Requested',
  ordered: 'Ordered',
  arrived: 'Arrived',
  'picked-up': 'Picked up',
};

const HOLD_TONE = { active: 'ok', 'picked-up': 'muted', expired: 'bad', cancelled: 'muted' } as const;

export function HoldsPage() {
  const toast = useToast();
  const holds = useRepoData<Hold[] | null>((r) => r.listHolds(), null);
  const orders = useRepoData<SpecialOrder[] | null>((r) => r.listSpecialOrders(), null);
  const waitlists = useRepoData<BackInStockRequest[] | null>((r) => r.listBackInStock(), null);

  const grouped = useMemo(() => {
    const map = new Map<string, BackInStockRequest[]>();
    for (const w of waitlists ?? []) map.set(w.sku, [...(map.get(w.sku) ?? []), w]);
    return [...map.entries()];
  }, [waitlists]);

  if (!holds || !orders || !waitlists) return <p>Loading…</p>;

  async function notify(items: BackInStockRequest[]) {
    const repo = getRepository();
    for (const w of items) await repo.notifyBackInStock(w.id);
    const withEmail = items.filter((w) => w.email).length;
    toast(
      withEmail > 0
        ? `Would send ${withEmail} ${withEmail === 1 ? 'email' : 'emails'} in the full build. Logged to the demo outbox.`
        : 'Marked as notified. Phone-only customers would get a call from the counter.',
    );
  }

  return (
    <>
      <PageTitle title="Holds & orders">Website holds expire on their own. Special orders move through four steps. Anything that would send an email only logs it to the demo outbox.</PageTitle>

      <Panel id="holds" title={`Website holds (${holds.filter((h) => h.status === 'active').length} active)`}>
        {holds.length === 0 ? (
          <Empty>No holds yet. Try &ldquo;Hold it&rdquo; on the public stock checker.</Empty>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Customer</th>
                  <th>Placed</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {holds.map((h) => (
                  <tr key={h.id} data-testid="hold-row">
                    <td>{h.productName}</td>
                    <td>
                      {h.name}
                      <small>{contactOf(h)}</small>
                    </td>
                    <td>{ago(h.createdAt)}</td>
                    <td>{when(h.expiresAt)}</td>
                    <td>
                      <Badge tone={HOLD_TONE[h.status]}>{h.status === 'picked-up' ? 'Picked up' : h.status[0]!.toUpperCase() + h.status.slice(1)}</Badge>
                    </td>
                    <td>
                      {h.status === 'active' && (
                        <div className={styles.actions}>
                          <ABtn onClick={() => getRepository().setHoldStatus(h.id, 'picked-up')} aria-label={`Mark ${h.productName} picked up`}>
                            Picked up
                          </ABtn>
                          <ABtn kind="danger" onClick={() => getRepository().setHoldStatus(h.id, 'cancelled')} aria-label={`Cancel hold on ${h.productName}`}>
                            Cancel
                          </ABtn>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div id="orders" />
      <Panel id="orders-panel" title="Special orders pipeline">
        <div className={styles.pipeline}>
          {ORDER_STAGES.map((stage, i) => {
            const items = orders.filter((o) => o.stage === stage);
            const next = ORDER_STAGES[i + 1];
            return (
              <div key={stage} className={styles.col} role="group" aria-label={`${STAGE_LABEL[stage]}, ${items.length} orders`}>
                <h3>
                  {STAGE_LABEL[stage]} ({items.length})
                </h3>
                {items.map((o) => (
                  <div key={o.id} className={styles.card} data-testid="order-card">
                    <b>{o.productName}</b>
                    <span>
                      {o.name} · {contactOf(o)}
                    </span>
                    {o.note && <span className={styles.note}>“{o.note}”</span>}
                    <span className={styles.note}>{ago(o.createdAt)}</span>
                    {next && (
                      <ABtn onClick={async () => {
                        await getRepository().setOrderStage(o.id, next);
                        if (next === 'arrived' && o.email) toast('Would send an "it\'s in" email in the full build. Logged to the demo outbox.');
                      }}
                        aria-label={`Move ${o.productName} to ${STAGE_LABEL[next]}`}
                      >
                        Move to {STAGE_LABEL[next]} →
                      </ABtn>
                    )}
                  </div>
                ))}
                {items.length === 0 && <span className={styles.note}>None</span>}
              </div>
            );
          })}
        </div>
      </Panel>

      <div id="waitlists" />
      <Panel id="waitlist-panel" title="“Back in stock” waitlists">
        {grouped.length === 0 ? (
          <Empty>Nobody is waiting on a restock.</Empty>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {grouped.map(([sku, reqs]) => {
              const pending = reqs.filter((r) => !r.notifiedAt);
              return (
                <div key={sku}>
                  <div className={styles.row} style={{ justifyContent: 'space-between' }}>
                    <b>
                      {reqs[0]!.productName} <Badge tone={pending.length ? 'warn' : 'ok'}>{pending.length} waiting</Badge>
                    </b>
                    <ABtn kind="primary" disabled={pending.length === 0} onClick={() => notify(pending)}>
                      Notify all ({pending.length})
                    </ABtn>
                  </div>
                  <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'grid', gap: 6 }}>
                    {reqs.map((r) => (
                      <li key={r.id} className={styles.row} style={{ justifyContent: 'space-between', borderTop: '1px solid var(--soft)', paddingTop: 6 }}>
                        <span>
                          {r.name} · {contactOf(r)} <span className={styles.note}>requested {ago(r.createdAt)}</span>
                        </span>
                        {r.notifiedAt ? (
                          <Badge tone="ok">Notified {ago(r.notifiedAt)}</Badge>
                        ) : (
                          <ABtn onClick={() => notify([r])} aria-label={`Notify ${r.name} about ${r.productName}`}>
                            Notify
                          </ABtn>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        <p className={styles.note} style={{ marginTop: 12 }}>
          Notify says &ldquo;Would send in the full build&rdquo; and logs the message to the demo outbox.
        </p>
      </Panel>
    </>
  );
}
