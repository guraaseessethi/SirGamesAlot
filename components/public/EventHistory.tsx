'use client';

import { useRepoData, useNow } from '@/lib/data/hooks';
import type { StoreEvent } from '@/lib/domain/types';
import { formatEventDate, isUpcoming } from '@/lib/events/events';
import { Verify } from '@/components/ui/Verify';
import styles from './Events.module.css';

/** Events that already happened. Past events never appear in the upcoming list. */
export function EventHistory({
  initialEvents,
  initialNowIso,
}: {
  initialEvents: StoreEvent[];
  initialNowIso: string;
}) {
  const events = useRepoData((r) => r.listEvents(), initialEvents);
  const now = useNow(initialNowIso);
  const past = events
    .filter((e) => !isUpcoming(e, now) && !e.seriesId)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
    .slice(0, 5);

  return (
    <section className={styles.past} aria-labelledby="event-history-title">
      <h3 id="event-history-title" className={styles.pastTitle}>
        Event history
      </h3>
      <ul className={styles.pastList}>
        {past.map((e) => (
          <li key={e.id}>
            <span className={styles.pastDate}>{formatEventDate(e, 'MMM d, yyyy')}</span>
            <span>
              {e.title}
              {e.note ? ` · ${e.note}` : ''}
            </span>
          </li>
        ))}
        <li>
          <span className={styles.pastDate}>Every year</span>
          <span>
            May the Fourth · Batman Day <Verify note="dates and details" />
          </span>
        </li>
      </ul>
    </section>
  );
}
