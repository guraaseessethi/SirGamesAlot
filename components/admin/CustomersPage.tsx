'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { useRepoData } from '@/lib/data/hooks';
import { INTERESTS, type Customer, type Interest } from '@/lib/domain/types';
import { downloadCsv, toCsv } from '@/lib/csv';
import { ABtn, Badge, Empty, PageTitle, Panel, when } from './AdminUi';
import { useRole } from './role';
import styles from './Admin.module.css';

export function CustomersPage() {
  const toast = useToast();
  const { isOwner } = useRole();
  const customers = useRepoData<Customer[] | null>((r) => r.listCustomers(), null);
  const [interest, setInterest] = useState<Interest | 'All'>('All');
  const [consent, setConsent] = useState<'all' | 'yes' | 'no'>('all');
  const [q, setQ] = useState('');

  const list = useMemo(
    () =>
      (customers ?? []).filter(
        (c) =>
          (interest === 'All' || c.interests.includes(interest)) &&
          (consent === 'all' || (consent === 'yes') === c.marketingConsent) &&
          `${c.name} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [customers, interest, consent, q],
  );

  if (!customers) return <p>Loading…</p>;

  function exportCsv() {
    downloadCsv(
      'customers.csv',
      toCsv(
        [
          'Name',
          'Email',
          'Phone',
          'Interests',
          'Marketing consent',
          'Consent date (UTC)',
          'Consent source',
        ],
        list.map((c) => [
          c.name,
          c.email,
          c.phone,
          c.interests.join('; '),
          c.marketingConsent ? 'yes' : 'no',
          c.consentAt,
          c.consentSource,
        ]),
      ),
    );
    toast(`Exported ${list.length} customers.`);
  }

  return (
    <>
      <PageTitle title="Customers">
        People who held an item, ordered something or saved an event seat. Hold, order and event
        confirmations are transactional. Only people who ticked the news box can get newsletters or
        &ldquo;new stock&rdquo; emails (CASL).
      </PageTitle>
      <Panel
        id="customers"
        title={`People (${list.length})`}
        action={
          <ABtn onClick={exportCsv} disabled={!isOwner} title={isOwner ? undefined : 'Owner only'}>
            Export CSV{isOwner ? '' : ' (owner only)'}
          </ABtn>
        }
      >
        <div className={styles.row} style={{ marginBottom: 12 }}>
          <label className="sr-only" htmlFor="cust-q">
            Search customers
          </label>
          <input
            id="cust-q"
            className={styles.inline}
            style={{ maxWidth: 240 }}
            type="search"
            placeholder="Search name, email or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <label className="sr-only" htmlFor="cust-int">
            Interest
          </label>
          <select
            id="cust-int"
            className={styles.inline}
            style={{ maxWidth: 180 }}
            value={interest}
            onChange={(e) => setInterest(e.target.value as Interest | 'All')}
          >
            <option value="All">All interests</option>
            {INTERESTS.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="cust-consent">
            Marketing consent
          </label>
          <select
            id="cust-consent"
            className={styles.inline}
            style={{ maxWidth: 220 }}
            value={consent}
            onChange={(e) => setConsent(e.target.value as 'all' | 'yes' | 'no')}
          >
            <option value="all">Any consent status</option>
            <option value="yes">Opted in to news</option>
            <option value="no">Not opted in</option>
          </select>
        </div>
        {list.length === 0 ? (
          <Empty>No customers match.</Empty>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Interests</th>
                  <th>News emails (CASL)</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} data-testid="customer-row">
                    <td>{c.name}</td>
                    <td>
                      {c.email ?? '—'}
                      <small>{c.phone ?? ''}</small>
                    </td>
                    <td>{c.interests.length ? c.interests.join(', ') : '—'}</td>
                    <td>
                      {c.marketingConsent ? (
                        <Badge tone="ok">Opted in</Badge>
                      ) : (
                        <Badge tone="muted">Not opted in</Badge>
                      )}
                      <small>
                        {c.marketingConsent && c.consentAt
                          ? `${when(c.consentAt)} · ${c.consentSource}`
                          : 'Transactional emails only'}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isOwner && (
          <p className={styles.note} style={{ marginTop: 10 }}>
            Staff can look people up but cannot export the list.
          </p>
        )}
      </Panel>
    </>
  );
}
