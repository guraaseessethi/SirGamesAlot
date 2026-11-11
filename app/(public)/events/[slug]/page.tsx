import type { Metadata } from 'next';
import { EventDetail } from '@/components/public/EventDetail';
import sections from '@/components/public/Sections.module.css';
import { JsonLd } from '@/components/ui/JsonLd';
import { eventJsonLd } from '@/lib/content/seo';
import { getRepository } from '@/lib/data';
import { formatEventDate } from '@/lib/events/events';
import { seatSummary } from '@/lib/events/seats';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = await getRepository().getEventBySlug(slug);
  if (!event) return { title: 'Event', robots: { index: false } };
  return {
    title: `${event.title}, ${formatEventDate(event, 'MMM d')}`,
    description: `${event.title} at Sir Games-A-Lot in Barrie on ${formatEventDate(event)}. ${event.note}`,
    alternates: { canonical: `/events/${event.slug}` },
  };
}

export default async function EventPage({ params }: Params) {
  const { slug } = await params;
  const repo = getRepository();
  const event = await repo.getEventBySlug(slug);
  const signups = event ? await repo.listSignups(event.id) : [];
  const seats = event && event.capacity > 0 ? seatSummary(event.capacity, signups).left : null;
  return (
    <>
      {event && <JsonLd data={eventJsonLd(event, seats)} />}
      <div className={`wrap ${sections.pageBody}`}>
        <EventDetail
          slug={slug}
          initialEvent={event}
          initialSignups={signups}
          initialNowIso={new Date().toISOString()}
        />
      </div>
    </>
  );
}
