import type { Metadata } from 'next';
import { EventsLayout } from '@/components/public/EventsLayout';
import { PageHero } from '@/components/public/Sections';
import sections from '@/components/public/Sections.module.css';
import { getRepository } from '@/lib/data';
import { isUpcoming } from '@/lib/events/events';

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Warhammer tournaments, paint nights, Riftbound league, D&D one-shots and our yearly anniversary event at Sir Games-A-Lot in Barrie. See dates, costs and seats left.',
  alternates: { canonical: '/events' },
};

export default async function EventsPage() {
  const repo = getRepository();
  const now = new Date();
  const [settings, events, signups] = await Promise.all([
    repo.getSettings(),
    repo.listEvents(),
    repo.listSignups(),
  ]);
  return (
    <>
      <PageHero kicker="Events" title="Sales, cosplay & game days">
        Every event is on one calendar, with times, costs and seats. Save a seat, add it to your
        calendar, or join the waitlist when it&apos;s full.
      </PageHero>
      <div className={`wrap ${sections.pageBody}`}>
        <EventsLayout
          events={events.filter((e) => isUpcoming(e, now) || !e.seriesId)}
          signups={signups}
          nowIso={now.toISOString()}
          anniversaryLabel={settings.nextAnniversaryLabel}
        />
      </div>
    </>
  );
}
