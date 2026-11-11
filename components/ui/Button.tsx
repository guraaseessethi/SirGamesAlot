import Link from 'next/link';
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type Variant = 'yellow' | 'blue' | 'white' | 'done' | 'red';
type Size = 'md' | 'sm';

function cls(variant: Variant, size: Size, extra?: string) {
  return [styles.btn, styles[variant], size === 'sm' ? styles.sm : '', extra ?? '']
    .filter(Boolean)
    .join(' ');
}

interface Common {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = 'yellow',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cls(variant, size, className)} {...rest} />;
}

export function ButtonLink({
  variant = 'yellow',
  size = 'md',
  href,
  className,
  external,
  ...rest
}: Common &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string; external?: boolean }) {
  const isInternal = href.startsWith('/') && !external;
  if (isInternal) return <Link href={href} className={cls(variant, size, className)} {...rest} />;
  return (
    <a
      href={href}
      className={cls(variant, size, className)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    />
  );
}
