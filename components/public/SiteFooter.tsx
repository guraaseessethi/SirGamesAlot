import Link from 'next/link';
import { SignText } from '@/components/ui/Sign';
import { STORE } from '@/lib/content/store';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.foot}>
      <div className={`wrap ${styles.inner}`}>
        <SignText className={styles.sign} />
        <div className={styles.text}>
          <p>
            Barrie since {STORE.foundedYear} · {STORE.fullAddress}
          </p>
          <p>
            Concept homepage by Kooht Studio · <Link href="/admin">Back-office demo</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
