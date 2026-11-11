'use client';

import { useRepoData } from '@/lib/data/hooks';
import type { OutboxMessage } from '@/lib/domain/types';
import { Badge, Empty, PageTitle, Panel, when } from './AdminUi';
import styles from './Admin.module.css';

export function OutboxPage() {
  const outbox = useRepoData<OutboxMessage[] | null>((r) => r.listOutbox(), null);
  if (!outbox) return <p>Loading…</p>;
  return (
    <>
      <PageTitle title="Demo outbox">Every email the full build would send. Nothing is actually sent in this demo.</PageTitle>
      <Panel id="outbox" title={`Messages (${outbox.length})`}>
        {outbox.length === 0 ? (
          <Empty>Nothing yet. Place a hold with an email address, save an event seat, or notify someone.</Empty>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {outbox.map((m) => (
                  <tr key={m.id}>
                    <td>{when(m.createdAt)}</td>
                    <td>{m.to}</td>
                    <td>
                      {m.subject}
                      <small>{m.body}</small>
                    </td>
                    <td>
                      <Badge tone="info">Would send in the full build</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
