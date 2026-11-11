'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { STORE_TZ } from '@/lib/hours/hours';
import styles from './Admin.module.css';

export function Panel({
  title,
  action,
  children,
  id,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  const headId = id ? `${id}-title` : undefined;
  return (
    <section className={styles.panel} aria-labelledby={headId}>
      <div className={styles.panelHead}>
        <h2 id={headId}>{title}</h2>
        {action}
      </div>
      <div className={styles.panelBody}>{children}</div>
    </section>
  );
}

export function PageTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={styles.pageTitle}>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}

type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'muted';
export function Badge({ tone = 'muted', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}

export function ABtn({
  kind = 'default',
  className,
  type = 'button',
  ...rest
}: { kind?: 'default' | 'primary' | 'danger' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[kind] ?? ''} ${className ?? ''}`}
      {...rest}
    />
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: Tone;
}) {
  return (
    <div className={`${styles.stat} ${tone ? styles[`stat-${tone}`] : ''}`}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export const when = (iso: string) => formatInTimeZone(new Date(iso), STORE_TZ, 'EEE MMM d, h:mm a');
export const ago = (iso: string | Date) =>
  formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
export const contactOf = (c: { phone?: string; email?: string }) =>
  [c.phone, c.email].filter(Boolean).join(' · ') || '—';
