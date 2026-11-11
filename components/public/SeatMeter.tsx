import { seatText, type SeatSummary } from '@/lib/events/seats';
import styles from './SeatMeter.module.css';

/** The bar is decorative; the text under it carries the same information. */
export function SeatMeter({ summary }: { summary: SeatSummary }) {
  return (
    <div>
      {summary.hasSeats && (
        <div className={`${styles.bar} ${summary.left <= 2 ? styles.hot : ''}`} aria-hidden="true">
          <i style={{ width: `${summary.percentTaken}%` }} />
        </div>
      )}
      <div className={styles.text} data-testid="seat-text">
        {seatText(summary)}
      </div>
    </div>
  );
}
