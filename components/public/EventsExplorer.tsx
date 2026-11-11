'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useIdlePrefetch, useRepoData, useNow } from '@/lib/data/hooks';
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  type EventSignup,
  type EventType,
  type StoreEvent,
} from '@/lib/domain/types';
import { downloadIcs } from '@/lib/events/download';
import { formatEventDate, isUpcoming } from '@/lib/events/events';
import { seatSummary } from '@/lib/events/seats';
import { formatTime } from '@/lib/hours/hours';
import { formatFee } from '@/lib/money';
import { SeatMeter } from './SeatMeter';

// Loaded on demand, like the stock request form.
const loadSignup = () => import('./SignupDialog');
const SignupDialog = dynamic(() => loadSignup().then((m) => m.SignupDialog), { ssr: false });
import styles from './Events.module.css';

export function useEventData(initial: {
  events: StoreEvent[];
  signups: EventSignup[];
  nowIso: string;
}) {
  const events = useRepoData((r) => r.listEvents(), initial.events);
  const signups = useRepoData((r) => r.listSignups(), initial.signups);
  const now = useNow(initial.nowIso);
  return { events, signups, now };
}

export function EventCard({
  event,
  signups,
  onSave,
  headingLevel = 3,
}: {
  event: StoreEvent;
  signups: EventSignup[];
  onSave: (e: StoreEvent) => void;
  headingLevel?: 3 | 4;
}) {
  const summary = seatSummary(
    event.capacity,
    signups.filter((s) => s.eventId === event.id),
  );
  const Heading = `h${headingLevel}` as const;
  return (
    <li className={styles.ev} data-testid="event-card">
      <div className={styles.date} aria-hidden="true">
        <div className={styles.m}>{formatEventDate(event, 'MMM')}</div>
        <div className={styles.d}>{formatEventDate(event, 'd')}</div>
        <div className={styles.w}>{formatEventDate(event, 'EEE')}</div>
      </div>
      <div className={styles.body}>
        <Heading className={styles.title}>
          <Link href={`/events/${event.slug}`}>{event.title}</Link>
        </Heading>
        <div className={styles.info}>
          {formatEventDate(event, 'EEEE, MMM d')} · {formatTime(event.startTime)} –{' '}
          {formatTime(event.endTime)}
          {event.note ? ` · ${event.note}` : ''}
        </div>
        <SeatMeter summary={summary} />
      </div>
      <div className={styles.act}>
        <span className={styles.fee}>{formatFee(event.feeCents)}</span>
        {summary.hasSeats ? (
          <Button
            size="sm"
            variant="white"
            onClick={() => onSave(event)}
            aria-label={`${summary.full ? 'Join the waitlist' : 'Save a seat'}: ${event.title}, ${formatEventDate(event, 'MMM d')}`}
          >
            {summary.full ? 'Waitlist' : 'Save a seat'}
          </Button>
        ) : (
          <span className={styles.drop}>Drop in</span>
        )}
        <button
          type="button"
          className={styles.link}
          onClick={() => downloadIcs(event)}
          aria-label={`Add to calendar: ${event.title}, ${formatEventDate(event, 'MMM d')}`}
        >
          Add to calendar
        </button>
      </div>
    </li>
  );
}

export function EventsExplorer({
  initialEvents,
  initialSignups,
  initialNowIso,
  limit,
  headingLevel = 3,
}: {
  initialEvents: StoreEvent[];
  initialSignups: EventSignup[];
  initialNowIso: string;
  /** Home page shows the next few; /events shows everything. */
  limit?: number;
  headingLevel?: 3 | 4;
}) {
  useIdlePrefetch(loadSignup);
  const { events, signups, now } = useEventData({
    events: initialEvents,
    signups: initialSignups,
    nowIso: initialNowIso,
  });
  const [type, setType] = useState<EventType | 'all'>('all');
  const [dialog, setDialog] = useState<StoreEvent | null>(null);

  const upcoming = useMemo(() => events.filter((e) => isUpcoming(e, now)), [events, now]);
  const shown = useMemo(() => {
    const filtered = upcoming.filter((e) => type === 'all' || e.type === type);
    return limit ? filtered.slice(0, limit) : filtered;
  }, [upcoming, type, limit]);
  const presentTypes = EVENT_TYPES.filter((t) => upcoming.some((e) => e.type === t));

  return (
    <div>
      <div className={styles.filters} role="group" aria-label="Event type">
        <button type="button" aria-pressed={type === 'all'} onClick={() => setType('all')}>
          All
        </button>
        {presentTypes.map((t) => (
          <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)}>
            {EVENT_TYPE_LABELS[t]}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {shown.length} upcoming {shown.length === 1 ? 'event' : 'events'}
      </p>
      {shown.length === 0 ? (
        <p className={styles.empty}>
          No upcoming events of that type right now. Check back soon or call 705-719-1291.
        </p>
      ) : (
        <ul className={styles.cal}>
          {shown.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              signups={signups}
              onSave={setDialog}
              headingLevel={headingLevel}
            />
          ))}
        </ul>
      )}
      <p className={styles.fineprint}>
        <span className="sample">
          Example schedule. Real dates, costs and seats come from the store.
        </span>
      </p>
      <p className={styles.fee2}>Fees are paid at the counter. No online payment.</p>
      {dialog && <SignupDialog event={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}
