'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SiteHeader.module.css';

const LINKS = [
  { href: '/stock', label: 'Stock' },
  { href: '/events', label: 'Events' },
  { href: '/#roll', label: 'Roll for it' },
  { href: '/visit', label: 'Visit' },
  { href: '/special-order', label: 'Special order' },
];

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav} aria-label="Main">
      {LINKS.map((l) => {
        const current =
          !l.href.includes('#') && (pathname === l.href || pathname.startsWith(`${l.href}/`));
        return (
          <Link key={l.href} href={l.href} aria-current={current ? 'page' : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
