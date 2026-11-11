import { D20 } from './D20';
import styles from './Sign.module.css';

/** "Sir Games-A-Lot" as it appears on the storefront sign. The text is read as "Sir Games-A-Lot". */
export function SignText({ className = '' }: { className?: string }) {
  return (
    <span className={`${styles.sign} ${className}`}>
      <span className="sr-only">Sir Games-A-Lot</span>
      <span aria-hidden="true">
        Sir Games-A-L
        <D20 className={styles.d20} />t
      </span>
    </span>
  );
}
