'use client';

import { Verify } from '@/components/ui/Verify';
import { useRepoData } from '@/lib/data/hooks';
import styles from './Events.module.css';

/** The comic-flyer panel. The next date is a setting, so the owner can announce it without a developer. */
export function AnniversaryFlyer({ initialLabel }: { initialLabel: string }) {
  const label = useRepoData(async (r) => (await r.getSettings()).nextAnniversaryLabel, initialLabel);
  return (
    <div className={styles.flyer}>
      <div className={styles.p1}>
        <div className="kick" style={{ color: 'var(--ink)' }}>
          Our biggest day of the year
        </div>
        <h3 className={styles.flyerTitle}>Anniversary Event!</h3>
        <div className={styles.when}>
          Next: {label} · usually 10 am to 5 pm <Verify note="date, time" />
        </div>
      </div>
      <div className={styles.p2}>
        <ul>
          <li>Sales</li>
          <li>Vendors</li>
          <li>Gaming</li>
          <li>Snacks</li>
          <li>Cosplay contest</li>
        </ul>
      </div>
      <div className={styles.p3}>
        <b>Come in costume</b>
        An extra $5 off for anyone in cosplay, all day. Any theme. <Verify note="is the $5 cosplay discount still on?" />
      </div>
    </div>
  );
}
