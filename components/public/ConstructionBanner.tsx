'use client';

import Link from 'next/link';
import { Verify } from '@/components/ui/Verify';
import { useRepoData } from '@/lib/data/hooks';
import type { BannerSettings } from '@/lib/domain/types';
import styles from './SiteHeader.module.css';

/** Temporary notice, editable (and switchable off) in admin Settings. */
export function ConstructionBanner({ initial }: { initial: BannerSettings }) {
  const banner = useRepoData(async (r) => (await r.getSettings()).banner, initial);
  if (!banner.enabled) return null;
  return (
    <div className={styles.alert} role="status" data-testid="construction-banner">
      <div className={`wrap ${styles.alertInner}`}>
        <span>
          <b>{banner.headline}</b> {banner.body} <Verify note="construction notice and entrance directions" />
        </span>
        <Link href={banner.linkHref}>{banner.linkLabel}</Link>
      </div>
    </div>
  );
}
