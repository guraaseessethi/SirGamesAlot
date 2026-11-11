import { ButtonLink } from '@/components/ui/Button';
import { STORE } from '@/lib/content/store';
import type { Settings } from '@/lib/domain/types';
import { CopyAddress } from './CopyAddress';
import { EntranceMap } from './EntranceMap';
import { HoursCard } from './HoursCard';
import styles from './Visit.module.css';

export function VisitSection({ settings, nowIso }: { settings: Settings; nowIso: string }) {
  return (
    <div className={styles.visit}>
      <HoursCard initialSettings={settings} initialNowIso={nowIso} />
      <div className={styles.vcard}>
        <h3>Find us</h3>
        <p className={styles.addr}>{STORE.fullAddress}</p>
        <p className={styles.contact}>
          <a href={STORE.phoneHref}>{STORE.phone}</a> ·{' '}
          <a href={`mailto:${STORE.email}`}>{STORE.email}</a>
        </p>
        <EntranceMap />
        <div className={styles.social}>
          <CopyAddress />
          <ButtonLink size="sm" variant="white" href={STORE.facebook} external>
            Facebook
          </ButtonLink>
          <ButtonLink size="sm" variant="white" href={STORE.instagram} external>
            Instagram
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
