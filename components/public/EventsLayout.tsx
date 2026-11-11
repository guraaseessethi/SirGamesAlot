import type { EventSignup, StoreEvent } from '@/lib/domain/types';
import { AnniversaryFlyer } from './AnniversaryFlyer';
import { EventHistory } from './EventHistory';
import { EventsExplorer } from './EventsExplorer';
import styles from './Events.module.css';

export function EventsLayout({
  events,
  signups,
  nowIso,
  anniversaryLabel,
  limit,
}: {
  events: StoreEvent[];
  signups: EventSignup[];
  nowIso: string;
  anniversaryLabel: string;
  limit?: number;
}) {
  return (
    <div className={styles.grid}>
      <div>
        <AnniversaryFlyer initialLabel={anniversaryLabel} />
        <EventHistory initialEvents={events} initialNowIso={nowIso} />
      </div>
      <EventsExplorer initialEvents={events} initialSignups={signups} initialNowIso={nowIso} limit={limit} />
    </div>
  );
}
