'use client';

import type { Settings } from '@/lib/domain/types';
import styles from './SiteHeader.module.css';
import { useStoreHours } from './useOpenStatus';

/** Live open/closed indicator. Colour is never the only signal: the words say it too. */
export function OpenNow({ initialSettings, initialNowIso }: { initialSettings: Settings; initialNowIso: string }) {
  const { status } = useStoreHours(initialSettings, initialNowIso);
  return (
    <span className={styles.open} data-testid="open-now">
      <i className={status.open ? styles.on : ''} aria-hidden="true" />
      <span>{status.text}</span>
    </span>
  );
}
