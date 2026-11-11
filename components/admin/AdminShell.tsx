'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { SignText } from '@/components/ui/Sign';
import { useToast } from '@/components/ui/Toast';
import { getRepository } from '@/lib/data';
import { ABtn } from './AdminUi';
import { RoleProvider, useRole } from './role';
import styles from './Admin.module.css';

const NAV = [
  { href: '/admin/today', label: 'Today' },
  { href: '/admin/stock', label: 'Stock' },
  { href: '/admin/holds', label: 'Holds & orders' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/outbox', label: 'Outbox' },
  { href: '/admin/settings', label: 'Settings', ownerOnly: true },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <Frame>{children}</Frame>
    </RoleProvider>
  );
}

function Frame({ children }: { children: ReactNode }) {
  const { role, ready, setRole } = useRole();
  const pathname = usePathname();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);

  async function reset() {
    await getRepository().resetDemo();
    setConfirmReset(false);
    toast('Demo data reset to the sample data.');
  }

  return (
    <div className={styles.shell}>
      <div className={styles.demoBar}>
        <b>Demo.</b> Real staff login comes in the full build.
      </div>
      <header className={styles.top}>
        <div className={`wrap ${styles.topInner}`}>
          <Link href="/admin/today" className={styles.brand}>
            <SignText />
            <small>Back office</small>
          </Link>
          {role && (
            <div className={styles.tools}>
              <span>
                Signed in as <b>{role === 'owner' ? 'Owner' : 'Staff'}</b>
              </span>
              <ABtn onClick={() => setRole(null)}>Switch role</ABtn>
              {confirmReset ? (
                <>
                  <ABtn kind="danger" onClick={reset}>
                    Yes, reset all demo data
                  </ABtn>
                  <ABtn onClick={() => setConfirmReset(false)}>Cancel</ABtn>
                </>
              ) : (
                <ABtn onClick={() => setConfirmReset(true)}>Reset demo data</ABtn>
              )}
              <Link href="/" style={{ color: '#fff' }}>
                View public site
              </Link>
            </div>
          )}
        </div>
      </header>
      {role && (
        <nav className={styles.nav} aria-label="Back office">
          <div className={`wrap ${styles.navInner}`}>
            {NAV.filter((n) => !n.ownerOnly || role === 'owner').map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={pathname === n.href ? 'page' : undefined}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
      <main id="main" tabIndex={-1} className={`wrap ${styles.main}`}>
        {!ready ? <p>Loading…</p> : role ? children : <RolePicker />}
      </main>
    </div>
  );
}

function RolePicker() {
  const { setRole } = useRole();
  return (
    <section aria-labelledby="pick-title">
      <h1
        id="pick-title"
        style={{
          fontFamily: 'var(--display)',
          fontWeight: 400,
          textTransform: 'uppercase',
          fontSize: 34,
          marginBottom: 8,
        }}
      >
        Who&apos;s at the counter?
      </h1>
      <p className={styles.note} style={{ marginBottom: 16, fontSize: 15 }}>
        Demo. Real staff login comes in the full build. Pick a role to see what each person would be
        allowed to do.
      </p>
      <div className={styles.picker}>
        <button type="button" className={styles.pickCard} onClick={() => setRole('owner')}>
          <b>Owner</b>
          <span>
            Everything: settings, hours, the construction banner, exports and customer data.
          </span>
        </button>
        <button type="button" className={styles.pickCard} onClick={() => setRole('staff')}>
          <b>Staff</b>
          <span>
            Holds, special orders, event check-in and stock overrides. No exports, no settings.
          </span>
        </button>
      </div>
    </section>
  );
}
