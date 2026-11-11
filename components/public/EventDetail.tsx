'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useRepoData, useNow } from '@/lib/data/hooks';
import { EVENT_TYPE_LABELS, type EventSignup, type StoreEvent } from '@/lib/domain/types';
import { downloadIcs } from '@/lib/events/download';
import { formatEventDate, isUpcoming } from '@/lib/events/events';
import { seatSummary } from '@/lib/events/seats';
import { STORE } from '@/lib/content/store';
import { formatTime } from '@/lib/hours/hours';
import { formatFee } from '@/lib/money';
import { SeatMeter } from './SeatMeter';

// Loaded on demand, like the stock request form.
const loadSignup = () => import('./SignupDialog');
const SignupDialog = dynamic(() => loadSignup().then((m) => m.SignupDialog), { ssr: false });
import styles from './EventDetail.module.css';

export function EventDetail({
  slug,
  initialEvent,
  initialSignups,
  initialNowIso,
}: {
  slug: string;
  initialEvent: StoreEvent | null;
  initialSignups: EventSignup[];
  initialNowIso: string;
}) {
  // Events added in the admin demo only exist in this browser, so look the slug up here too.
  const event = useRepoData((r) => r.getEventBySlug(slug), initialEvent);
  const signups = useRepoData(
    (r) => (event ? r.listSignups(event.id) : Promise.resolve([])),
    initialSignups,
  );
  const now = useNow(initialNowIso);
  const [open, setOpen] = useState(false);

  if (!event) {
    return (
      <div className={styles.missing}>
        <h2>We couldn&apos;t find that event</h2>
        <p>It may have already happened, or the date changed.</p>
        <ButtonLink variant="blue" href="/events">
          See all events
        </ButtonLink>
      </div>
    );
  }

  const summary = seatSummary(event.capacity, signups);
  const upcoming = isUpcoming(event, now);

  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <span className={styles.type}>{EVENT_TYPE_LABELS[event.type]}</span>
        <h1>{event.title}</h1>
        <p className={styles.when}>
          {formatEventDate(event)} · {formatTime(event.startTime)} – {formatTime(event.endTime)}
        </p>
      </div>
      <div className={styles.body}>
        <p>{event.description || event.note}</p>
        <dl className={styles.facts}>
          <div>
            <dt>Where</dt>
            <dd>
              {STORE.name}, lower level, Bayfield Mall
              <br />
              {STORE.fullAddress}
            </dd>
          </div>
          <div>
            <dt>Cost</dt>
            <dd>
              {event.feeCents > 0 ? `${formatFee(event.feeCents)}, pay at the counter` : 'Free'}
            </dd>
          </div>
          <div>
            <dt>Seats</dt>
            <dd>
              <SeatMeter summary={summary} />
            </dd>
          </div>
        </dl>
        {upcoming ? (
          <div className={styles.actions}>
            {summary.hasSeats && (
              <Button onClick={() => setOpen(true)}>
                {summary.full ? 'Join the waitlist' : 'Save a seat'}
              </Button>
            )}
            <Button variant="white" onClick={() => downloadIcs(event)}>
              Add to calendar (.ics)
            </Button>
            <Link className={styles.back} href="/events">
              All events
            </Link>
          </div>
        ) : (
          <p className={styles.past}>
            This event has already happened. See what&apos;s coming up on the events page.
          </p>
        )}
      </div>
      {open && <SignupDialog event={event} onClose={() => setOpen(false)} />}
    </article>
  );
}
